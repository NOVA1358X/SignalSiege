// SignalSiege - GraphQL Service
// Exposes queries and mutations for frontend integration

#![cfg_attr(target_arch = "wasm32", no_main)]

mod state;

use std::sync::Arc;

use async_graphql::{EmptySubscription, Object, Request, Response, Schema};
use linera_sdk::{linera_base_types::WithServiceAbi, views::View, Service, ServiceRuntime};

use signalsiege::{
    Board, Escrow, GameAction, GameRoom, GameStatus, Player, PlayerProfile,
    PuzzleState, Rotation, SignalResult, SignalSiegeAbi, TileInventory, TileKind,
};
use state::SignalSiegeState;

pub struct SignalSiegeService {
    state: Arc<SignalSiegeState>,
    runtime: Arc<ServiceRuntime<Self>>,
}

linera_sdk::service!(SignalSiegeService);

impl WithServiceAbi for SignalSiegeService {
    type Abi = SignalSiegeAbi;
}

impl Service for SignalSiegeService {
    type Parameters = ();

    async fn new(runtime: ServiceRuntime<Self>) -> Self {
        let state = SignalSiegeState::load(runtime.root_view_storage_context())
            .await
            .expect("Failed to load state");
        Self {
            state: Arc::new(state),
            runtime: Arc::new(runtime),
        }
    }

    async fn handle_query(&self, request: Request) -> Response {
        let schema = Schema::build(
            QueryRoot {
                state: self.state.clone(),
                runtime: self.runtime.clone(),
            },
            MutationRoot {
                runtime: self.runtime.clone(),
            },
            EmptySubscription,
        )
        .finish();
        schema.execute(request).await
    }
}

// ============================================================================
// QUERY ROOT
// ============================================================================

struct QueryRoot {
    state: Arc<SignalSiegeState>,
    runtime: Arc<ServiceRuntime<SignalSiegeService>>,
}

#[Object]
impl QueryRoot {
    // ========================================================================
    // CHAIN INFO
    // ========================================================================

    /// Get this chain's ID
    async fn chain_id(&self) -> String {
        self.runtime.chain_id().to_string()
    }

    /// Check if this chain is hosting a room
    async fn is_hosting(&self) -> bool {
        *self.state.is_hosting.get()
    }

    /// Get the host chain ID if joined another room
    async fn joined_host_chain(&self) -> Option<String> {
        self.state.joined_host_chain.get().clone()
    }

    /// Get hub chain ID
    async fn hub_chain_id(&self) -> Option<String> {
        self.state.hub_chain_id.get().clone()
    }

    // ========================================================================
    // ROOM STATE
    // ========================================================================

    /// Get current game room
    async fn room(&self) -> Option<GameRoom> {
        self.state.game_room.get().clone()
    }

    /// Get game status
    async fn game_status(&self) -> Option<GameStatus> {
        self.state.game_room.get().as_ref().map(|r| r.status)
    }

    /// Get current turn
    async fn current_turn(&self) -> Option<Player> {
        self.state.game_room.get().as_ref().map(|r| r.current_turn)
    }

    /// Get winner
    async fn winner(&self) -> Option<Player> {
        self.state.game_room.get().as_ref().and_then(|r| r.winner)
    }

    /// Get usernames in room
    async fn usernames(&self) -> Vec<String> {
        self.state.game_room.get().as_ref()
            .map(|r| r.usernames.clone())
            .unwrap_or_default()
    }

    /// Get player chain IDs
    async fn player_chain_ids(&self) -> Vec<String> {
        self.state.game_room.get().as_ref()
            .map(|r| r.player_chain_ids.clone())
            .unwrap_or_default()
    }

    /// Get board state
    async fn board(&self) -> Option<Board> {
        self.state.game_room.get().as_ref().map(|r| r.board.clone())
    }

    /// Get player inventories
    async fn inventories(&self) -> Vec<TileInventory> {
        self.state.game_room.get().as_ref()
            .map(|r| r.inventories.clone())
            .unwrap_or_default()
    }

    /// Get my inventory (by wallet index)
    async fn my_inventory(&self, wallet: String) -> Option<TileInventory> {
        self.state.game_room.get().as_ref().and_then(|r| {
            r.player_wallets.iter()
                .position(|w| w == &wallet)
                .and_then(|i| r.inventories.get(i).cloned())
        })
    }

    /// Get last signal result
    async fn last_signal(&self) -> Option<SignalResult> {
        self.state.game_room.get().as_ref()
            .and_then(|r| r.last_signal.clone())
    }

    /// Get move history
    async fn move_history(&self) -> Vec<String> {
        self.state.game_room.get().as_ref()
            .map(|r| r.move_history.clone())
            .unwrap_or_default()
    }

