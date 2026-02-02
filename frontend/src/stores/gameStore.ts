// Zustand store for game state
// Manages room, puzzle, training, and gameplay

import { create } from 'zustand';
import {
  getRoom,
  getPuzzle,
  getTraining,
  createRoom,
  joinRoom,
  leaveRoom,
  clearRoom,
  playTurn,
  startDailyPuzzle,
  playPuzzleTurn,
  startTraining,
  playTrainingTurn,
  forfeit,
  syncInbox,
  claimDaily,
} from '../lib/gameApi';
import type {
  GameRoom,
  PuzzleState,
  TileKind,
  Rotation,
} from '../lib/types';

interface GameState {
  // PvP Room
  room: GameRoom | null;
  isLoadingRoom: boolean;
  roomError: string | null;
  
  // Puzzle
  puzzle: PuzzleState | null;
  isLoadingPuzzle: boolean;
  
  // Training
  training: GameRoom | null;
  isLoadingTraining: boolean;
  
  // Gameplay UI state
  selectedTile: TileKind | null;
  selectedRotation: Rotation;
  actionType: 'place' | 'rotate' | 'move_jammer';
  isProcessingMove: boolean;
  
  // Signal animation
  lastSignalPath: number[];
  showSignalAnimation: boolean;
  
  // Actions - Room
  fetchRoom: () => Promise<void>;
  refreshRoomSilent: () => Promise<void>;
  createNewRoom: (mapId: number, stake: number) => Promise<void>;
  joinExistingRoom: (hostChainId: string) => Promise<void>;
  exitRoom: () => Promise<void>;
  
  // Actions - Gameplay
  selectTile: (tile: TileKind | null) => void;
  setRotation: (rotation: Rotation) => void;
  setActionType: (action: 'place' | 'rotate' | 'move_jammer') => void;
  makeMove: (position: number) => Promise<void>;
  forfeitMatch: () => Promise<void>;
  syncMessages: () => Promise<void>;
  
  // Actions - Puzzle
  fetchPuzzle: () => Promise<void>;
  startPuzzle: () => Promise<void>;
  makePuzzleMove: (position: number) => Promise<void>;
  
  // Actions - Training
  fetchTraining: () => Promise<void>;
  startTrainingMatch: (mapId: number) => Promise<void>;
  makeTrainingMove: (position: number) => Promise<void>;
  
  // Actions - Daily
  claimDailyCoins: () => Promise<void>;
  
  // Animation
  triggerSignalAnimation: (path: number[]) => void;
  clearSignalAnimation: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  // Initial state
  room: null,
  isLoadingRoom: false,
  roomError: null,
  puzzle: null,
  isLoadingPuzzle: false,
  training: null,
  isLoadingTraining: false,
  selectedTile: null,
  selectedRotation: 'R0',
  actionType: 'place',
  isProcessingMove: false,
  lastSignalPath: [],
  showSignalAnimation: false,
  
  // ========================================================================
  // ROOM ACTIONS
  // ========================================================================
  
