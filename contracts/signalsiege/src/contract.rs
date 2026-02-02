// SignalSiege - Contract Implementation
// Turn-based strategy game with cross-chain sync

#![cfg_attr(target_arch = "wasm32", no_main)]

mod state;

use std::str::FromStr;

use linera_sdk::{
    linera_base_types::{AccountOwner, ChainId, WithContractAbi},
    views::{RootView, View},
    Contract, ContractRuntime,
};

use signalsiege::{
    Board, Cell, Escrow, GameAction, GameRoom, GameStatus,
    InstantiationArgument, Message, MoveResultResponse, Player, PlayerProfile,
    PuzzleResultResponse, PuzzleState, Rewards, RoomCreatedResponse, RoomJoinedResponse,
    SignalSiegeAbi, SignalSiegeError, SignalSiegeResponse, SuccessResponse,
    TileInventory, TileKind, Rotation, get_day_index, verify_eip191_signature,
    MAX_TURNS,
};
use state::SignalSiegeState;

pub struct SignalSiegeContract {
    state: SignalSiegeState,
    runtime: ContractRuntime<Self>,
}

/// Helper to convert AccountOwner to a consistent wallet address string
/// Uses Display format which produces lowercase hex: 0x...
fn owner_to_wallet(owner: &AccountOwner) -> String {
    format!("{}", owner).to_lowercase()
}

linera_sdk::contract!(SignalSiegeContract);

impl WithContractAbi for SignalSiegeContract {
    type Abi = SignalSiegeAbi;
}

impl Contract for SignalSiegeContract {
    type Message = Message;
    type InstantiationArgument = InstantiationArgument;
    type Parameters = ();
    type EventValue = ();

    async fn load(runtime: ContractRuntime<Self>) -> Self {
        let state = SignalSiegeState::load(runtime.root_view_storage_context())
            .await
            .expect("Failed to load state");
        Self { state, runtime }
    }

    async fn instantiate(&mut self, argument: InstantiationArgument) {
        if let Some(hub_id) = argument.hub_chain_id {
            self.state.hub_chain_id.set(Some(hub_id));
        }
        self.state.is_hosting.set(false);
        self.state.recent_rooms.set(Vec::new());
        self.state.leaderboard.set(Vec::new());
    }

    async fn execute_operation(&mut self, operation: signalsiege::Operation) -> SignalSiegeResponse {
        use signalsiege::Operation;
        
        let owner = self.runtime.authenticated_signer().expect("No signer");

        match operation {
            // === Player Management ===
            Operation::Register { username } => self.handle_register(owner, username).await,
            
            Operation::LinkIdentity { evm_address, message, signature } => {
                self.handle_link_identity(owner, evm_address, message, signature).await
            }
            
            // === Daily Claim ===
            Operation::ClaimDaily => self.handle_claim_daily(owner).await,
            
            // === Daily Puzzle ===
            Operation::StartDailyPuzzle => self.handle_start_daily_puzzle(owner).await,
            Operation::PlayPuzzleTurn { action } => self.handle_play_puzzle_turn(owner, action).await,
            
            // === Training ===
            Operation::StartTraining { map_id } => self.handle_start_training(owner, map_id).await,
            Operation::PlayTrainingTurn { action } => self.handle_play_training_turn(owner, action).await,
            
            // === PvP Room Management ===
            Operation::CreateRoom { map_id, stake_amount } => {
                self.handle_create_room(owner, map_id, stake_amount).await
            }
            Operation::JoinRoom { host_chain_id } => {
                self.handle_join_room(owner, host_chain_id).await
            }
            Operation::LeaveRoom => self.handle_leave_room(owner).await,
            Operation::ClearRoom => self.handle_clear_room(owner).await,
            
            // === PvP Wagering ===
            Operation::RequestDeposit => self.handle_request_deposit(owner).await,
            Operation::ConfirmReady => self.handle_confirm_ready(owner).await,
            
            // === Gameplay ===
            Operation::PlayTurn { action } => self.handle_play_turn(owner, action).await,
            
            // === Forfeit ===
            Operation::Forfeit => self.handle_forfeit(owner).await,
            
            // === Sync ===
            Operation::SyncInbox => SignalSiegeResponse::Success(SuccessResponse {
                message: "Inbox synced".to_string(),
            }),
        }
    }

