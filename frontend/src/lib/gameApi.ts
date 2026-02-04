// Game API - High-level functions for SignalSiege
// All on-chain interactions through GraphQL

import { 
  query, 
  mutate, 
  queryWithSync, 
  getChainId, 
  getAutoSignerAddress,
  syncInboxFast,
} from './linera';
import type { 
  GameRoom, 
  PlayerProfile, 
  PuzzleState,
  TileKind,
  Rotation,
} from './types';

// ============================================================================
// GRAPHQL QUERIES
// ============================================================================

const QUERIES = {
  // Chain info
  GET_CHAIN_ID: `query GetChainId { chainId }`,
  GET_IS_HOSTING: `query GetIsHosting { isHosting }`,
  
  // Room state
  GET_ROOM: `
    query GetRoom {
      room {
        hostChainId
        playerChainIds
        playerWallets
        usernames
        mapId
        stakeAmount
        board {
          cells { kind rotation owner }
          relays
          walls
          mapId
        }
        inventories {
          wireStraight
          wireCorner
          wireTJunction
          wireCross
          blocker
          jammer
          amplifier
        }
        currentTurn
        turnNumber
        status
        winner
        moveHistory
        lastSignal {
          reached
          path
          capturedRelays
          reachedOpponentCore
        }
        createdAt
        lastMoveAt
      }
    }
  `,
  
  // Puzzle state
  GET_PUZZLE: `
    query GetPuzzle {
      puzzle {
        puzzleId
        dayIndex
        board {
          cells { kind rotation owner }
          relays
          walls
          mapId
        }
        inventory {
          wireStraight
          wireCorner
          wireTJunction
          wireCross
          blocker
          jammer
          amplifier
        }
        targetTurns
        currentTurn
        isCompleted
        isWon
        moveHistory
      }
    }
  `,
  
  // Training state
  GET_TRAINING: `
    query GetTraining {
      training {
        hostChainId
        mapId
        board {
          cells { kind rotation owner }
          relays
          walls
          mapId
        }
        inventories {
          wireStraight
          wireCorner
          wireTJunction
          wireCross
          blocker
          jammer
          amplifier
        }
        currentTurn
        turnNumber
        status
        winner
        moveHistory
        lastSignal {
          reached
          path
          capturedRelays
          reachedOpponentCore
        }
      }
    }
  `,
  
  // Player profile
  GET_PROFILE: `
    query GetProfile($wallet: String!) {
      myProfile(wallet: $wallet) {
        username
        lineraAddress
        evmAddress
        identityVerified
        coins
        totalWins
        totalLosses
        totalDraws
        totalGames
        pvpWins
        pvpLosses
        puzzleWins
        puzzleAttempts
        lastClaimDay
        lastPuzzleDay
        createdAt
      }
    }
  `,
  
  // Turn check
  IS_MY_TURN: `
    query IsMyTurn($wallet: String!) {
      isMyTurn(wallet: $wallet)
    }
  `,
  
  // Leaderboard
  GET_LEADERBOARD: `
    query GetLeaderboard($limit: Int) {
      leaderboard(limit: $limit) {
        username
        totalWins
        totalGames
        pvpWins
        coins
      }
    }
  `,
};

// ============================================================================
// GRAPHQL MUTATIONS
// ============================================================================

const MUTATIONS = {
  // Player management
  REGISTER: `mutation Register($username: String!) { register(username: $username) }`,
  
  LINK_IDENTITY: `
    mutation LinkIdentity($evmAddress: String!, $message: String!, $signature: String!) {
      linkIdentity(evmAddress: $evmAddress, message: $message, signature: $signature)
    }
  `,
  
  // Daily claim
  CLAIM_DAILY: `mutation ClaimDaily { claimDaily }`,
  
  // Puzzle
  START_PUZZLE: `mutation StartPuzzle { startDailyPuzzle }`,
  
  PLAY_PUZZLE_TURN: `
    mutation PlayPuzzleTurn($actionType: String!, $position: Int!, $tileKind: TileKind, $rotation: Rotation) {
      playPuzzleTurn(actionType: $actionType, position: $position, tileKind: $tileKind, rotation: $rotation)
    }
  `,
  
  // Training
  START_TRAINING: `mutation StartTraining($mapId: Int!) { startTraining(mapId: $mapId) }`,
  
  PLAY_TRAINING_TURN: `
    mutation PlayTrainingTurn($actionType: String!, $position: Int!, $tileKind: TileKind, $rotation: Rotation) {
      playTrainingTurn(actionType: $actionType, position: $position, tileKind: $tileKind, rotation: $rotation)
    }
  `,
  
  // PvP Room
  CREATE_ROOM: `
    mutation CreateRoom($mapId: Int!, $stakeAmount: Int!) {
      createRoom(mapId: $mapId, stakeAmount: $stakeAmount)
    }
  `,
  
  JOIN_ROOM: `mutation JoinRoom($hostChainId: String!) { joinRoom(hostChainId: $hostChainId) }`,
  
  LEAVE_ROOM: `mutation LeaveRoom { leaveRoom }`,
  
  CLEAR_ROOM: `mutation ClearRoom { clearRoom }`,
  
  // Wagering
  REQUEST_DEPOSIT: `mutation RequestDeposit { requestDeposit }`,
  CONFIRM_READY: `mutation ConfirmReady { confirmReady }`,
  
  // Gameplay
  PLAY_TURN: `
    mutation PlayTurn($actionType: String!, $position: Int!, $tileKind: TileKind, $rotation: Rotation) {
      playTurn(actionType: $actionType, position: $position, tileKind: $tileKind, rotation: $rotation)
    }
  `,
  
  // Forfeit
  FORFEIT: `mutation Forfeit { forfeit }`,
  
  // Sync
  SYNC_INBOX: `mutation SyncInbox { syncInbox }`,
};

