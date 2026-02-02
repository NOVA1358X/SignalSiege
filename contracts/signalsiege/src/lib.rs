// SignalSiege - On-Chain Circuit War
// A deterministic turn-based strategy game on Linera Protocol
// 7x7 grid with signal propagation mechanics

#![allow(clippy::large_enum_variant)]

use async_graphql::{Enum, InputObject, SimpleObject, Union};
use linera_sdk::graphql::GraphQLMutationRoot;
use linera_sdk::linera_base_types::{ContractAbi, ServiceAbi};
use serde::{Deserialize, Serialize};

// ============================================================================
// ABI DEFINITION
// ============================================================================

/// ABI definition for SignalSiege application
pub struct SignalSiegeAbi;

impl ContractAbi for SignalSiegeAbi {
    type Operation = Operation;
    type Response = SignalSiegeResponse;
}

impl ServiceAbi for SignalSiegeAbi {
    type Query = async_graphql::Request;
    type QueryResponse = async_graphql::Response;
}

// ============================================================================
// BOARD CONSTANTS
// ============================================================================

/// Board size (7x7 grid)
pub const BOARD_SIZE: usize = 7;
pub const BOARD_CELLS: usize = BOARD_SIZE * BOARD_SIZE; // 49 cells

/// Default signal range from Core
pub const BASE_SIGNAL_RANGE: u8 = 3;

/// Maximum turns per game
pub const MAX_TURNS: u16 = 20;

/// Relay ownership points
pub const RELAY_POINTS: u64 = 100;

/// Daily claim amount
pub const DAILY_CLAIM_AMOUNT: u64 = 50;

/// Daily puzzle rewards
pub const PUZZLE_WIN_REWARD: u64 = 150;
pub const PUZZLE_FAIL_REWARD: u64 = 25;

/// Training mode reward (capped)
pub const TRAINING_WIN_REWARD: u64 = 5;

// ============================================================================
// TILE TYPES
// ============================================================================

/// Types of tiles that can be placed on the board
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, Enum, Default)]
#[graphql(rename_items = "SCREAMING_SNAKE_CASE")]
pub enum TileKind {
    /// Empty cell (can place tiles here)
    #[default]
    Empty,
    /// Player core (P1 at 0,0 - P2 at 6,6)
    Core,
    /// Neutral relay (capture point)
    Relay,
    /// Wall (impassable)
    Wall,
    /// Wire: Straight (connects opposite sides)
    WireStraight,
    /// Wire: Corner (connects adjacent sides)
    WireCorner,
    /// Wire: T-Junction (connects 3 sides)
    WireTJunction,
    /// Wire: Cross (connects all 4 sides)
    WireCross,
    /// Blocker (stops signal propagation)
    Blocker,
    /// Jammer (reduces signal range in radius)
    Jammer,
    /// Amplifier (extends signal range)
    Amplifier,
}

impl TileKind {
    /// Check if this tile conducts signal
    pub fn conducts_signal(&self) -> bool {
        matches!(
            self,
            TileKind::WireStraight
                | TileKind::WireCorner
                | TileKind::WireTJunction
                | TileKind::WireCross
                | TileKind::Relay
                | TileKind::Core
                | TileKind::Amplifier
        )
    }

    /// Check if this tile can be placed by a player
    pub fn is_placeable(&self) -> bool {
        matches!(
            self,
            TileKind::WireStraight
                | TileKind::WireCorner
                | TileKind::WireTJunction
                | TileKind::WireCross
                | TileKind::Blocker
                | TileKind::Jammer
                | TileKind::Amplifier
        )
    }

    /// Get connections for this tile type at rotation 0
    /// Returns [North, East, South, West] as booleans
    pub fn base_connections(&self) -> [bool; 4] {
        match self {
            TileKind::WireStraight => [true, false, true, false], // N-S
            TileKind::WireCorner => [true, true, false, false],   // N-E
            TileKind::WireTJunction => [true, true, true, false], // N-E-S
            TileKind::WireCross => [true, true, true, true],      // All
            TileKind::Core | TileKind::Relay | TileKind::Amplifier => [true, true, true, true],
            _ => [false, false, false, false],
        }
    }
}

