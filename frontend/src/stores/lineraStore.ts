// Zustand store for Linera connection state
// Manages wallet connection, auto-signer, and Dynamic integration

import { create } from 'zustand';
import { lineraAdapter } from '../lib/linera';
import { getProfile, register } from '../lib/gameApi';
import type { PlayerProfile } from '../lib/types';

interface LineraState {
  // Connection state
  isConnecting: boolean;
  isConnected: boolean;
  error: string | null;
  chainId: string | null;
  autoSignerAddress: string | null;
  evmAddress: string | null;
  
  // Profile
  profile: PlayerProfile | null;
  
  // Actions
  connect: (evmAddress?: string) => Promise<void>;
  disconnect: () => void;
  logout: () => void;
  setEvmAddress: (address: string) => void;
  refreshProfile: () => Promise<void>;
  registerPlayer: (username: string) => Promise<void>;
}

export const useLineraStore = create<LineraState>((set, get) => ({
  isConnecting: false,
  isConnected: false,
  error: null,
  chainId: null,
  autoSignerAddress: null,
  evmAddress: null,
  profile: null,
  
  /**
   * Connect to Linera network with auto-signer
   */
  connect: async (evmAddress?: string) => {
    if (get().isConnecting) return;
    
    set({ isConnecting: true, error: null });
    
    try {
      const state = await lineraAdapter.connect(evmAddress);
      
      set({
        isConnecting: false,
        isConnected: true,
        chainId: state.chainId,
        autoSignerAddress: state.autoSignerAddress,
        evmAddress: state.evmAddress,
      });
      
      // Try to fetch profile
      try {
        const profile = await getProfile();
        if (profile) {
          set({ profile });
        } else {
          // Auto-register with generated username
          console.log('[LineraStore] No profile found, auto-registering...');
          const shortAddr = state.autoSignerAddress?.slice(2, 8) || 'Player';
          const username = `Signal_${shortAddr}`;
          await register(username);
          
          // Poll for profile after registration
          for (let i = 0; i < 5; i++) {
            await new Promise(r => setTimeout(r, 1500));
            const newProfile = await getProfile();
            if (newProfile) {
              set({ profile: newProfile });
              console.log('[LineraStore] Auto-registration complete:', username);
              break;
            }
            console.log(`[LineraStore] Waiting for profile... attempt ${i + 1}`);
          }
        }
      } catch (regError) {
        console.warn('[LineraStore] Auto-registration failed:', regError);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('[LineraStore] Connection failed:', message);
      set({
        isConnecting: false,
        isConnected: false,
        error: message,
      });
    }
  },
  
  /**
   * Disconnect from Linera (keeps auto-signer)
   */
  disconnect: () => {
    lineraAdapter.disconnect();
    set({
      isConnected: false,
      chainId: null,
      autoSignerAddress: null,
      profile: null,
    });
  },
  
  /**
   * Full logout (clears auto-signer from localStorage)
   */
  logout: () => {
    lineraAdapter.logout();
    set({
      isConnected: false,
      chainId: null,
      autoSignerAddress: null,
      evmAddress: null,
      profile: null,
    });
  },
  
  /**
   * Set EVM address (after Dynamic login)
   */
  setEvmAddress: (address: string) => {
    lineraAdapter.setEvmAddress(address);
    set({ evmAddress: address.toLowerCase() });
  },
  
  /**
   * Refresh profile from chain
   */
  refreshProfile: async () => {
    if (!get().isConnected) return;
    
    try {
      const profile = await getProfile();
      set({ profile });
    } catch (error) {
      console.warn('[LineraStore] Failed to refresh profile:', error);
    }
  },
  
  /**
   * Register as a new player
   */
  registerPlayer: async (username: string) => {
    if (!get().isConnected) {
      throw new Error('Not connected');
    }
    
    await register(username);
    
    // Refresh profile after registration
    await get().refreshProfile();
  },
}));