    async fn execute_message(&mut self, message: Message) {
        match message {
            Message::JoinRequest {
                joiner_chain_id,
                joiner_wallet,
                joiner_username,
            } => {
                self.handle_join_request(joiner_chain_id, joiner_wallet, joiner_username)
                    .await;
            }

            Message::GameStateSync { room } => {
                self.state.game_room.set(Some(room.clone()));
                self.state.joined_host_chain.set(Some(room.host_chain_id));
            }

            Message::GameMoveSync { room } => {
                self.state.game_room.set(Some(room));
            }

            Message::MatchEnded {
                winner,
                reason: _,
                final_room,
            } => {
                self.state.game_room.set(Some(final_room.clone()));
                
                // Update player stats
                if let Some(winner_player) = winner {
                    for (i, wallet) in final_room.player_wallets.iter().enumerate() {
                        if let Ok(Some(mut profile)) = self.state.players.get(&wallet.to_string()).await {
                            if Player::from_index(i) == Some(winner_player) {
                                profile.total_wins += 1;
                                profile.pvp_wins += 1;
                            } else {
                                profile.total_losses += 1;
                                profile.pvp_losses += 1;
                            }
                            profile.total_games += 1;
                            let _ = self.state.players.insert(&wallet.to_string(), profile);
                        }
                    }
                }
            }

            Message::PlayerLeft {
                player_chain_id: _,
                player_wallet: _,
            } => {
                // Mark room as abandoned
                if let Some(mut room) = self.state.game_room.get().clone() {
                    room.status = GameStatus::Abandoned;
                    self.state.game_room.set(Some(room));
                }
            }

            // Hub chain escrow messages
            Message::EscrowOpen {
                match_id,
                host_wallet,
                stake_amount,
            } => {
                let mut escrow = Escrow::new(match_id.clone(), stake_amount);
                escrow.add_player(host_wallet);
                escrow.created_at = self.runtime.system_time().micros();
                let _ = self.state.escrows.insert(&match_id, escrow);
            }

            Message::EscrowJoin {
                match_id,
                joiner_wallet,
            } => {
                if let Ok(Some(mut escrow)) = self.state.escrows.get(&match_id).await {
                    escrow.add_player(joiner_wallet);
                    let _ = self.state.escrows.insert(&match_id, escrow);
                }
            }

            Message::EscrowDeposit {
                match_id,
                player_wallet,
                amount,
            } => {
                if let Ok(Some(mut escrow)) = self.state.escrows.get(&match_id).await {
                    // Verify balance and deduct
                    if let Ok(Some(balance)) = self.state.balances.get(&player_wallet).await {
                        if balance >= amount {
                            let _ = self.state.balances.insert(&player_wallet, balance - amount);
                            escrow.deposit(&player_wallet, amount);
                            let _ = self.state.escrows.insert(&match_id, escrow);
                        }
                    }
                }
            }

            Message::EscrowSettle {
                match_id,
                winner_wallet,
            } => {
                if let Ok(Some(mut escrow)) = self.state.escrows.get(&match_id).await {
                    if !escrow.is_settled {
                        let total_pot = escrow.total_pot();
                        
                        if let Some(winner) = winner_wallet {
                            // Winner takes all
                            let current = self.state.balances.get(&winner).await.ok().flatten().unwrap_or(0);
                            let _ = self.state.balances.insert(&winner, current + total_pot);
                            escrow.winner_wallet = Some(winner);
                        } else {
                            // Draw - refund deposits
                            for (i, wallet) in escrow.player_wallets.iter().enumerate() {
                                let deposit = escrow.deposits.get(i).copied().unwrap_or(0);
                                let current = self.state.balances.get(wallet).await.ok().flatten().unwrap_or(0);
                                let _ = self.state.balances.insert(wallet, current + deposit);
                            }
                        }
                        
                        escrow.is_settled = true;
                        let _ = self.state.escrows.insert(&match_id, escrow);
                    }
                }
            }

            Message::RewardCredit {
                player_wallet,
                amount,
                reason: _,
            } => {
                let current = self.state.balances.get(&player_wallet).await.ok().flatten().unwrap_or(0);
                let _ = self.state.balances.insert(&player_wallet, current + amount);
            }
        }
    }

    async fn store(mut self) {
        self.state.save().await.expect("Failed to save state");
    }
}

// Helper trait for Player
trait PlayerExt {
    fn from_index(idx: usize) -> Option<Player>;
}

impl PlayerExt for Player {
    fn from_index(idx: usize) -> Option<Player> {
        match idx {
            0 => Some(Player::One),
            1 => Some(Player::Two),
            _ => None,
        }
    }
}

impl SignalSiegeContract {
    // ========================================================================
    // PLAYER MANAGEMENT
    // ========================================================================