/// Tile rotation (0, 90, 180, 270 degrees clockwise)
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, Enum, Default)]
#[graphql(rename_items = "SCREAMING_SNAKE_CASE")]
pub enum Rotation {
    #[default]
    R0,
    R90,
    R180,
    R270,
}

impl Rotation {
    pub fn to_index(&self) -> usize {
        match self {
            Rotation::R0 => 0,
            Rotation::R90 => 1,
            Rotation::R180 => 2,
            Rotation::R270 => 3,
        }
    }

    pub fn next(&self) -> Self {
        match self {
            Rotation::R0 => Rotation::R90,
            Rotation::R90 => Rotation::R180,
            Rotation::R180 => Rotation::R270,
            Rotation::R270 => Rotation::R0,
        }
    }
}

// ============================================================================
// CELL & BOARD
// ============================================================================

/// A single cell on the board
#[derive(Debug, Clone, Copy, Serialize, Deserialize, SimpleObject, Default)]
pub struct Cell {
    /// Type of tile in this cell
    pub kind: TileKind,
    /// Rotation of the tile (0, 90, 180, 270)
    pub rotation: Rotation,
    /// Owner of this cell (0 = neutral, 1 = P1, 2 = P2)
    pub owner: u8,
}

impl Cell {
    pub fn new(kind: TileKind) -> Self {
        Self {
            kind,
            rotation: Rotation::R0,
            owner: 0,
        }
    }

    pub fn new_with_owner(kind: TileKind, owner: u8) -> Self {
        Self {
            kind,
            rotation: Rotation::R0,
            owner,
        }
    }

    /// Get connections after applying rotation
    /// Returns [North, East, South, West] as booleans
    pub fn connections(&self) -> [bool; 4] {
        let base = self.kind.base_connections();
        let rot = self.rotation.to_index();
        // Rotate connections clockwise by rot * 90 degrees
        [
            base[(4 - rot) % 4],
            base[(5 - rot) % 4],
            base[(6 - rot) % 4],
            base[(7 - rot) % 4],
        ]
    }
}

/// Direction for signal propagation
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Direction {
    North = 0,
    East = 1,
    South = 2,
    West = 3,
}

impl Direction {
    pub fn opposite(&self) -> Self {
        match self {
            Direction::North => Direction::South,
            Direction::East => Direction::West,
            Direction::South => Direction::North,
            Direction::West => Direction::East,
        }
    }

    pub fn delta(&self) -> (i8, i8) {
        match self {
            Direction::North => (-1, 0), // row decreases
            Direction::East => (0, 1),   // col increases
            Direction::South => (1, 0),  // row increases
            Direction::West => (0, -1),  // col decreases
        }
    }
}

/// Game board state
#[derive(Debug, Clone, Serialize, Deserialize, SimpleObject)]
pub struct Board {
    /// 49 cells in row-major order (0,0 is top-left)
    pub cells: Vec<Cell>,
    /// Relay positions (indices)
    pub relays: Vec<u8>,
    /// Wall positions (indices)
    pub walls: Vec<u8>,
    /// Map ID used to generate this board
    pub map_id: u8,
}

impl Default for Board {
    fn default() -> Self {
        Self::new(0)
    }
}

