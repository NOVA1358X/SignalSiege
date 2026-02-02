// SignalSiege - State Storage
// Persistent on-chain state using Linera views

use crate::{Escrow, GameRoom, PlayerProfile, PuzzleState};
use linera_sdk::views::{linera_views, MapView, RegisterView, RootView, ViewStorageContext};

/// Root state for SignalSiege application
#[derive(RootView, async_graphql::SimpleObject)]
#[view(context = ViewStorageContext)]
pub struct SignalSiegeState {
    /// Hub chain ID for coordination (optional)
    pub hub_chain_id: RegisterView<Option<String>>,
    
    /// Current game room on this chain (PvP)
    pub game_room: RegisterView<Option<GameRoom>>,
    
    /// Current puzzle state on this chain (PvE daily puzzle)
    pub puzzle_state: RegisterView<Option<PuzzleState>>,
    
    /// Current training state on this chain
    pub training_state: RegisterView<Option<GameRoom>>,
    
    /// Is this chain hosting a room?
    pub is_hosting: RegisterView<bool>,
    
    /// Chain ID we've joined (if joiner)
    pub joined_host_chain: RegisterView<Option<String>>,
    
    /// Player profiles (keyed by linera address string)
    pub players: MapView<String, PlayerProfile>,
    
    /// Coin balances (keyed by EVM address - hub chain only)
    pub balances: MapView<String, u64>,
    
    /// Escrow objects (keyed by match_id - hub chain only)
    pub escrows: MapView<String, Escrow>,
    
    /// Daily claim timestamps (keyed by EVM address, value = last claim day index)
    pub daily_claims: MapView<String, u32>,
    
    /// Daily puzzle attempts (keyed by EVM address, value = last puzzle day index)
    pub puzzle_attempts: MapView<String, u32>,
    
    /// Training reward accumulator for today (keyed by EVM address)
    pub training_rewards_today: MapView<String, u64>,
    
    /// Recent room codes visited
    pub recent_rooms: RegisterView<Vec<String>>,
    
    /// Leaderboard cache (top 100 players by wins)
    pub leaderboard: RegisterView<Vec<PlayerProfile>>,
}