    async fn handle_register(&mut self, owner: AccountOwner, username: String) -> SignalSiegeResponse {
        let wallet = owner_to_wallet(&owner);

        // Check if already registered
        if self.state.players.get(&wallet).await.ok().flatten().is_some() {
            return SignalSiegeError::AlreadyRegistered.into_response();
        }

        // Validate username
        if username.is_empty() || username.len() > 20 {
            return SignalSiegeError::InvalidUsername.into_response();
        }

        let profile = PlayerProfile {
            username: username.clone(),
            linera_address: wallet.clone(),
            evm_address: None,
            identity_verified: false,
            coins: Rewards::DAILY_CLAIM, // Start with 50 coins
            total_wins: 0,
            total_losses: 0,
            total_draws: 0,
            total_games: 0,
            pvp_wins: 0,
            pvp_losses: 0,
            puzzle_wins: 0,
            puzzle_attempts: 0,
            last_claim_day: 0,
            last_puzzle_day: 0,
            created_at: self.runtime.system_time().micros(),
        };

        let _ = self.state.players.insert(&wallet, profile);

        SignalSiegeResponse::Success(SuccessResponse {
            message: format!("Registered as {}", username),
        })
    }

    async fn handle_link_identity(
        &mut self,
        owner: AccountOwner,
        evm_address: String,
        message: String,
        signature: String,
    ) -> SignalSiegeResponse {
        let wallet = owner_to_wallet(&owner);

        let profile = match self.state.players.get(&wallet).await {
            Ok(Some(p)) => p,
            _ => return SignalSiegeError::NotRegistered.into_response(),
        };

        // Verify signature
        let is_valid = verify_eip191_signature(&message, &signature, &evm_address);
        
        let mut updated_profile = profile.clone();
        updated_profile.evm_address = Some(evm_address.to_lowercase());
        updated_profile.identity_verified = is_valid;

        let _ = self.state.players.insert(&wallet, updated_profile);

        if is_valid {
            SignalSiegeResponse::Success(SuccessResponse {
                message: "Identity linked and verified".to_string(),
            })
        } else {
            SignalSiegeResponse::Success(SuccessResponse {
                message: "Identity linked but signature unverified. Wager features disabled.".to_string(),
            })
        }
    }

    // ========================================================================
    // DAILY CLAIM
    // ========================================================================

    async fn handle_claim_daily(&mut self, owner: AccountOwner) -> SignalSiegeResponse {
        let wallet = owner_to_wallet(&owner);
        
        let mut profile = match self.state.players.get(&wallet).await {
            Ok(Some(p)) => p,
            _ => return SignalSiegeError::NotRegistered.into_response(),
        };

        let current_day = get_day_index(self.runtime.system_time().micros());

        if profile.last_claim_day >= current_day {
            return SignalSiegeError::AlreadyClaimedToday.into_response();
        }

        profile.coins += Rewards::DAILY_CLAIM;
        profile.last_claim_day = current_day;
        
        let _ = self.state.players.insert(&wallet, profile);

        SignalSiegeResponse::Success(SuccessResponse {
            message: format!("Claimed {} coins!", Rewards::DAILY_CLAIM),
        })
    }

    // ========================================================================
    // DAILY PUZZLE
    // ========================================================================

    async fn handle_start_daily_puzzle(&mut self, owner: AccountOwner) -> SignalSiegeResponse {
        let wallet = owner_to_wallet(&owner);
        
        let mut profile = match self.state.players.get(&wallet).await {
            Ok(Some(p)) => p,
            _ => return SignalSiegeError::NotRegistered.into_response(),
        };

        let current_day = get_day_index(self.runtime.system_time().micros());

        if profile.last_puzzle_day >= current_day {
            return SignalSiegeError::AlreadyPlayedPuzzleToday.into_response();
        }

        // Create puzzle for today
        let puzzle = PuzzleState::for_day(current_day);
        self.state.puzzle_state.set(Some(puzzle));
        
        // Mark puzzle attempt
        profile.last_puzzle_day = current_day;
        profile.puzzle_attempts += 1;
        let _ = self.state.players.insert(&wallet, profile);

        SignalSiegeResponse::Success(SuccessResponse {
            message: "Daily puzzle started!".to_string(),
        })
    }

    async fn handle_play_puzzle_turn(&mut self, owner: AccountOwner, action: GameAction) -> SignalSiegeResponse {
        let wallet = owner_to_wallet(&owner);
        
        let mut puzzle = match self.state.puzzle_state.get().clone() {
            Some(p) => p,
            None => return SignalSiegeError::GameNotInProgress.into_response(),
        };

        if puzzle.is_completed {
            return SignalSiegeError::GameNotInProgress.into_response();
        }

        // Apply action
        let result = self.apply_puzzle_action(&mut puzzle, &action);
        
        if let Err(e) = result {
            return e.into_response();
        }

        // Run signal propagation (player is always P1 in puzzle)
        let signal_result = puzzle.board.propagate_signal(1);
        
        // Apply captures
        puzzle.board.apply_captures(&signal_result.captured_relays, 1);
        
        puzzle.current_turn += 1;
        
        let mut puzzle_won = false;
        let mut reward = 0u64;

        // Check win condition
        if signal_result.reached_opponent_core {
            puzzle.is_completed = true;
            puzzle.is_won = true;
            puzzle_won = true;
            reward = Rewards::PUZZLE_WIN;
        } else if puzzle.current_turn >= puzzle.target_turns {
            // Out of turns - puzzle failed
            puzzle.is_completed = true;
            puzzle.is_won = false;
            reward = Rewards::PUZZLE_FAIL;
        }

        let turn_msg = format!("Turn {} completed", puzzle.current_turn);
        self.state.puzzle_state.set(Some(puzzle));

        // Apply rewards
        if reward > 0 {
            if let Ok(Some(mut profile)) = self.state.players.get(&wallet).await {
                profile.coins += reward;
                if puzzle_won {
                    profile.puzzle_wins += 1;
                }
                let _ = self.state.players.insert(&wallet, profile);
            }
        }

        SignalSiegeResponse::PuzzleResult(PuzzleResultResponse {
            success: true,
            message: if puzzle_won { 
                "Puzzle completed!".to_string() 
            } else { 
                turn_msg
            },
            signal_result: Some(signal_result),
            puzzle_won,
            reward,
        })
    }

