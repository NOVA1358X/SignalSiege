// SignalSiege - TypeScript Types
// Matches Rust contract types

// ============================================================================
// ENUMS
// ============================================================================

// Backend tile kinds (from Rust)
export type TileKind =
  | 'EMPTY'
  | 'CORE'
  | 'RELAY'
  | 'WALL'
  | 'WIRE_STRAIGHT'
  | 'WIRE_CORNER'
  | 'WIRE_T_JUNCTION'
  | 'WIRE_CROSS'
  | 'BLOCKER'
  | 'JAMMER'
  | 'AMPLIFIER'
  // Frontend display names (aliases)
  | 'Empty'
  | 'Blocked'
  | 'StraightPath'
  | 'CurvedPath'
  | 'TJunction'
  | 'Crossroad'
  | 'Tower'
  | 'Jammer'
  | 'Amplifier';

export type Rotation = 'R0' | 'R90' | 'R180' | 'R270';

// Player enum - matches backend and frontend usage
export type Player = 'One' | 'Two' | 'player1' | 'player2';

export type GameStatus =
  | 'WaitingForPlayer'
  | 'WaitingForDeposits'
  | 'InProgress'
  | 'Finished'
  | 'Draw'
  | 'Abandoned'
  | 'Waiting'
  | 'Playing';

// ============================================================================
// GAME TYPES
// ============================================================================

export interface Cell {
  kind: TileKind;
  rotation: Rotation;
  owner: number;
  // Alias for compatibility with frontend components
  tile?: { kind: TileKind; rotation: Rotation } | null;
}

export interface Board {
  cells: Cell[];
  relays: number[];
  walls: number[];
  mapId: number;
}

export interface TileInventory {
  wireStraight: number;
  wireCorner: number;
  wireTJunction: number;
  wireCross: number;
  blocker: number;
  jammer: number;
  amplifier: number;
  // Aliases for components
  straight?: number;
  curved?: number;
  tJunction?: number;
  crossroad?: number;
}

export interface SignalResult {
  reached: number[];
  path: number[];
  capturedRelays: number[];
  reachedOpponentCore: boolean;
  // Additional properties for UI
  strength?: number;
  amplified?: boolean;
  blocked?: boolean;
  reachedTarget?: boolean;
}

export interface GameAction {
  actionType: string;
  position: number;
  tileKind?: TileKind;
  rotation?: Rotation;
}

export interface GameRoom {
  hostChainId: string;
  playerChainIds: string[];
  playerWallets: string[];
  usernames: string[];
  mapId: number;
  stakeAmount: number;
  board: Board;
  inventories: TileInventory[];
  currentTurn: Player;
  turnNumber: number;
  status: GameStatus;
  winner?: Player;
  moveHistory: string[];
  lastSignal?: SignalResult;
  createdAt: number;
  lastMoveAt: number;
  // Aliases for component compatibility
  player1?: string;
  player2?: string;
  stakes?: number;
  player1Inventory?: TileInventory;
  player2Inventory?: TileInventory;
}

export interface PuzzleState {
  puzzleId: number;
  dayIndex: number;
  board: Board;
  inventory: TileInventory;
  targetTurns: number;
  currentTurn: number;
  isCompleted: boolean;
  isWon: boolean;
  moveHistory: string[];
  // Aliases for compatibility
  status?: GameStatus;
  completed?: boolean;
  turnNumber?: number;
  winner?: Player;
  player1Inventory?: TileInventory;
}

export interface Escrow {
  matchId: string;
  playerWallets: string[];
  stakeAmount: number;
  deposits: number[];
  isSettled: boolean;
  winnerWallet?: string;
  createdAt: number;
}

// ============================================================================
// PLAYER TYPES
// ============================================================================

export interface PlayerProfile {
  username: string;
  lineraAddress: string;
  evmAddress?: string;
  identityVerified: boolean;
  coins: number;
  totalWins: number;
  totalLosses: number;
  totalDraws: number;
  totalGames: number;
  pvpWins: number;
  pvpLosses: number;
  puzzleWins: number;
  puzzleAttempts: number;
  lastClaimDay: number;
  lastPuzzleDay: number;
  createdAt: number;
  // Aliases for component compatibility
  coinBalance?: number;
  wins?: number;
  losses?: number;
  draws?: number;
  puzzlesSolved?: number;
  lastDailyClaim?: string;
}

