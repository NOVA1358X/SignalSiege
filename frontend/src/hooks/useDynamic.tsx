// Dynamic.xyz wallet integration hooks
// Handles EVM wallet login and identity linking

import { useCallback, useEffect, useState, useRef } from 'react';
import { useDynamicContext, useUserWallets, useIsLoggedIn } from '@dynamic-labs/sdk-react-core';
import { useLineraStore } from '../stores/lineraStore';
import { lineraAdapter } from '../lib/linera/lineraAdapter';

// Hook for Dynamic.xyz wallet operations
export function useDynamicWallet() {
  const { user, primaryWallet, setShowAuthFlow, handleLogOut } = useDynamicContext();
  const isAuthenticated = useIsLoggedIn();
  useUserWallets(); // Keep for side effects
  
  const { 
    evmAddress, 
    chainId, 
    autoSignerAddress,
    isConnected,
    isConnecting,
    connect: lineraConnect, 
    registerPlayer: _registerPlayer,
    logout: lineraLogout,
    refreshProfile,
  } = useLineraStore();
  
  const [isAutoConnecting, setIsAutoConnecting] = useState(false);
  const autoConnectAttemptedRef = useRef(false);
  
  const [isLinking, setIsLinking] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  
  // Use localStorage to persist link attempt across renders to prevent loops
  const getHasAttempted = () => {
    try {
      return localStorage.getItem('signalsiege_link_attempted') === 'true';
    } catch {
      return false;
    }
  };
  
  const setHasAttempted = (value: boolean) => {
    try {
      if (value) {
        localStorage.setItem('signalsiege_link_attempted', 'true');
      } else {
        localStorage.removeItem('signalsiege_link_attempted');
      }
    } catch {
      // Ignore
    }
  };
  
  // Get EVM address from Dynamic wallet
  const dynamicEvmAddress = primaryWallet?.address?.toLowerCase() ?? null;
  
  // Check if identity is already linked
  const isLinked = evmAddress !== null && evmAddress === dynamicEvmAddress;
  
  // Check if needs linking (logged into Dynamic but not linked to Linera)
  const needsLinking = isAuthenticated && dynamicEvmAddress && !isLinked && chainId;
  
  // Open Dynamic login modal
  const openLogin = useCallback(() => {
    setShowAuthFlow(true);
  }, [setShowAuthFlow]);
  
  // Sign message using Dynamic wallet
  const signMessage = useCallback(async (message: string): Promise<string | null> => {
    if (!primaryWallet) return null;
    
    try {
      const signature = await primaryWallet.signMessage(message);
      return signature ?? null;
    } catch (error) {
      console.error('Failed to sign message:', error);
      return null;
    }
  }, [primaryWallet]);
  
  // Link EVM identity to Linera chain
  const linkIdentity = useCallback(async (): Promise<boolean> => {
    if (!dynamicEvmAddress || !autoSignerAddress || !chainId) {
      setLinkError('Wallet or chain not ready');
      return false;
    }
    
    // Prevent multiple simultaneous attempts
    if (isLinking || getHasAttempted()) {
      return false;
    }
    
    setHasAttempted(true);
    setIsLinking(true);
    setLinkError(null);
    
    try {
      // Create message to sign - includes chain ID and auto-signer for verification
      const timestamp = Math.floor(Date.now() / 1000);
      const message = [
        'SignalSiege Identity Link',
        `Chain: ${chainId}`,
        `Signer: ${autoSignerAddress}`,
        `Time: ${timestamp}`,
      ].join('\n');
      
      // Sign with EVM wallet
      const signature = await signMessage(message);
      if (!signature) {
        setLinkError('Signing cancelled');
        setIsLinking(false);
        return false;
      }
      
      // Call contract to link identity - include all 3 required params
      const mutation = `
        mutation LinkIdentity($evmAddress: String!, $message: String!, $signature: String!) {
          linkIdentity(evmAddress: $evmAddress, message: $message, signature: $signature)
        }
      `;
      
      await lineraAdapter.mutate(mutation, {
        evmAddress: dynamicEvmAddress,
        message: message,
        signature: signature,
      });
      
      // Refresh profile to confirm link
      await refreshProfile();
      
      setIsLinking(false);
      return true;
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      setLinkError(errMsg);
      setIsLinking(false);
      return false;
    }
  }, [dynamicEvmAddress, autoSignerAddress, chainId, signMessage, refreshProfile, isLinking]);
  
  // Full logout - both Dynamic and Linera
  const fullLogout = useCallback(async () => {
    try {
      await handleLogOut();
    } catch {
      // Ignore Dynamic logout errors
    }
    lineraLogout();
    autoConnectAttemptedRef.current = false;
  }, [handleLogOut, lineraLogout]);
  
  // Auto-connect to Linera when Dynamic wallet authenticates
  useEffect(() => {
    const autoConnectToLinera = async () => {
      // Check conditions: authenticated with Dynamic, not yet connected to Linera, not already attempting
      if (isAuthenticated && dynamicEvmAddress && !isConnected && !isConnecting && !isAutoConnecting && !autoConnectAttemptedRef.current) {
        autoConnectAttemptedRef.current = true;
        setIsAutoConnecting(true);
        
        console.log('[useDynamic] Auto-connecting to Linera after Dynamic auth...');
        
        try {
          // Connect to Linera with the EVM address
          await lineraConnect(dynamicEvmAddress);
          console.log('[useDynamic] Auto-connect to Linera successful');
        } catch (error) {
          console.error('[useDynamic] Auto-connect to Linera failed:', error);
          autoConnectAttemptedRef.current = false; // Allow retry on error
        } finally {
          setIsAutoConnecting(false);
        }
      }
    };
    
    // Small delay to let Dynamic settle
    const timer = setTimeout(autoConnectToLinera, 500);
    return () => clearTimeout(timer);
  }, [isAuthenticated, dynamicEvmAddress, isConnected, isConnecting, isAutoConnecting, lineraConnect]);
  
  // Auto-attempt link when wallet connects (only once per session)
  useEffect(() => {
    if (needsLinking && !isLinking && !getHasAttempted()) {
      // Small delay to let UI settle
      const timer = setTimeout(() => {
        linkIdentity();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [needsLinking, isLinking, linkIdentity]);
  
  // Reset attempt flag when user logs out of Dynamic
  useEffect(() => {
    if (!isAuthenticated) {
      setHasAttempted(false);
      autoConnectAttemptedRef.current = false;
    }
  }, [isAuthenticated]);
  
  return {
    // Dynamic state
    user,
    primaryWallet,
    isAuthenticated,
    dynamicEvmAddress,
    
    // Connection state
    isAutoConnecting,
    
    // Linking state
    isLinked,
    isLinking,
    linkError,
    needsLinking,
    
    // Actions
    openLogin,
    signMessage,
    linkIdentity,
    fullLogout,
  };
}

// Hook for checking if user can wager (needs linked identity)
export function useCanWager() {
  // Note: isLinked could be used for enhanced verification in future
  const { profile, isConnected } = useLineraStore();
  
  // Can wager if connected to Linera and has coins
  // isLinked (EVM wallet linked) is optional - only needed for cross-chain verification
  // For simple in-game coin betting, just being connected is enough
  const hasBalance = (profile?.coinBalance ?? profile?.coins ?? 0) > 0;
  const canWager = isConnected && hasBalance;
  
  return {
    canWager,
    hasBalance,
    canPlaceBet: canWager,
    reason: !isConnected 
      ? 'Connect to Linera first' 
      : !hasBalance 
        ? 'No coins available' 
        : null,
  };
}

// Hook for formatted display values
export function useWalletDisplay() {
  const { dynamicEvmAddress, isLinked } = useDynamicWallet();
  const { autoSignerAddress, chainId } = useLineraStore();
  
  // Truncate address for display
  const truncate = (addr: string | null) => {
    if (!addr) return null;
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };
  
  return {
    evmDisplay: truncate(dynamicEvmAddress),
    signerDisplay: truncate(autoSignerAddress),
    chainDisplay: truncate(chainId),
    fullEvmAddress: dynamicEvmAddress ?? undefined,
    fullSignerAddress: autoSignerAddress,
    fullChainId: chainId,
    isLinked,
  };
}