    fn apply_puzzle_action(&self, puzzle: &mut PuzzleState, action: &GameAction) -> Result<(), SignalSiegeError> {
        match action.action_type.as_str() {
            "place" => {
                let tile_kind = action.tile_kind.ok_or(SignalSiegeError::InvalidMove)?;
                let rotation = action.rotation.unwrap_or(Rotation::R0);
                let pos = action.position as usize;

                if pos >= puzzle.board.cells.len() {
                    return Err(SignalSiegeError::InvalidMove);
                }

                if puzzle.board.cells[pos].kind != TileKind::Empty {
                    return Err(SignalSiegeError::CellNotEmpty);
                }

                if !puzzle.inventory.has_tile(tile_kind) {
                    return Err(SignalSiegeError::TileNotInInventory);
                }

                puzzle.inventory.remove_tile(tile_kind);
                puzzle.board.cells[pos] = Cell {
                    kind: tile_kind,
                    rotation,
                    owner: 1, // Player owns placed tiles
                };

                puzzle.move_history.push(format!("P:{},{},{:?}", pos, tile_kind as u8, rotation));
                Ok(())
            }
            "rotate" => {
                let pos = action.position as usize;
                
                if pos >= puzzle.board.cells.len() {
                    return Err(SignalSiegeError::InvalidMove);
                }

                let cell = &puzzle.board.cells[pos];
                if cell.owner != 1 || !cell.kind.is_placeable() {
                    return Err(SignalSiegeError::InvalidMove);
                }

                puzzle.board.cells[pos].rotation = cell.rotation.next();
                puzzle.move_history.push(format!("R:{}", pos));
                Ok(())
            }
            _ => Err(SignalSiegeError::InvalidMove),
        }
    }

    // ========================================================================
    // TRAINING MODE
    // ========================================================================

    async fn handle_start_training(&mut self, owner: AccountOwner, map_id: u8) -> SignalSiegeResponse {
        let wallet = owner_to_wallet(&owner);
        
        if self.state.players.get(&wallet).await.ok().flatten().is_none() {
            return SignalSiegeError::NotRegistered.into_response();
        }

        let mut room = GameRoom::new(
            self.runtime.chain_id().to_string(),
            wallet.clone(),
            "Training".to_string(),
            map_id,
            0, // No stake in training
        );
        room.status = GameStatus::InProgress;
        room.inventories = vec![TileInventory::standard(), TileInventory::standard()];
        room.created_at = self.runtime.system_time().micros();

        self.state.training_state.set(Some(room));

        SignalSiegeResponse::Success(SuccessResponse {
            message: "Training match started vs AI".to_string(),
        })
    }