impl Board {
    /// Create a new board with a specific map layout
    pub fn new(map_id: u8) -> Self {
        let mut cells = vec![Cell::default(); BOARD_CELLS];
        let mut relays = Vec::new();
        let mut walls = Vec::new();

        // Place cores
        cells[0] = Cell::new_with_owner(TileKind::Core, 1); // P1 at (0,0)
        cells[BOARD_CELLS - 1] = Cell::new_with_owner(TileKind::Core, 2); // P2 at (6,6)

        // Place map-specific elements based on map_id
        match map_id {
            0 => {
                // Standard map: 5 relays in a cross pattern
                // Center relay
                let center = 24; // (3,3)
                cells[center] = Cell::new(TileKind::Relay);
                relays.push(center as u8);

                // Four corner relays (offset from center)
                for (r, c) in [(1, 3), (3, 1), (3, 5), (5, 3)] {
                    let idx = r * BOARD_SIZE + c;
                    cells[idx] = Cell::new(TileKind::Relay);
                    relays.push(idx as u8);
                }

                // Walls
                for (r, c) in [(2, 2), (2, 4), (4, 2), (4, 4)] {
                    let idx = r * BOARD_SIZE + c;
                    cells[idx] = Cell::new(TileKind::Wall);
                    walls.push(idx as u8);
                }
            }
            1 => {
                // Diagonal map: relays along diagonal, walls on edges
                for i in 1..6 {
                    let idx = i * BOARD_SIZE + i;
                    cells[idx] = Cell::new(TileKind::Relay);
                    relays.push(idx as u8);
                }
                // Walls blocking direct diagonal
                for (r, c) in [(1, 5), (5, 1)] {
                    let idx = r * BOARD_SIZE + c;
                    cells[idx] = Cell::new(TileKind::Wall);
                    walls.push(idx as u8);
                }
            }
            2 => {
                // Corridor map: single path with relays
                for c in 2..5 {
                    let idx = 3 * BOARD_SIZE + c;
                    cells[idx] = Cell::new(TileKind::Relay);
                    relays.push(idx as u8);
                }
                // Walls creating corridors
                for r in 1..6 {
                    if r != 3 {
                        for c in [2, 4] {
                            let idx = r * BOARD_SIZE + c;
                            cells[idx] = Cell::new(TileKind::Wall);
                            walls.push(idx as u8);
                        }
                    }
                }
            }
            _ => {
                // Default to map 0 pattern
                let center = 24;
                cells[center] = Cell::new(TileKind::Relay);
                relays.push(center as u8);
            }
        }

        Self {
            cells,
            relays,
            walls,
            map_id,
        }
    }

    /// Get cell at position
    pub fn get(&self, row: usize, col: usize) -> Option<&Cell> {
        if row < BOARD_SIZE && col < BOARD_SIZE {
            Some(&self.cells[row * BOARD_SIZE + col])
        } else {
            None
        }
    }

    /// Get mutable cell at position
    pub fn get_mut(&mut self, row: usize, col: usize) -> Option<&mut Cell> {
        if row < BOARD_SIZE && col < BOARD_SIZE {
            Some(&mut self.cells[row * BOARD_SIZE + col])
        } else {
            None
        }
    }

    /// Convert index to (row, col)
    pub fn idx_to_pos(idx: usize) -> (usize, usize) {
        (idx / BOARD_SIZE, idx % BOARD_SIZE)
    }

    /// Convert (row, col) to index
    pub fn pos_to_idx(row: usize, col: usize) -> usize {
        row * BOARD_SIZE + col
    }

    /// Check if position is valid
    pub fn is_valid_pos(row: i8, col: i8) -> bool {
        row >= 0 && row < BOARD_SIZE as i8 && col >= 0 && col < BOARD_SIZE as i8
    }

    /// Get neighbor position in direction
    pub fn neighbor(&self, row: usize, col: usize, dir: Direction) -> Option<(usize, usize)> {
        let (dr, dc) = dir.delta();
        let new_row = row as i8 + dr;
        let new_col = col as i8 + dc;
        if Self::is_valid_pos(new_row, new_col) {
            Some((new_row as usize, new_col as usize))
        } else {
            None
        }
    }
}

// ============================================================================
// SIGNAL PROPAGATION
// ============================================================================

/// Result of signal propagation
#[derive(Debug, Clone, Serialize, Deserialize, SimpleObject)]
pub struct SignalResult {
    /// Cells reached by signal (indices)
    pub reached: Vec<u8>,
    /// Path taken by signal (indices in order)
    pub path: Vec<u8>,
    /// Relays captured (indices)
    pub captured_relays: Vec<u8>,
    /// Did signal reach opponent core?
    pub reached_opponent_core: bool,
}