// ============================================================================
// RESPONSE TYPES
// ============================================================================

export interface SuccessResponse {
  message: string;
}

export interface RoomCreatedResponse {
  hostChainId: string;
  room: GameRoom;
}

export interface RoomJoinedResponse {
  hostChainId: string;
  message: string;
}

export interface MoveResultResponse {
  success: boolean;
  message: string;
  signalResult?: SignalResult;
  gameEnded: boolean;
  winner?: Player;
}

export interface PuzzleResultResponse {
  success: boolean;
  message: string;
  signalResult?: SignalResult;
  puzzleWon: boolean;
  reward: number;
}

export interface ErrorResponse {
  error: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const BOARD_SIZE = 7;
export const BOARD_CELLS = 49;
export const MAX_TURNS = 20;

// Tile display info - includes both UPPERCASE and CamelCase variants for compatibility
export const TILE_INFO: Record<string, { name: string; color: string; description: string }> = {
  // Uppercase variants (backend format)
  EMPTY: { name: 'Empty', color: '#1f1f2e', description: 'Empty cell' },
  CORE: { name: 'Core', color: '#00ff88', description: 'Your power source' },
  RELAY: { name: 'Relay', color: '#ffff00', description: 'Capture point' },
  WALL: { name: 'Wall', color: '#444444', description: 'Impassable' },
  WIRE_STRAIGHT: { name: 'Straight Wire', color: '#00ffff', description: 'Connects opposite sides' },
  WIRE_CORNER: { name: 'Corner Wire', color: '#00ffff', description: 'Connects adjacent sides' },
  WIRE_T_JUNCTION: { name: 'T-Junction', color: '#00ffff', description: 'Connects 3 sides' },
  WIRE_CROSS: { name: 'Cross Wire', color: '#00ffff', description: 'Connects all 4 sides' },
  BLOCKER: { name: 'Blocker', color: '#ff8800', description: 'Stops signal' },
  JAMMER: { name: 'Jammer', color: '#ff00ff', description: 'Reduces signal range' },
  AMPLIFIER: { name: 'Amplifier', color: '#0088ff', description: 'Extends signal range' },
  // CamelCase variants (frontend compatibility)
  Empty: { name: 'Empty', color: '#1f1f2e', description: 'Empty cell' },
  Blocked: { name: 'Wall', color: '#444444', description: 'Impassable' },
  StraightPath: { name: 'Straight Wire', color: '#00ffff', description: 'Connects opposite sides' },
  CurvedPath: { name: 'Corner Wire', color: '#00ffff', description: 'Connects adjacent sides' },
  TJunction: { name: 'T-Junction', color: '#00ffff', description: 'Connects 3 sides' },
  Crossroad: { name: 'Cross Wire', color: '#00ffff', description: 'Connects all 4 sides' },
  SignalSource: { name: 'Signal Source', color: '#00ff88', description: 'Your power source' },
  Target: { name: 'Target', color: '#ffff00', description: 'Capture point' },
  Booster: { name: 'Amplifier', color: '#0088ff', description: 'Extends signal range' },
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export function idxToPos(idx: number): [number, number] {
  return [Math.floor(idx / BOARD_SIZE), idx % BOARD_SIZE];
}

export function posToIdx(row: number, col: number): number {
  return row * BOARD_SIZE + col;
}

export function isValidPos(row: number, col: number): boolean {
  return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;
}

export function getPlayerColor(player: Player | number): string {
  if (player === 'One' || player === 1) return '#00ff88';
  if (player === 'Two' || player === 2) return '#ff0044';
  return '#ffff00';
}

export function formatCoins(coins: number): string {
  if (coins >= 1000000) return `${(coins / 1000000).toFixed(1)}M`;
  if (coins >= 1000) return `${(coins / 1000).toFixed(1)}K`;
  return coins.toString();
}

export function shortenAddress(address: string, chars = 4): string {
  if (!address) return '';
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

export function shortenChainId(chainId: string, chars = 6): string {
  if (!chainId) return '';
  if (chainId.length <= chars * 2 + 3) return chainId;
  return `${chainId.slice(0, chars)}...${chainId.slice(-chars)}`;
}