    async fn handle_play_training_turn(&mut self, owner: AccountOwner, action: GameAction) -> SignalSiegeResponse {
        let wallet = owner_to_wallet(&owner);
        
        let mut room = match self.state.training_state.get().clone() {
            Some(r) => r,
            None => return SignalSiegeError::GameNotInProgress.into_response(),
        };

        if room.status != GameStatus::InProgress {
            return SignalSiegeError::GameNotInProgress.into_response();
        }

        // Apply player action
        let result = self.apply_game_action(&mut room, Player::One, &action);
        if let Err(e) = result {
            return e.into_response();
        }

        // Run signal propagation
        let signal_result = room.board.propagate_signal(1);
        room.board.apply_captures(&signal_result.captured_relays, 1);
        room.last_signal = Some(signal_result.clone());

        // Check win
        let mut game_ended = false;
        let mut winner = None;
        
        if signal_result.reached_opponent_core {
            room.status = GameStatus::Finished;
            room.winner = Some(Player::One);
            game_ended = true;
            winner = Some(Player::One);
        } else {
            // Simple AI: random valid move
            self.make_ai_move(&mut room);
            
            // AI signal propagation
            let ai_signal = room.board.propagate_signal(2);
            room.board.apply_captures(&ai_signal.captured_relays, 2);
            
            if ai_signal.reached_opponent_core {
                room.status = GameStatus::Finished;
                room.winner = Some(Player::Two);
                game_ended = true;
                winner = Some(Player::Two);
            }
            
            room.turn_number += 1;
            
            // Check max turns
            if room.turn_number >= MAX_TURNS && !game_ended {
                // Score-based winner
                let p1_score = room.board.calculate_score(1);
                let p2_score = room.board.calculate_score(2);
                
                room.status = if p1_score > p2_score {
                    room.winner = Some(Player::One);
                    winner = Some(Player::One);
                    GameStatus::Finished
                } else if p2_score > p1_score {
                    room.winner = Some(Player::Two);
                    winner = Some(Player::Two);
                    GameStatus::Finished
                } else {
                    GameStatus::Draw
                };
                game_ended = true;
            }
        }

        self.state.training_state.set(Some(room));

        // Training rewards (capped)
        if game_ended && winner == Some(Player::One) {
            let current_day = get_day_index(self.runtime.system_time().micros());
            let today_key = format!("{}:{}", wallet, current_day);
            let today_rewards = self.state.training_rewards_today.get(&today_key).await.ok().flatten().unwrap_or(0);
            
            if today_rewards < Rewards::TRAINING_MAX_DAILY {
                let reward = Rewards::TRAINING_WIN.min(Rewards::TRAINING_MAX_DAILY - today_rewards);
                if let Ok(Some(mut profile)) = self.state.players.get(&wallet).await {
                    profile.coins += reward;
                    let _ = self.state.players.insert(&wallet, profile);
                }
                let _ = self.state.training_rewards_today.insert(&today_key, today_rewards + reward);
            }
        }

        SignalSiegeResponse::MoveResult(MoveResultResponse {
            success: true,
            message: "Move applied".to_string(),
            signal_result: Some(signal_result),
            game_ended,
            winner,
        })
    }

    fn make_ai_move(&self, room: &mut GameRoom) {
        // Simple AI: find first empty cell and place a straight wire
        let inventory = room.inventories.get_mut(1);
        if inventory.is_none() {
            return;
        }
        let inventory = inventory.unwrap();

        for (idx, cell) in room.board.cells.iter_mut().enumerate() {
            if cell.kind == TileKind::Empty {
                // Try to place a tile
                if inventory.wire_straight > 0 {
                    cell.kind = TileKind::WireStraight;
                    cell.owner = 2;
                    inventory.wire_straight -= 1;
                    room.move_history.push(format!("AI:P:{},0", idx));
                    return;
                } else if inventory.wire_corner > 0 {
                    cell.kind = TileKind::WireCorner;
                    cell.owner = 2;
                    inventory.wire_corner -= 1;
                    room.move_history.push(format!("AI:P:{},1", idx));
                    return;
                }
            }
        }
    }

    // ========================================================================
    // PVP ROOM MANAGEMENT
    // ========================================================================

    async fn handle_create_room(
        &mut self,
        owner: AccountOwner,
        map_id: u8,
        stake_amount: u64,
    ) -> SignalSiegeResponse {
        let wallet = owner_to_wallet(&owner);
        
        let profile = match self.state.players.get(&wallet).await {
            Ok(Some(p)) => p,
            _ => return SignalSiegeError::NotRegistered.into_response(),
        };

        // Note: identity verification not required for staking - simplified for gameplay
        // Cross-chain verification can be added later for higher-stakes games

        // Check balance for stake
        if stake_amount > 0 && profile.coins < stake_amount {
            return SignalSiegeError::InsufficientBalance.into_response();
        }

        let host_chain_id = self.runtime.chain_id().to_string();
        
        let mut room = GameRoom::new(
            host_chain_id.clone(),
            wallet.clone(),
            profile.username.clone(),
            map_id,
            stake_amount,
        );
        room.player_chain_ids.push(host_chain_id.clone());
        room.inventories = vec![TileInventory::standard()];
        room.created_at = self.runtime.system_time().micros();

        self.state.game_room.set(Some(room.clone()));
        self.state.is_hosting.set(true);

        // If stake > 0, open escrow on hub chain
        if stake_amount > 0 {
            if let Some(hub_chain_str) = self.state.hub_chain_id.get().clone() {
                if let Ok(hub_chain) = ChainId::from_str(&hub_chain_str) {
                    let msg = Message::EscrowOpen {
                        match_id: host_chain_id.clone(),
                        host_wallet: wallet,
                        stake_amount,
                    };
                    self.runtime
                        .prepare_message(msg)
                        .with_authentication()
                        .send_to(hub_chain);
                }
            }
        }

        SignalSiegeResponse::RoomCreated(RoomCreatedResponse {
            host_chain_id,
            room,
        })
    }