impl Board {
    /// Run deterministic signal propagation from the active player's core
    /// Uses BFS with fixed neighbor ordering (N, E, S, W)
    pub fn propagate_signal(&self, active_player: u8) -> SignalResult {
        let mut reached = Vec::new();
        let mut path = Vec::new();
        let mut captured_relays = Vec::new();
        let mut reached_opponent_core = false;

        // Find starting core position
        let start_idx = if active_player == 1 { 0 } else { BOARD_CELLS - 1 };
        let opponent_core_idx = if active_player == 1 {
            BOARD_CELLS - 1
        } else {
            0
        };

        // BFS with range tracking
        let mut visited = vec![false; BOARD_CELLS];
        let mut queue: Vec<(usize, u8)> = Vec::new(); // (index, remaining_range)

        // Calculate initial range
        let initial_range = BASE_SIGNAL_RANGE;

        queue.push((start_idx, initial_range));
        visited[start_idx] = true;
        reached.push(start_idx as u8);
        path.push(start_idx as u8);

        while let Some((current_idx, remaining_range)) = queue.pop() {
            if remaining_range == 0 {
                continue;
            }

            let (row, col) = Self::idx_to_pos(current_idx);
            let current_cell = &self.cells[current_idx];
            let connections = current_cell.connections();

            // Check all 4 directions in fixed order (deterministic)
            for (dir_idx, &connected) in connections.iter().enumerate() {
                if !connected {
                    continue;
                }

                let dir = match dir_idx {
                    0 => Direction::North,
                    1 => Direction::East,
                    2 => Direction::South,
                    _ => Direction::West,
                };

                if let Some((nr, nc)) = self.neighbor(row, col, dir) {
                    let neighbor_idx = Self::pos_to_idx(nr, nc);

                    if visited[neighbor_idx] {
                        continue;
                    }

                    let neighbor_cell = &self.cells[neighbor_idx];

                    // Check if neighbor blocks signal
                    if neighbor_cell.kind == TileKind::Blocker {
                        continue;
                    }

                    if neighbor_cell.kind == TileKind::Wall {
                        continue;
                    }

                    // Check if signal can enter from this direction
                    let neighbor_connections = neighbor_cell.connections();
                    let entry_dir = dir.opposite();
                    if !neighbor_connections[entry_dir as usize]
                        && neighbor_cell.kind != TileKind::Core
                        && neighbor_cell.kind != TileKind::Relay
                    {
                        continue;
                    }

                    // Calculate new range
                    let mut new_range = remaining_range.saturating_sub(1);

                    // Check for jammer effect (reduces range)
                    if self.is_jammed(nr, nc) {
                        new_range = new_range.saturating_sub(1);
                    }

                    // Check for amplifier (increases range)
                    if neighbor_cell.kind == TileKind::Amplifier {
                        new_range = new_range.saturating_add(1);
                    }

                    visited[neighbor_idx] = true;
                    reached.push(neighbor_idx as u8);
                    path.push(neighbor_idx as u8);

                    // Check if we reached opponent core
                    if neighbor_idx == opponent_core_idx {
                        reached_opponent_core = true;
                    }

                    // Check if we captured a relay
                    if neighbor_cell.kind == TileKind::Relay && neighbor_cell.owner != active_player
                    {
                        captured_relays.push(neighbor_idx as u8);
                    }

                    // Continue propagation if tile conducts signal
                    if neighbor_cell.kind.conducts_signal() {
                        queue.push((neighbor_idx, new_range));
                    }
                }
            }
        }

        SignalResult {
            reached,
            path,
            captured_relays,
            reached_opponent_core,
        }
    }

    /// Check if a position is within jammer range
    fn is_jammed(&self, row: usize, col: usize) -> bool {
        // Check Manhattan distance 1 from any jammer
        for dr in -1i8..=1 {
            for dc in -1i8..=1 {
                if dr.abs() + dc.abs() > 1 {
                    continue;
                }
                let nr = row as i8 + dr;
                let nc = col as i8 + dc;
                if Self::is_valid_pos(nr, nc) {
                    let idx = Self::pos_to_idx(nr as usize, nc as usize);
                    if self.cells[idx].kind == TileKind::Jammer {
                        return true;
                    }
                }
            }
        }
        false
    }

    /// Apply captured relays to board
    pub fn apply_captures(&mut self, captures: &[u8], new_owner: u8) {
        for &idx in captures {
            if let Some(cell) = self.cells.get_mut(idx as usize) {
                cell.owner = new_owner;
            }
        }
    }

