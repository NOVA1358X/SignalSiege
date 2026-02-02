// Lobby Page - Create or join PvP matches

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useLineraStore } from '../stores/lineraStore';
import { useGameStore } from '../stores/gameStore';
import { useDynamicWallet, useCanWager } from '../hooks/useDynamic';

const LobbyPage: React.FC = () => {
  const navigate = useNavigate();
  const { isConnected, chainId, profile, refreshProfile } = useLineraStore();
  const { room, isLoadingRoom, fetchRoom, refreshRoomSilent, createNewRoom, joinExistingRoom, exitRoom } = useGameStore();
  const { isLinked, openLogin, isAuthenticated } = useDynamicWallet();
  const { canWager, reason: wagerBlockReason } = useCanWager();
  
  // Form state
  const [mode, setMode] = useState<'menu' | 'create' | 'join'>('menu');
  const [selectedMap, setSelectedMap] = useState(0);
  const [stake, setStake] = useState(0);
  const [joinChainId, setJoinChainId] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  // Fetch profile and room on mount
  useEffect(() => {
    if (isConnected) {
      refreshProfile();
      fetchRoom();
    }
  }, [isConnected, refreshProfile, fetchRoom]);
  
  // Poll for room updates when waiting for opponent (silent - no loading state)
  useEffect(() => {
    const roomStatus = room?.status;
    if (roomStatus === 'Waiting' || roomStatus === 'WaitingForPlayer') {
      // Poll every 3 seconds to check if opponent joined
      const pollInterval = setInterval(() => {
        refreshRoomSilent();
      }, 3000);
      
      return () => clearInterval(pollInterval);
    }
  }, [room?.status, refreshRoomSilent]);
  
  // Navigate to match if room is playing
  useEffect(() => {
    const roomStatus = room?.status;
    if (roomStatus === 'Playing' || roomStatus === 'InProgress') {
      navigate('/match');
    }
  }, [room, navigate]);
  
  // Connection check
  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 mb-4">Connect to access the lobby</p>
          <button 
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-neon-cyan text-dark-900 rounded-lg font-bold"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }
  
  // Handle create room
  const handleCreate = async () => {
    // Validate stake
    if (stake > 0 && !canWager) {
      setError(wagerBlockReason ?? 'Cannot wager');
      return;
    }
    
    const coinBalance = profile?.coinBalance ?? profile?.coins ?? 0;
    if (stake > coinBalance) {
      setError('Insufficient coins');
      return;
    }
    
    setError(null);
    
    try {
      await createNewRoom(selectedMap, stake);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    }
  };
  
  // Handle join room
  const handleJoin = async () => {
    if (!joinChainId.trim()) {
      setError('Enter host chain ID');
      return;
    }
    
    setError(null);
    
    try {
      await joinExistingRoom(joinChainId.trim());
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    }
  };
  
  // Handle leave waiting room
  const handleLeave = async () => {
    await exitRoom();
    setMode('menu');
  };
  
  // Waiting room view
  const roomStatus = room?.status;
  const roomStakes = room?.stakeAmount ?? room?.stakes ?? 0;
  if (roomStatus === 'Waiting' || roomStatus === 'WaitingForPlayer') {
    return (
      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-md mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-dark-800 rounded-xl p-6 border border-neon-yellow/30"
          >
            <h2 className="text-2xl font-bold text-white mb-4 text-center">
              ⏳ Waiting for Opponent
            </h2>
            
            <div className="text-center mb-6">
              <div className="inline-block w-12 h-12 border-4 border-neon-yellow border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-gray-400">Share your Chain ID to invite someone:</p>
            </div>
            
            {/* Chain ID to share */}
            <div className="bg-dark-700 rounded-lg p-3 mb-4">
              <label className="text-xs text-gray-500 block mb-1">Your Chain ID</label>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-neon-cyan font-mono text-sm break-all">
                  {chainId}
                </code>
                <button
                  onClick={() => navigator.clipboard.writeText(chainId ?? '')}
                  className="px-2 py-1 text-xs bg-dark-600 text-gray-300 rounded hover:bg-dark-500"
                >
                  Copy
                </button>
              </div>
            </div>
            
            {/* Stakes info */}
            {roomStakes > 0 && (
              <div className="bg-dark-700 rounded-lg p-3 mb-4 flex justify-between">
                <span className="text-gray-400">Stake</span>
                <span className="text-neon-yellow font-bold">🪙 {roomStakes}</span>
              </div>
            )}
            
            {/* Leave button */}
            <button
              onClick={handleLeave}
              className="w-full py-3 border border-gray-600 text-gray-400 rounded-lg hover:bg-dark-700 transition-colors"
            >
              Cancel & Leave
            </button>
          </motion.div>
        </div>
      </div>
    );
  }
  
  // Main lobby menu
  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate('/')}
            className="text-gray-400 hover:text-white"
          >
            ← Home
          </button>
          
          <h1 className="text-2xl font-bold text-white">Lobby</h1>
          
          <button
            onClick={() => navigate('/profile')}
            className="flex items-center gap-2 text-gray-400 hover:text-white"
          >
            <span className="text-neon-yellow">🪙 {profile?.coinBalance ?? profile?.coins ?? 0}</span>
            <span>Profile →</span>
          </button>
        </div>
        
        {/* Mode selection or forms */}
        {mode === 'menu' ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            {/* Create Match */}
            <motion.button
              onClick={() => setMode('create')}
              className="w-full p-6 bg-dark-800 rounded-xl border border-neon-cyan/30 text-left hover:border-neon-cyan/60 transition-colors group"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
                    ⚔️ Create Match
                  </h3>
                  <p className="text-gray-400">
                    Create a room and wait for an opponent to join
                  </p>
                </div>
                <span className="text-2xl text-neon-cyan group-hover:translate-x-1 transition-transform">
                  →
                </span>
              </div>
            </motion.button>
            
            {/* Join Match */}
            <motion.button
              onClick={() => setMode('join')}
              className="w-full p-6 bg-dark-800 rounded-xl border border-neon-purple/30 text-left hover:border-neon-purple/60 transition-colors group"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
                    🎯 Join Match
                  </h3>
                  <p className="text-gray-400">
                    Join an existing room with a host's Chain ID
                  </p>
                </div>
                <span className="text-2xl text-neon-purple group-hover:translate-x-1 transition-transform">
                  →
                </span>
              </div>
            </motion.button>
            
            {/* Practice Mode */}
            <motion.button
              onClick={() => navigate('/pve')}
              className="w-full p-6 bg-dark-800 rounded-xl border border-neon-green/30 text-left hover:border-neon-green/60 transition-colors group"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
                    🎮 Practice Mode
                  </h3>
                  <p className="text-gray-400">
                    Daily puzzle and training against AI
                  </p>
                </div>
                <span className="text-2xl text-neon-green group-hover:translate-x-1 transition-transform">
                  →
                </span>
              </div>
            </motion.button>
            
            {/* Wager warning */}
            {!isLinked && (
              <div className="p-4 bg-dark-700 rounded-lg border border-neon-yellow/20 text-center">
                <p className="text-sm text-gray-400 mb-2">
                  🔐 Link your wallet to enable wagering
                </p>
                {isAuthenticated ? (
                  <button
                    onClick={() => navigate('/profile')}
                    className="text-neon-yellow hover:underline text-sm"
                  >
                    Go to Profile
                  </button>
                ) : (
                  <button
                    onClick={openLogin}
                    className="text-neon-purple hover:underline text-sm"
                  >
                    Connect Wallet
                  </button>
                )}
              </div>
            )}
          </motion.div>
        ) : mode === 'create' ? (
          // Create Room Form
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-dark-800 rounded-xl p-6 border border-neon-cyan/30"
          >
            <button
              onClick={() => setMode('menu')}
              className="text-gray-400 hover:text-white mb-4"
            >
              ← Back
            </button>
            
            <h2 className="text-xl font-bold text-white mb-6">Create Match</h2>
            
            {/* Map Selection */}
            <div className="mb-6">
              <label className="text-sm text-gray-400 mb-2 block">Map</label>
              <div className="grid grid-cols-3 gap-2">
                {[0, 1, 2].map((mapId) => (
                  <button
                    key={mapId}
                    onClick={() => setSelectedMap(mapId)}
                    className={`
                      py-3 rounded-lg transition-colors
                      ${selectedMap === mapId 
                        ? 'bg-neon-cyan text-dark-900 font-bold' 
                        : 'bg-dark-700 text-gray-400 hover:bg-dark-600'
                      }
                    `}
                  >
                    Map {mapId + 1}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Stake Amount */}
            <div className="mb-6">
              <label className="text-sm text-gray-400 mb-2 block">
                Stake (optional)
                {!canWager && (
                  <span className="text-neon-yellow ml-2">
                    - {wagerBlockReason}
                  </span>
                )}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={stake}
                  onChange={(e) => setStake(Math.max(0, parseInt(e.target.value) || 0))}
                  min={0}
                  max={profile?.coinBalance ?? profile?.coins ?? 0}
                  disabled={!canWager}
                  className="flex-1 bg-dark-700 border border-dark-600 rounded-lg px-4 py-3 text-white focus:border-neon-cyan outline-none disabled:opacity-50"
                  placeholder="0"
                />
                <span className="text-neon-yellow">🪙</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Balance: {profile?.coinBalance ?? profile?.coins ?? 0} coins
              </p>
            </div>
            
            {/* Error */}
            {error && (
              <div className="mb-4 p-3 bg-neon-red/20 border border-neon-red/50 rounded-lg text-neon-red text-sm">
                {error}
              </div>
            )}
            
            {/* Create Button */}
            <button
              onClick={handleCreate}
              disabled={isLoadingRoom}
              className="w-full py-4 bg-gradient-to-r from-neon-cyan to-neon-green text-dark-900 rounded-lg font-bold hover:shadow-neon-cyan transition-shadow disabled:opacity-50"
            >
              {isLoadingRoom ? 'Creating...' : 'Create Room'}
            </button>
          </motion.div>
        ) : (
          // Join Room Form
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-dark-800 rounded-xl p-6 border border-neon-purple/30"
          >
            <button
              onClick={() => setMode('menu')}
              className="text-gray-400 hover:text-white mb-4"
            >
              ← Back
            </button>
            
            <h2 className="text-xl font-bold text-white mb-6">Join Match</h2>
            
            {/* Host Chain ID */}
            <div className="mb-6">
              <label className="text-sm text-gray-400 mb-2 block">
                Host Chain ID
              </label>
              <input
                type="text"
                value={joinChainId}
                onChange={(e) => setJoinChainId(e.target.value)}
                className="w-full bg-dark-700 border border-dark-600 rounded-lg px-4 py-3 text-white font-mono text-sm focus:border-neon-purple outline-none"
                placeholder="e.g., 123abc..."
              />
              <p className="text-xs text-gray-500 mt-1">
                Get this from the match creator
              </p>
            </div>
            
            {/* Error */}
            {error && (
              <div className="mb-4 p-3 bg-neon-red/20 border border-neon-red/50 rounded-lg text-neon-red text-sm">
                {error}
              </div>
            )}
            
            {/* Join Button */}
            <button
              onClick={handleJoin}
              disabled={isLoadingRoom || !joinChainId.trim()}
              className="w-full py-4 bg-gradient-to-r from-neon-purple to-neon-pink text-white rounded-lg font-bold hover:shadow-neon-purple transition-shadow disabled:opacity-50"
            >
              {isLoadingRoom ? 'Joining...' : 'Join Room'}
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default LobbyPage;