    async fn handle_join_room(
        &mut self,
        owner: AccountOwner,
        host_chain_id: String,
    ) -> SignalSiegeResponse {
        let wallet = owner_to_wallet(&owner);
        
        let profile = match self.state.players.get(&wallet).await {
            Ok(Some(p)) => p,
            _ => return SignalSiegeError::NotRegistered.into_response(),
        };

        // Parse host chain ID
        let host_chain = match ChainId::from_str(&host_chain_id) {
            Ok(c) => c,
            Err(_) => return SignalSiegeError::RoomNotFound.into_response(),
        };

        // Send join request
        let joiner_chain_id = self.runtime.chain_id().to_string();
        
        let msg = Message::JoinRequest {
            joiner_chain_id: joiner_chain_id.clone(),
            joiner_wallet: wallet,
            joiner_username: profile.username,
        };

        self.runtime
            .prepare_message(msg)
            .with_authentication()
            .send_to(host_chain);

        self.state.joined_host_chain.set(Some(host_chain_id.clone()));

        SignalSiegeResponse::RoomJoined(RoomJoinedResponse {
            host_chain_id,
            message: "Join request sent".to_string(),
        })
    }

    async fn handle_join_request(
        &mut self,
        joiner_chain_id: String,
        joiner_wallet: String,
        joiner_username: String,
    ) {
        let mut room = match self.state.game_room.get().clone() {
            Some(r) => r,
            None => return,
        };

        if room.status != GameStatus::WaitingForPlayer {
            return;
        }

        if room.player_chain_ids.len() >= 2 {
            return;
        }

        // Add joiner
        room.player_chain_ids.push(joiner_chain_id.clone());
        room.player_wallets.push(joiner_wallet.clone());
        room.usernames.push(joiner_username);
        room.inventories.push(TileInventory::standard());

        // Start game immediately - escrow handled in background
        // Note: For production, you might want to wait for deposit confirmations
        room.status = GameStatus::InProgress;

        self.state.game_room.set(Some(room.clone()));

        // Send game state to joiner
        if let Ok(joiner_chain) = ChainId::from_str(&joiner_chain_id) {
            let msg = Message::GameStateSync { room: room.clone() };
            self.runtime
                .prepare_message(msg)
                .with_authentication()
                .send_to(joiner_chain);
        }

        // If stake > 0, notify hub about joiner
        if room.stake_amount > 0 {
            if let Some(hub_chain_str) = self.state.hub_chain_id.get().clone() {
                if let Ok(hub_chain) = ChainId::from_str(&hub_chain_str) {
                    let msg = Message::EscrowJoin {
                        match_id: room.host_chain_id.clone(),
                        joiner_wallet,
                    };
                    self.runtime
                        .prepare_message(msg)
                        .with_authentication()
                        .send_to(hub_chain);
                }
            }
        }
    }

    async fn handle_leave_room(&mut self, owner: AccountOwner) -> SignalSiegeResponse {
        let wallet = owner_to_wallet(&owner);

        // Get room
        let room = match self.state.game_room.get().clone() {
            Some(r) => r,
            None => return SignalSiegeError::NotInRoom.into_response(),
        };

        // Notify other player
        for chain_id_str in &room.player_chain_ids {
            if let Ok(chain_id) = ChainId::from_str(chain_id_str) {
                if chain_id != self.runtime.chain_id() {
                    let msg = Message::PlayerLeft {
                        player_chain_id: self.runtime.chain_id().to_string(),
                        player_wallet: wallet.clone(),
                    };
                    self.runtime
                        .prepare_message(msg)
                        .with_authentication()
                        .send_to(chain_id);
                }
            }
        }

        self.state.game_room.set(None);
        self.state.is_hosting.set(false);
        self.state.joined_host_chain.set(None);

        SignalSiegeResponse::Success(SuccessResponse {
            message: "Left room".to_string(),
        })
    }

    async fn handle_clear_room(&mut self, _owner: AccountOwner) -> SignalSiegeResponse {
        self.state.game_room.set(None);
        self.state.is_hosting.set(false);
        self.state.joined_host_chain.set(None);

        SignalSiegeResponse::Success(SuccessResponse {
            message: "Room cleared".to_string(),
        })
    }

    // ========================================================================
    // PVP WAGERING
    // ========================================================================