    /// Calculate score for a player
    pub fn calculate_score(&self, player: u8) -> u64 {
        let mut score = 0u64;
        for &relay_idx in &self.relays {
            if let Some(cell) = self.cells.get(relay_idx as usize) {
                if cell.owner == player {
                    score += RELAY_POINTS;
                }
            }
        }
        score
    }
}

// ============================================================================
// PLAYER & GAME STATUS
// ============================================================================

/// Player identifier
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, Enum, Default)]
#[graphql(rename_items = "PascalCase")]
pub enum Player {
    #[default]
    One,
    Two,
}

impl Player {
    pub fn other(&self) -> Self {
        match self {
            Player::One => Player::Two,
            Player::Two => Player::One,
        }
    }

    pub fn index(&self) -> usize {
        match self {
            Player::One => 0,
            Player::Two => 1,
        }
    }

    pub fn to_u8(&self) -> u8 {
        match self {
            Player::One => 1,
            Player::Two => 2,
        }
    }
}

/// Game status
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, Enum, Default)]
#[graphql(rename_items = "PascalCase")]
pub enum GameStatus {
    #[default]
    WaitingForPlayer,
    WaitingForDeposits,
    InProgress,
    Finished,
    Draw,
    Abandoned,
}

// ============================================================================
// TILE INVENTORY
// ============================================================================

/// Tile inventory for a player
#[derive(Debug, Clone, Serialize, Deserialize, SimpleObject, Default)]
pub struct TileInventory {
    pub wire_straight: u8,
    pub wire_corner: u8,
    pub wire_t_junction: u8,
    pub wire_cross: u8,
    pub blocker: u8,
    pub jammer: u8,
    pub amplifier: u8,
}

impl TileInventory {
    /// Standard starting inventory
    pub fn standard() -> Self {
        Self {
            wire_straight: 4,
            wire_corner: 3,
            wire_t_junction: 2,
            wire_cross: 1,
            blocker: 2,
            jammer: 1,
            amplifier: 1,
        }
    }

    /// Puzzle-specific inventory
    pub fn for_puzzle(puzzle_id: u8) -> Self {
        match puzzle_id {
            0 => Self {
                wire_straight: 3,
                wire_corner: 2,
                wire_t_junction: 1,
                wire_cross: 0,
                blocker: 1,
                jammer: 0,
                amplifier: 1,
            },
            1 => Self {
                wire_straight: 2,
                wire_corner: 3,
                wire_t_junction: 2,
                wire_cross: 1,
                blocker: 0,
                jammer: 1,
                amplifier: 0,
            },
            _ => Self::standard(),
        }
    }

    /// Check if player has a specific tile
    pub fn has_tile(&self, kind: TileKind) -> bool {
        match kind {
            TileKind::WireStraight => self.wire_straight > 0,
            TileKind::WireCorner => self.wire_corner > 0,
            TileKind::WireTJunction => self.wire_t_junction > 0,
            TileKind::WireCross => self.wire_cross > 0,
            TileKind::Blocker => self.blocker > 0,
            TileKind::Jammer => self.jammer > 0,
            TileKind::Amplifier => self.amplifier > 0,
            _ => false,
        }
    }

    /// Remove a tile from inventory
    pub fn remove_tile(&mut self, kind: TileKind) -> bool {
        match kind {
            TileKind::WireStraight if self.wire_straight > 0 => {
                self.wire_straight -= 1;
                true
            }
            TileKind::WireCorner if self.wire_corner > 0 => {
                self.wire_corner -= 1;
                true
            }
            TileKind::WireTJunction if self.wire_t_junction > 0 => {
                self.wire_t_junction -= 1;
                true
            }
            TileKind::WireCross if self.wire_cross > 0 => {
                self.wire_cross -= 1;
                true
            }
            TileKind::Blocker if self.blocker > 0 => {
                self.blocker -= 1;
                true
            }
            TileKind::Jammer if self.jammer > 0 => {
                self.jammer -= 1;
                true
            }
            TileKind::Amplifier if self.amplifier > 0 => {
                self.amplifier -= 1;
                true
            }
            _ => false,
        }
    }
}

// ============================================================================
// GAME ACTIONS
// ============================================================================