    /// Check if it's the specified wallet's turn
    async fn is_my_turn(&self, wallet: String) -> bool {
        self.state.game_room.get().as_ref().map_or(false, |room| {
            if room.status != GameStatus::InProgress {
                return false;
            }
            room.player_wallets.iter()
                .position(|w| w == &wallet)
                .map_or(false, |idx| {
                    match room.current_turn {
                        Player::One => idx == 0,
                        Player::Two => idx == 1,
                    }
                })
        })
    }

    // ========================================================================
    // PUZZLE STATE
    // ========================================================================

    /// Get current puzzle state
    async fn puzzle(&self) -> Option<PuzzleState> {
        self.state.puzzle_state.get().clone()
    }

    /// Get puzzle board
    async fn puzzle_board(&self) -> Option<Board> {
        self.state.puzzle_state.get().as_ref().map(|p| p.board.clone())
    }

    /// Get puzzle inventory
    async fn puzzle_inventory(&self) -> Option<TileInventory> {
        self.state.puzzle_state.get().as_ref().map(|p| p.inventory.clone())
    }

    // ========================================================================
    // TRAINING STATE
    // ========================================================================

    /// Get current training state
    async fn training(&self) -> Option<GameRoom> {
        self.state.training_state.get().clone()
    }

    /// Get training board
    async fn training_board(&self) -> Option<Board> {
        self.state.training_state.get().as_ref().map(|t| t.board.clone())
    }

    // ========================================================================
    // PLAYER PROFILE
    // ========================================================================

    /// Get my profile by Linera wallet address
    async fn my_profile(&self, wallet: String) -> Option<PlayerProfile> {
        self.state.players.get(&wallet.to_lowercase()).await.ok().flatten()
    }

    /// Get any player's profile
    async fn player_profile(&self, wallet: String) -> Option<PlayerProfile> {
        self.state.players.get(&wallet.to_lowercase()).await.ok().flatten()
    }

    /// Get my coin balance (by EVM address - hub chain)
    async fn my_balance(&self, evm_address: String) -> u64 {
        self.state.balances.get(&evm_address.to_lowercase())
            .await.ok().flatten().unwrap_or(0)
    }

    /// Check if identity is linked
    async fn is_identity_linked(&self, wallet: String) -> bool {
        self.state.players.get(&wallet.to_lowercase()).await.ok().flatten()
            .map_or(false, |p| p.evm_address.is_some())
    }

    /// Check if identity is verified
    async fn is_identity_verified(&self, wallet: String) -> bool {
        self.state.players.get(&wallet.to_lowercase()).await.ok().flatten()
            .map_or(false, |p| p.identity_verified)
    }

    /// Check if daily claim is available
    async fn can_claim_daily(&self, wallet: String) -> bool {
        use signalsiege::get_day_index;
        
        self.state.players.get(&wallet.to_lowercase()).await.ok().flatten()
            .map_or(false, |p| {
                // Approximate current day (service doesn't have runtime.system_time)
                // Frontend should verify with actual timestamp
                p.last_claim_day == 0 || p.last_claim_day < get_day_index(0) + 999999
            })
    }

    /// Check if daily puzzle is available
    async fn can_play_puzzle(&self, wallet: String) -> bool {
        self.state.players.get(&wallet.to_lowercase()).await.ok().flatten()
            .map_or(false, |p| {
                p.last_puzzle_day == 0 || p.last_puzzle_day < 999999
            })
    }

    // ========================================================================
    // ESCROW
    // ========================================================================

    /// Get escrow by match ID
    async fn escrow(&self, match_id: String) -> Option<Escrow> {
        self.state.escrows.get(&match_id).await.ok().flatten()
    }

    /// Check if escrow is ready (all deposits made)
    async fn is_escrow_ready(&self, match_id: String) -> bool {
        self.state.escrows.get(&match_id).await.ok().flatten()
            .map_or(false, |e| e.all_deposited())
    }

    // ========================================================================
    // LEADERBOARD
    // ========================================================================

    /// Get leaderboard
    async fn leaderboard(&self, limit: Option<i32>) -> Vec<PlayerProfile> {
        let all = self.state.leaderboard.get().clone();
        let limit = limit.unwrap_or(10) as usize;
        all.into_iter().take(limit).collect()
    }

    // ========================================================================
    // RECENT ROOMS
    // ========================================================================

    /// Get recent room codes
    async fn recent_rooms(&self) -> Vec<String> {
        self.state.recent_rooms.get().clone()
    }
}

// ============================================================================
// MUTATION ROOT
// ============================================================================

struct MutationRoot {
    runtime: Arc<ServiceRuntime<SignalSiegeService>>,
}

#[Object]
impl MutationRoot {
    // ========================================================================
    // PLAYER MANAGEMENT
    // ========================================================================

    /// Register a new player
    async fn register(&self, username: String) -> [u8; 0] {
        use signalsiege::Operation;
        self.runtime.schedule_operation(&Operation::Register { username });
        []
    }