  fetchRoom: async () => {
    set({ isLoadingRoom: true, roomError: null });
    try {
      // Sync inbox first to receive cross-chain messages (e.g., opponent joining)
      await syncInbox();
      
      const room = await getRoom();
      set({ room, isLoadingRoom: false });
      
      // Trigger signal animation if there's a last signal
      if (room?.lastSignal?.path) {
        get().triggerSignalAnimation(room.lastSignal.path);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      set({ isLoadingRoom: false, roomError: message });
    }
  },
  
  // Silent refresh for polling - doesn't show loading state
  refreshRoomSilent: async () => {
    try {
      await syncInbox();
      const room = await getRoom();
      const prevRoom = get().room;
      set({ room });
      
      // Only trigger animation if lastSignal changed
      if (room?.lastSignal?.path && room.lastSignal.path !== prevRoom?.lastSignal?.path) {
        get().triggerSignalAnimation(room.lastSignal.path);
      }
    } catch (error) {
      // Silent fail for polling
      console.warn('Silent room refresh failed:', error);
    }
  },
  
  createNewRoom: async (mapId: number, stake: number) => {
    set({ isLoadingRoom: true, roomError: null });
    try {
      await createRoom(mapId, stake);
      await get().fetchRoom();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      set({ isLoadingRoom: false, roomError: message });
      throw error;
    }
  },
  
  joinExistingRoom: async (hostChainId: string) => {
    set({ isLoadingRoom: true, roomError: null });
    try {
      await joinRoom(hostChainId);
      // Wait a bit for cross-chain message
      await new Promise(r => setTimeout(r, 2000));
      await get().syncMessages();
      await get().fetchRoom();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      set({ isLoadingRoom: false, roomError: message });
      throw error;
    }
  },
  
  exitRoom: async () => {
    try {
      await leaveRoom();
      await clearRoom();
      set({ room: null });
    } catch (error) {
      console.warn('Failed to exit room:', error);
      set({ room: null });
    }
  },
  
  // ========================================================================
  // GAMEPLAY ACTIONS
  // ========================================================================
  
  selectTile: (tile: TileKind | null) => {
    set({ selectedTile: tile, actionType: tile ? 'place' : 'place' });
  },
  
  setRotation: (rotation: Rotation) => {
    set({ selectedRotation: rotation });
  },
  
  setActionType: (action: 'place' | 'rotate' | 'move_jammer') => {
    set({ actionType: action, selectedTile: action === 'place' ? get().selectedTile : null });
  },
  
  makeMove: async (position: number) => {
    const { selectedTile, selectedRotation, actionType } = get();
    
    set({ isProcessingMove: true });
    try {
      await playTurn(actionType, position, selectedTile ?? undefined, selectedRotation);
      
      // Clear selection and fetch updated room (silent to avoid double loading state)
      set({ selectedTile: null, actionType: 'place' });
      await get().refreshRoomSilent();
    } catch (error) {
      console.error('Move failed:', error);
      throw error;
    } finally {
      set({ isProcessingMove: false });
    }
  },
  
  forfeitMatch: async () => {
    set({ isProcessingMove: true });
    try {
      await forfeit();
      await get().refreshRoomSilent();
    } finally {
      set({ isProcessingMove: false });
    }
  },
  
  syncMessages: async () => {
    try {
      await syncInbox();
      // Use silent refresh to avoid loading state
      await get().refreshRoomSilent();
    } catch (error) {
      console.warn('Sync failed:', error);
    }
  },
  
  // ========================================================================
  // PUZZLE ACTIONS
  // ========================================================================
  
  fetchPuzzle: async () => {
    set({ isLoadingPuzzle: true });
    try {
      const puzzle = await getPuzzle();
      set({ puzzle, isLoadingPuzzle: false });
    } catch {
      set({ isLoadingPuzzle: false });
    }
  },
  
  startPuzzle: async () => {
    set({ isLoadingPuzzle: true });
    try {
      await startDailyPuzzle();
      await get().fetchPuzzle();
    } catch (error) {
      set({ isLoadingPuzzle: false });
      throw error;
    }
  },
  
  makePuzzleMove: async (position: number) => {
    const { selectedTile, selectedRotation, actionType } = get();
    
    set({ isProcessingMove: true });
    try {
      await playPuzzleTurn(actionType, position, selectedTile ?? undefined, selectedRotation);
      set({ selectedTile: null, actionType: 'place' });
      await get().fetchPuzzle();
    } finally {
      set({ isProcessingMove: false });
    }
  },
  
  // ========================================================================
  // TRAINING ACTIONS
  // ========================================================================
  
  fetchTraining: async () => {
    set({ isLoadingTraining: true });
    try {
      const training = await getTraining();
      set({ training, isLoadingTraining: false });
    } catch {
      set({ isLoadingTraining: false });
    }
  },
  
  startTrainingMatch: async (mapId: number) => {
    set({ isLoadingTraining: true });
    try {
      await startTraining(mapId);
      
      // Poll for training state - the mutation schedules an operation
      // that gets processed in a future block, so we need to wait
      for (let attempt = 0; attempt < 10; attempt++) {
        await new Promise(resolve => setTimeout(resolve, 1500));
        await get().fetchTraining();
        const training = get().training;
        if (training) {
          console.log('[GameStore] Training started successfully');
          return;
        }
        console.log(`[GameStore] Waiting for training state... attempt ${attempt + 1}`);
      }
      
      console.warn('[GameStore] Training state not found after polling');
    } catch (error) {
      set({ isLoadingTraining: false });
      throw error;
    }
  },
  
  makeTrainingMove: async (position: number) => {
    const { selectedTile, selectedRotation, actionType } = get();
    
    set({ isProcessingMove: true });
    try {
      await playTrainingTurn(actionType, position, selectedTile ?? undefined, selectedRotation);
      set({ selectedTile: null, actionType: 'place' });
      await get().fetchTraining();
    } finally {
      set({ isProcessingMove: false });
    }
  },
  
  // ========================================================================
  // DAILY CLAIM
  // ========================================================================
  
  claimDailyCoins: async () => {
    await claimDaily();
  },
  
  // ========================================================================
  // ANIMATION
  // ========================================================================
  
  triggerSignalAnimation: (path: number[]) => {
    set({ lastSignalPath: path, showSignalAnimation: true });
    
    // Auto-clear after animation
    setTimeout(() => {
      set({ showSignalAnimation: false });
    }, 2000);
  },
  
  clearSignalAnimation: () => {
    set({ showSignalAnimation: false });
  },
}));