/// Action a player can take on their turn
#[derive(Debug, Clone, Serialize, Deserialize, InputObject)]
pub struct GameAction {
    /// Action type: "place", "rotate", "move_jammer"
    pub action_type: String,
    /// Target cell index (0-48)
    pub position: u8,
    /// Tile kind (for place action)
    pub tile_kind: Option<TileKind>,
    /// Rotation (for place action)
    pub rotation: Option<Rotation>,
}

// ============================================================================
// GAME ROOM
// ============================================================================

/// A game room (match)
#[derive(Debug, Clone, Serialize, Deserialize, SimpleObject, Default)]
pub struct GameRoom {
    // Identity
    pub host_chain_id: String,
    pub player_chain_ids: Vec<String>,
    pub player_wallets: Vec<String>,
    pub usernames: Vec<String>,

    // Game Configuration
    pub map_id: u8,
    pub stake_amount: u64,

    // Game State
    pub board: Board,
    pub inventories: Vec<TileInventory>,
    pub current_turn: Player,
    pub turn_number: u16,
    pub status: GameStatus,
    pub winner: Option<Player>,

    // Move history (compact encoding)
    pub move_history: Vec<String>,

    // Last signal result for UI
    pub last_signal: Option<SignalResult>,

    // Timestamps (microseconds)
    pub created_at: u64,
    pub last_move_at: u64,
}

impl GameRoom {
    /// Create a new game room
    pub fn new(host_chain_id: String, host_wallet: String, username: String, map_id: u8, stake: u64) -> Self {
        Self {
            host_chain_id,
            player_chain_ids: vec![],
            player_wallets: vec![host_wallet],
            usernames: vec![username],
            map_id,
            stake_amount: stake,
            board: Board::new(map_id),
            inventories: vec![TileInventory::standard()],
            current_turn: Player::One,
            turn_number: 0,
            status: GameStatus::WaitingForPlayer,
            winner: None,
            move_history: vec![],
            last_signal: None,
            created_at: 0,
            last_move_at: 0,
        }
    }
}

// ============================================================================
// ESCROW (PVP WAGERING)
// ============================================================================

/// Escrow state for PvP wagers
#[derive(Debug, Clone, Serialize, Deserialize, SimpleObject, Default)]
pub struct Escrow {
    pub match_id: String,
    pub player_wallets: Vec<String>,
    pub stake_amount: u64,
    pub deposits: Vec<u64>,
    pub is_settled: bool,
    pub winner_wallet: Option<String>,
    pub created_at: u64,
}

impl Escrow {
    pub fn new(match_id: String, stake: u64) -> Self {
        Self {
            match_id,
            player_wallets: vec![],
            stake_amount: stake,
            deposits: vec![],
            is_settled: false,
            winner_wallet: None,
            created_at: 0,
        }
    }

    pub fn add_player(&mut self, wallet: String) {
        if !self.player_wallets.contains(&wallet) {
            self.player_wallets.push(wallet);
            self.deposits.push(0);
        }
    }

    pub fn deposit(&mut self, wallet: &str, amount: u64) -> bool {
        if let Some(idx) = self.player_wallets.iter().position(|w| w == wallet) {
            self.deposits[idx] = amount;
            true
        } else {
            false
        }
    }

    pub fn all_deposited(&self) -> bool {
        self.deposits.len() == 2 && self.deposits.iter().all(|&d| d >= self.stake_amount)
    }

    pub fn total_pot(&self) -> u64 {
        self.deposits.iter().sum()
    }
}

// ============================================================================
// DAILY PUZZLE
// ============================================================================

/// Daily puzzle state
#[derive(Debug, Clone, Serialize, Deserialize, SimpleObject, Default)]
pub struct PuzzleState {
    pub puzzle_id: u8,
    pub day_index: u32,
    pub board: Board,
    pub inventory: TileInventory,
    pub target_turns: u8,
    pub current_turn: u8,
    pub is_completed: bool,
    pub is_won: bool,
    pub move_history: Vec<String>,
}