    /// Link EVM identity
    async fn link_identity(
        &self,
        evm_address: String,
        message: String,
        signature: String,
    ) -> [u8; 0] {
        use signalsiege::Operation;
        self.runtime.schedule_operation(&Operation::LinkIdentity {
            evm_address,
            message,
            signature,
        });
        []
    }

    // ========================================================================
    // DAILY CLAIM
    // ========================================================================

    /// Claim daily coins
    async fn claim_daily(&self) -> [u8; 0] {
        use signalsiege::Operation;
        self.runtime.schedule_operation(&Operation::ClaimDaily);
        []
    }

    // ========================================================================
    // PUZZLE
    // ========================================================================

    /// Start daily puzzle
    async fn start_daily_puzzle(&self) -> [u8; 0] {
        use signalsiege::Operation;
        self.runtime.schedule_operation(&Operation::StartDailyPuzzle);
        []
    }

    /// Play a puzzle turn
    async fn play_puzzle_turn(
        &self,
        action_type: String,
        position: i32,
        tile_kind: Option<TileKind>,
        rotation: Option<Rotation>,
    ) -> [u8; 0] {
        use signalsiege::Operation;
        let action = GameAction {
            action_type,
            position: position as u8,
            tile_kind,
            rotation,
        };
        self.runtime.schedule_operation(&Operation::PlayPuzzleTurn { action });
        []
    }

    // ========================================================================
    // TRAINING
    // ========================================================================

    /// Start training match
    async fn start_training(&self, map_id: i32) -> [u8; 0] {
        use signalsiege::Operation;
        self.runtime.schedule_operation(&Operation::StartTraining { map_id: map_id as u8 });
        []
    }

    /// Play a training turn
    async fn play_training_turn(
        &self,
        action_type: String,
        position: i32,
        tile_kind: Option<TileKind>,
        rotation: Option<Rotation>,
    ) -> [u8; 0] {
        use signalsiege::Operation;
        let action = GameAction {
            action_type,
            position: position as u8,
            tile_kind,
            rotation,
        };
        self.runtime.schedule_operation(&Operation::PlayTrainingTurn { action });
        []
    }

    // ========================================================================
    // PVP ROOM MANAGEMENT
    // ========================================================================

    /// Create a new room
    async fn create_room(&self, map_id: i32, stake_amount: i32) -> [u8; 0] {
        use signalsiege::Operation;
        self.runtime.schedule_operation(&Operation::CreateRoom {
            map_id: map_id as u8,
            stake_amount: stake_amount as u64,
        });
        []
    }

    /// Join an existing room
    async fn join_room(&self, host_chain_id: String) -> [u8; 0] {
        use signalsiege::Operation;
        self.runtime.schedule_operation(&Operation::JoinRoom { host_chain_id });
        []
    }

    /// Leave current room
    async fn leave_room(&self) -> [u8; 0] {
        use signalsiege::Operation;
        self.runtime.schedule_operation(&Operation::LeaveRoom);
        []
    }

    /// Clear room state
    async fn clear_room(&self) -> [u8; 0] {
        use signalsiege::Operation;
        self.runtime.schedule_operation(&Operation::ClearRoom);
        []
    }

    // ========================================================================
    // PVP WAGERING
    // ========================================================================

    /// Request deposit to escrow
    async fn request_deposit(&self) -> [u8; 0] {
        use signalsiege::Operation;
        self.runtime.schedule_operation(&Operation::RequestDeposit);
        []
    }

    /// Confirm ready to start
    async fn confirm_ready(&self) -> [u8; 0] {
        use signalsiege::Operation;
        self.runtime.schedule_operation(&Operation::ConfirmReady);
        []
    }

    // ========================================================================
    // GAMEPLAY
    // ========================================================================

    /// Play a turn in PvP
    async fn play_turn(
        &self,
        action_type: String,
        position: i32,
        tile_kind: Option<TileKind>,
        rotation: Option<Rotation>,
    ) -> [u8; 0] {
        use signalsiege::Operation;
        let action = GameAction {
            action_type,
            position: position as u8,
            tile_kind,
            rotation,
        };
        self.runtime.schedule_operation(&Operation::PlayTurn { action });
        []
    }

    // ========================================================================
    // FORFEIT
    // ========================================================================

    /// Forfeit the current match
    async fn forfeit(&self) -> [u8; 0] {
        use signalsiege::Operation;
        self.runtime.schedule_operation(&Operation::Forfeit);
        []
    }

    // ========================================================================
    // SYNC
    // ========================================================================

    /// Sync inbox (process pending cross-chain messages)
    async fn sync_inbox(&self) -> [u8; 0] {
        use signalsiege::Operation;
        self.runtime.schedule_operation(&Operation::SyncInbox);
        []
    }
}