    async fn handle_request_deposit(&mut self, owner: AccountOwner) -> SignalSiegeResponse {
        let wallet = owner_to_wallet(&owner);

        let room = match self.state.game_room.get().clone() {
            Some(r) => r,
            None => return SignalSiegeError::NotInRoom.into_response(),
        };

        if room.stake_amount == 0 {
            return SignalSiegeResponse::Success(SuccessResponse {
                message: "No stake required".to_string(),
            });
        }

        // Send deposit request to hub
        if let Some(hub_chain_str) = self.state.hub_chain_id.get().clone() {
            if let Ok(hub_chain) = ChainId::from_str(&hub_chain_str) {
                let msg = Message::EscrowDeposit {
                    match_id: room.host_chain_id,
                    player_wallet: wallet,
                    amount: room.stake_amount,
                };
                self.runtime
                    .prepare_message(msg)
                    .with_authentication()
                    .send_to(hub_chain);
            }
        }

        SignalSiegeResponse::Success(SuccessResponse {
            message: "Deposit request sent".to_string(),
        })
    }

    async fn handle_confirm_ready(&mut self, _owner: AccountOwner) -> SignalSiegeResponse {
        let mut room = match self.state.game_room.get().clone() {
            Some(r) => r,
            None => return SignalSiegeError::NotInRoom.into_response(),
        };

        if room.status != GameStatus::WaitingForDeposits {
            return SignalSiegeError::EscrowNotReady.into_response();
        }

        // In production, verify escrow is fully funded via hub chain query
        // For now, trust the state transition
        room.status = GameStatus::InProgress;
        self.state.game_room.set(Some(room));

        SignalSiegeResponse::Success(SuccessResponse {
            message: "Match started!".to_string(),
        })
    }

    // ========================================================================
    // GAMEPLAY
    // ========================================================================

    async fn handle_play_turn(&mut self, owner: AccountOwner, action: GameAction) -> SignalSiegeResponse {
        let wallet = owner_to_wallet(&owner);

        let mut room = match self.state.game_room.get().clone() {
            Some(r) => r,
            None => return SignalSiegeError::NotInRoom.into_response(),
        };

        if room.status != GameStatus::InProgress {
            return SignalSiegeError::GameNotInProgress.into_response();
        }

        // Determine which player
        let player_index = room.player_wallets.iter().position(|w| *w == wallet);
        let player = match player_index {
            Some(0) => Player::One,
            Some(1) => Player::Two,
            _ => return SignalSiegeError::NotInRoom.into_response(),
        };

        // Check turn
        if room.current_turn != player {
            return SignalSiegeError::NotYourTurn.into_response();
        }

        // Apply action
        let result = self.apply_game_action(&mut room, player, &action);
        if let Err(e) = result {
            return e.into_response();
        }

        // Run signal propagation
        let signal_result = room.board.propagate_signal(player.to_u8());
        room.board.apply_captures(&signal_result.captured_relays, player.to_u8());
        room.last_signal = Some(signal_result.clone());
        room.last_move_at = self.runtime.system_time().micros();

        // Check win conditions
        let mut game_ended = false;
        let mut winner = None;

        if signal_result.reached_opponent_core {
            // Instant win
            room.status = GameStatus::Finished;
            room.winner = Some(player);
            game_ended = true;
            winner = Some(player);
        } else {
            // Switch turn
            room.current_turn = player.other();
            room.turn_number += 1;

            // Check max turns
            if room.turn_number >= MAX_TURNS {
                let p1_score = room.board.calculate_score(1);
                let p2_score = room.board.calculate_score(2);

                room.status = if p1_score > p2_score {
                    room.winner = Some(Player::One);
                    winner = Some(Player::One);
                    GameStatus::Finished
                } else if p2_score > p1_score {
                    room.winner = Some(Player::Two);
                    winner = Some(Player::Two);
                    GameStatus::Finished
                } else {
                    GameStatus::Draw
                };
                game_ended = true;
            }
        }

        self.state.game_room.set(Some(room.clone()));

        // Sync to opponent
        for (i, chain_id_str) in room.player_chain_ids.iter().enumerate() {
            if i != player.index() {
                if let Ok(chain_id) = ChainId::from_str(chain_id_str) {
                    let msg = Message::GameMoveSync { room: room.clone() };
                    self.runtime
                        .prepare_message(msg)
                        .with_authentication()
                        .send_to(chain_id);
                }
            }
        }

        // Handle game end
        if game_ended {
            self.handle_game_end(&room).await;
        }

        SignalSiegeResponse::MoveResult(MoveResultResponse {
            success: true,
            message: "Move applied".to_string(),
            signal_result: Some(signal_result),
            game_ended,
            winner,
        })
    }