impl PuzzleState {
    /// Generate a puzzle for a specific day
    pub fn for_day(day_index: u32) -> Self {
        // Use day_index to seed the puzzle (deterministic)
        let puzzle_id = (day_index % 10) as u8; // 10 different puzzles in rotation
        let map_id = (day_index % 3) as u8;
        
        Self {
            puzzle_id,
            day_index,
            board: Board::new(map_id),
            inventory: TileInventory::for_puzzle(puzzle_id),
            target_turns: 8, // Win within 8 turns
            current_turn: 0,
            is_completed: false,
            is_won: false,
            move_history: vec![],
        }
    }
}

// ============================================================================
// PLAYER PROFILE
// ============================================================================

/// Player profile stored per-chain
#[derive(Debug, Clone, Serialize, Deserialize, SimpleObject, Default)]
pub struct PlayerProfile {
    pub username: String,
    pub linera_address: String,
    pub evm_address: Option<String>,
    pub identity_verified: bool,
    pub coins: u64,
    pub total_wins: u64,
    pub total_losses: u64,
    pub total_draws: u64,
    pub total_games: u64,
    pub pvp_wins: u64,
    pub pvp_losses: u64,
    pub puzzle_wins: u64,
    pub puzzle_attempts: u64,
    pub last_claim_day: u32,
    pub last_puzzle_day: u32,
    pub created_at: u64,
}

// ============================================================================
// OPERATIONS (Frontend -> Contract)
// ============================================================================

/// Operations that can be performed on the contract
#[derive(Debug, Clone, Serialize, Deserialize, GraphQLMutationRoot)]
pub enum Operation {
    // Player Management
    Register { username: String },
    
    // Identity linking (EVM wallet -> Linera address)
    LinkIdentity {
        evm_address: String,
        message: String,
        signature: String,
    },
    
    // Daily claim
    ClaimDaily,
    
    // Daily Puzzle
    StartDailyPuzzle,
    PlayPuzzleTurn { action: GameAction },
    
    // Training mode
    StartTraining { map_id: u8 },
    PlayTrainingTurn { action: GameAction },
    
    // PvP Room Management
    CreateRoom { map_id: u8, stake_amount: u64 },
    JoinRoom { host_chain_id: String },
    LeaveRoom,
    ClearRoom,
    
    // PvP Wagering
    RequestDeposit,
    ConfirmReady,
    
    // Gameplay
    PlayTurn { action: GameAction },
    
    // Forfeit
    Forfeit,
    
    // Sync inbox (triggers block processing)
    SyncInbox,
}

// ============================================================================
// MESSAGES (Cross-Chain)
// ============================================================================

/// Cross-chain messages
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum Message {
    /// Player 2 requests to join Player 1's game room
    JoinRequest {
        joiner_chain_id: String,
        joiner_wallet: String,
        joiner_username: String,
    },

    /// Host sends initial game state to joiner
    GameStateSync { room: GameRoom },

    /// After each move, sync state to opponent
    GameMoveSync { room: GameRoom },

    /// Game conclusion notification
    MatchEnded {
        winner: Option<Player>,
        reason: String,
        final_room: GameRoom,
    },

    /// Player disconnection
    PlayerLeft {
        player_chain_id: String,
        player_wallet: String,
    },

    // Hub chain escrow messages
    EscrowOpen {
        match_id: String,
        host_wallet: String,
        stake_amount: u64,
    },
    
    EscrowJoin {
        match_id: String,
        joiner_wallet: String,
    },
    
    EscrowDeposit {
        match_id: String,
        player_wallet: String,
        amount: u64,
    },
    
    EscrowSettle {
        match_id: String,
        winner_wallet: Option<String>,
    },
    
    // Reward distribution
    RewardCredit {
        player_wallet: String,
        amount: u64,
        reason: String,
    },
}

// ============================================================================
// RESPONSES
// ============================================================================

/// Response types for operations
#[derive(Debug, Clone, Serialize, Deserialize, Union)]
pub enum SignalSiegeResponse {
    Success(SuccessResponse),
    RoomCreated(RoomCreatedResponse),
    RoomJoined(RoomJoinedResponse),
    MoveResult(MoveResultResponse),
    PuzzleResult(PuzzleResultResponse),
    Error(ErrorResponse),
}

#[derive(Debug, Clone, Serialize, Deserialize, SimpleObject)]
pub struct SuccessResponse {
    pub message: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, SimpleObject)]