// ============================================================================
// QUERY FUNCTIONS
// ============================================================================

export async function getCurrentChainId(): Promise<string> {
  return getChainId();
}

export async function getCurrentWallet(): Promise<string> {
  return getAutoSignerAddress();
}

export async function getRoom(): Promise<GameRoom | null> {
  const result = await queryWithSync<{ room: GameRoom | null }>(QUERIES.GET_ROOM);
  return result.room;
}

// Fast room query - no sync, just query current state
// Used for polling when we've already done a background sync
export async function getRoomFast(): Promise<GameRoom | null> {
  const result = await query<{ room: GameRoom | null }>(QUERIES.GET_ROOM);
  return result.room;
}

// Export fast sync for background operations
export { syncInboxFast };

export async function getPuzzle(): Promise<PuzzleState | null> {
  const result = await query<{ puzzle: PuzzleState | null }>(QUERIES.GET_PUZZLE);
  return result.puzzle;
}

export async function getTraining(): Promise<GameRoom | null> {
  const result = await query<{ training: GameRoom | null }>(QUERIES.GET_TRAINING);
  return result.training;
}

export async function getProfile(wallet?: string): Promise<PlayerProfile | null> {
  const w = wallet || getAutoSignerAddress();
  const result = await query<{ myProfile: PlayerProfile | null }>(QUERIES.GET_PROFILE, { wallet: w });
  return result.myProfile;
}

export async function isMyTurn(wallet?: string): Promise<boolean> {
  const w = wallet || getAutoSignerAddress();
  const result = await queryWithSync<{ isMyTurn: boolean }>(QUERIES.IS_MY_TURN, { wallet: w });
  return result.isMyTurn;
}

export async function getLeaderboard(limit = 10): Promise<PlayerProfile[]> {
  const result = await query<{ leaderboard: PlayerProfile[] }>(QUERIES.GET_LEADERBOARD, { limit });
  return result.leaderboard;
}

// ============================================================================
// MUTATION FUNCTIONS
// ============================================================================

export async function register(username: string): Promise<void> {
  await mutate(MUTATIONS.REGISTER, { username });
}

export async function linkIdentity(evmAddress: string, message: string, signature: string): Promise<void> {
  await mutate(MUTATIONS.LINK_IDENTITY, { evmAddress, message, signature });
}

export async function claimDaily(): Promise<void> {
  await mutate(MUTATIONS.CLAIM_DAILY);
}

export async function startDailyPuzzle(): Promise<void> {
  await mutate(MUTATIONS.START_PUZZLE);
}

export async function playPuzzleTurn(
  actionType: string,
  position: number,
  tileKind?: TileKind,
  rotation?: Rotation
): Promise<void> {
  await mutate(MUTATIONS.PLAY_PUZZLE_TURN, { actionType, position, tileKind, rotation });
}

export async function startTraining(mapId: number): Promise<void> {
  await mutate(MUTATIONS.START_TRAINING, { mapId });
}

export async function playTrainingTurn(
  actionType: string,
  position: number,
  tileKind?: TileKind,
  rotation?: Rotation
): Promise<void> {
  await mutate(MUTATIONS.PLAY_TRAINING_TURN, { actionType, position, tileKind, rotation });
}

export async function createRoom(mapId: number, stakeAmount: number): Promise<void> {
  await mutate(MUTATIONS.CREATE_ROOM, { mapId, stakeAmount });
}

export async function joinRoom(hostChainId: string): Promise<void> {
  await mutate(MUTATIONS.JOIN_ROOM, { hostChainId });
}

export async function leaveRoom(): Promise<void> {
  await mutate(MUTATIONS.LEAVE_ROOM);
}

export async function clearRoom(): Promise<void> {
  await mutate(MUTATIONS.CLEAR_ROOM);
}

export async function requestDeposit(): Promise<void> {
  await mutate(MUTATIONS.REQUEST_DEPOSIT);
}

export async function confirmReady(): Promise<void> {
  await mutate(MUTATIONS.CONFIRM_READY);
}

export async function playTurn(
  actionType: string,
  position: number,
  tileKind?: TileKind,
  rotation?: Rotation
): Promise<void> {
  await mutate(MUTATIONS.PLAY_TURN, { actionType, position, tileKind, rotation });
}

export async function forfeit(): Promise<void> {
  await mutate(MUTATIONS.FORFEIT);
}

export async function syncInbox(): Promise<void> {
  await mutate(MUTATIONS.SYNC_INBOX);
}

// ============================================================================
// POLLING UTILITIES
// ============================================================================

/**
 * Poll for room updates (useful for waiting on opponent)
 */
export async function pollRoomUpdates(
  callback: (room: GameRoom | null) => void,
  interval = 2000,
  maxPolls = 100,
): Promise<() => void> {
  let pollCount = 0;
  let cancelled = false;
  
  const poll = async () => {
    if (cancelled || pollCount >= maxPolls) return;
    
    try {
      const room = await getRoom();
      callback(room);
    } catch (error) {
      console.warn('[GameAPI] Poll error:', error);
    }
    
    pollCount++;
    if (!cancelled && pollCount < maxPolls) {
      setTimeout(poll, interval);
    }
  };
  
  poll();
  
  return () => {
    cancelled = true;
  };
}

// ============================================================================
// RE-EXPORTS
// ============================================================================

export { getChainId, getAutoSignerAddress as getWalletAddress } from './linera';