    fn apply_game_action(
        &self,
        room: &mut GameRoom,
        player: Player,
        action: &GameAction,
    ) -> Result<(), SignalSiegeError> {
        let inventory = room.inventories.get_mut(player.index())
            .ok_or(SignalSiegeError::NotInRoom)?;

        match action.action_type.as_str() {
            "place" => {
                let tile_kind = action.tile_kind.ok_or(SignalSiegeError::InvalidMove)?;
                let rotation = action.rotation.unwrap_or(Rotation::R0);
                let pos = action.position as usize;

                if pos >= room.board.cells.len() {
                    return Err(SignalSiegeError::InvalidMove);
                }

                let cell = &room.board.cells[pos];
                if cell.kind != TileKind::Empty {
                    return Err(SignalSiegeError::CellNotEmpty);
                }

                if !inventory.has_tile(tile_kind) {
                    return Err(SignalSiegeError::TileNotInInventory);
                }

                inventory.remove_tile(tile_kind);
                room.board.cells[pos] = Cell {
                    kind: tile_kind,
                    rotation,
                    owner: player.to_u8(),
                };

                room.move_history.push(format!(
                    "{}:P:{},{},{:?}",
                    player.index(),
                    pos,
                    tile_kind as u8,
                    rotation
                ));
                Ok(())
            }
            "rotate" => {
                let pos = action.position as usize;

                if pos >= room.board.cells.len() {
                    return Err(SignalSiegeError::InvalidMove);
                }

                let cell = &room.board.cells[pos];
                if cell.owner != player.to_u8() {
                    return Err(SignalSiegeError::InvalidMove);
                }
                if !cell.kind.is_placeable() {
                    return Err(SignalSiegeError::InvalidMove);
                }

                room.board.cells[pos].rotation = cell.rotation.next();
                room.move_history.push(format!("{}:R:{}", player.index(), pos));
                Ok(())
            }
            "move_jammer" => {
                // Find player's jammer and move it one step
                let pos = action.position as usize;
                
                // Find jammer owned by player
                let jammer_pos = room.board.cells.iter().enumerate()
                    .find(|(_, c)| c.kind == TileKind::Jammer && c.owner == player.to_u8())
                    .map(|(i, _)| i);

                let jammer_idx = jammer_pos.ok_or(SignalSiegeError::InvalidMove)?;
                
                // Check if target is adjacent and empty
                let (jr, jc) = Board::idx_to_pos(jammer_idx);
                let (tr, tc) = Board::idx_to_pos(pos);
                
                let dr = (tr as i8 - jr as i8).abs();
                let dc = (tc as i8 - jc as i8).abs();
                
                if dr + dc != 1 {
                    return Err(SignalSiegeError::InvalidMove);
                }

                if room.board.cells[pos].kind != TileKind::Empty {
                    return Err(SignalSiegeError::CellNotEmpty);
                }

                // Move jammer
                room.board.cells[pos] = room.board.cells[jammer_idx];
                room.board.cells[jammer_idx] = Cell::default();
                room.move_history.push(format!("{}:M:{}:{}", player.index(), jammer_idx, pos));
                Ok(())
            }
            _ => Err(SignalSiegeError::InvalidMove),
        }
    }

    async fn handle_game_end(&mut self, room: &GameRoom) {
        // Send match ended to all players
        for chain_id_str in &room.player_chain_ids {
            if let Ok(chain_id) = ChainId::from_str(chain_id_str) {
                let msg = Message::MatchEnded {
                    winner: room.winner,
                    reason: "Game completed".to_string(),
                    final_room: room.clone(),
                };
                self.runtime
                    .prepare_message(msg)
                    .with_authentication()
                    .send_to(chain_id);
            }
        }

        // Settle escrow if staked
        if room.stake_amount > 0 {
            if let Some(hub_chain_str) = self.state.hub_chain_id.get().clone() {
                if let Ok(hub_chain) = ChainId::from_str(&hub_chain_str) {
                    let winner_wallet = room.winner.map(|w| {
                        room.player_wallets.get(w.index()).cloned().unwrap_or_default()
                    });
                    
                    let msg = Message::EscrowSettle {
                        match_id: room.host_chain_id.clone(),
                        winner_wallet,
                    };
                    self.runtime
                        .prepare_message(msg)
                        .with_authentication()
                        .send_to(hub_chain);
                }
            }
        }
    }

    // ========================================================================
    // FORFEIT
    // ========================================================================

    async fn handle_forfeit(&mut self, owner: AccountOwner) -> SignalSiegeResponse {
        let wallet = owner_to_wallet(&owner);

        let mut room = match self.state.game_room.get().clone() {
            Some(r) => r,
            None => return SignalSiegeError::NotInRoom.into_response(),
        };

        if room.status != GameStatus::InProgress {
            return SignalSiegeError::GameNotInProgress.into_response();
        }

        // Find player
        let player_index = room.player_wallets.iter().position(|w| *w == wallet);
        let player = match player_index {
            Some(0) => Player::One,
            Some(1) => Player::Two,
            _ => return SignalSiegeError::NotInRoom.into_response(),
        };

        // Opponent wins
        room.status = GameStatus::Finished;
        room.winner = Some(player.other());

        self.state.game_room.set(Some(room.clone()));
        self.handle_game_end(&room).await;

        SignalSiegeResponse::Success(SuccessResponse {
            message: "Forfeited match".to_string(),
        })
    }
}