pub struct RoomCreatedResponse {
    pub host_chain_id: String,
    pub room: GameRoom,
}

#[derive(Debug, Clone, Serialize, Deserialize, SimpleObject)]
pub struct RoomJoinedResponse {
    pub host_chain_id: String,
    pub message: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, SimpleObject)]
pub struct MoveResultResponse {
    pub success: bool,
    pub message: String,
    pub signal_result: Option<SignalResult>,
    pub game_ended: bool,
    pub winner: Option<Player>,
}

#[derive(Debug, Clone, Serialize, Deserialize, SimpleObject)]
pub struct PuzzleResultResponse {
    pub success: bool,
    pub message: String,
    pub signal_result: Option<SignalResult>,
    pub puzzle_won: bool,
    pub reward: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize, SimpleObject)]
pub struct ErrorResponse {
    pub error: String,
}

// ============================================================================
// ERRORS
// ============================================================================

/// Contract errors
#[derive(Debug, Clone, thiserror::Error)]
pub enum SignalSiegeError {
    #[error("Not registered")]
    NotRegistered,
    #[error("Already registered")]
    AlreadyRegistered,
    #[error("Invalid username")]
    InvalidUsername,
    #[error("Not your turn")]
    NotYourTurn,
    #[error("Game not in progress")]
    GameNotInProgress,
    #[error("Invalid move")]
    InvalidMove,
    #[error("Not in room")]
    NotInRoom,
    #[error("Room is full")]
    RoomFull,
    #[error("Room not found")]
    RoomNotFound,
    #[error("Already claimed today")]
    AlreadyClaimedToday,
    #[error("Already played puzzle today")]
    AlreadyPlayedPuzzleToday,
    #[error("Insufficient balance")]
    InsufficientBalance,
    #[error("Identity not verified")]
    IdentityNotVerified,
    #[error("Invalid signature")]
    InvalidSignature,
    #[error("Tile not in inventory")]
    TileNotInInventory,
    #[error("Cell not empty")]
    CellNotEmpty,
    #[error("Cannot place on core/relay/wall")]
    CannotPlaceHere,
    #[error("Escrow not ready")]
    EscrowNotReady,
}

impl SignalSiegeError {
    pub fn into_response(self) -> SignalSiegeResponse {
        SignalSiegeResponse::Error(ErrorResponse {
            error: self.to_string(),
        })
    }
}

// ============================================================================
// INSTANTIATION
// ============================================================================

/// Arguments for instantiating the application
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InstantiationArgument {
    pub hub_chain_id: Option<String>,
}

// ============================================================================
// REWARDS CONFIGURATION
// ============================================================================

/// Reward amounts for game outcomes
pub struct Rewards;

impl Rewards {
    // PvP rewards (winner takes stake)
    pub const PVP_WINNER_BONUS: u64 = 50;
    pub const PVP_LOSER_CONSOLATION: u64 = 10;
    
    // Puzzle rewards
    pub const PUZZLE_WIN: u64 = 150;
    pub const PUZZLE_FAIL: u64 = 25;
    
    // Training rewards (capped)
    pub const TRAINING_WIN: u64 = 5;
    pub const TRAINING_MAX_DAILY: u64 = 50;
    
    // Daily claim
    pub const DAILY_CLAIM: u64 = 50;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/// Get current day index from timestamp (microseconds)
pub fn get_day_index(timestamp_micros: u64) -> u32 {
    // Convert to days since epoch
    let seconds = timestamp_micros / 1_000_000;
    let days = seconds / 86400;
    days as u32
}

/// Verify EIP-191 personal_sign signature (simplified)
/// In production, use proper secp256k1 recovery
pub fn verify_eip191_signature(
    _message: &str,
    _signature: &str,
    _expected_address: &str,
) -> bool {
    // Note: Full EIP-191 verification requires secp256k1 ecrecover
    // For WASM size constraints, we use a simplified check
    // The signature format should be: 0x + 65 bytes (130 hex chars)
    // In production, add k256 crate for proper verification
    
    // For now, accept if signature is properly formatted
    // This is marked as "unverified" in the profile
    _signature.starts_with("0x") && _signature.len() == 132
}
