// Profile Page - Player stats, daily claim, and settings

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useLineraStore } from '../stores/lineraStore';
import { useGameStore } from '../stores/gameStore';
import { useDynamicWallet, useWalletDisplay } from '../hooks/useDynamic';

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { profile, isConnected, refreshProfile } = useLineraStore();
  const { claimDailyCoins } = useGameStore();
  const { isLinked, isAuthenticated, openLogin, fullLogout, linkIdentity, isLinking, linkError } = useDynamicWallet();
  const { evmDisplay, signerDisplay, chainDisplay } = useWalletDisplay();
  
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [claimSuccess, setClaimSuccess] = useState(false);
  
  // Refresh profile on mount
  useEffect(() => {
    if (isConnected) {
      refreshProfile();
    }
  }, [isConnected, refreshProfile]);
  
  // Check if can claim today
  const canClaim = (): boolean => {
    const lastClaim = profile?.lastDailyClaim ?? profile?.lastClaimDay;
    if (!lastClaim) return true;
    const lastClaimDate = typeof lastClaim === 'string' ? new Date(lastClaim) : new Date(lastClaim);
    const now = new Date();
    return lastClaimDate.toDateString() !== now.toDateString();
  };
  
  const handleClaim = async () => {
    setIsClaiming(true);
    setClaimError(null);
    setClaimSuccess(false);
    
    try {
      await claimDailyCoins();
      await refreshProfile();
      setClaimSuccess(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setClaimError(message);
    } finally {
      setIsClaiming(false);
    }
  };
  
  // Stats display
  const wins = profile?.wins ?? profile?.totalWins ?? 0;
  const losses = profile?.losses ?? profile?.totalLosses ?? 0;
  const draws = profile?.draws ?? profile?.totalDraws ?? 0;
  const stats = [
    { label: 'Wins', value: wins, color: 'text-neon-green' },
    { label: 'Losses', value: losses, color: 'text-neon-red' },
    { label: 'Draws', value: draws, color: 'text-gray-400' },
    { label: 'Win Rate', value: profile ? `${Math.round((wins / Math.max(wins + losses, 1)) * 100)}%` : '0%', color: 'text-neon-cyan' },
  ];
  
  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 mb-4">Please connect to view your profile</p>
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
  
  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/lobby')}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ← Back to Lobby
          </button>
          <h1 className="text-2xl font-bold text-white">Profile</h1>
          <div className="w-20" /> {/* Spacer */}
        </div>
        
        {/* Wallet Status Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-dark-800 rounded-xl p-6 border border-neon-purple/30"
        >
          <h2 className="text-lg font-bold text-white mb-4">Wallet</h2>
          
          <div className="space-y-3">
            {/* Chain ID */}
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Chain ID</span>
              <span className="font-mono text-neon-cyan">{chainDisplay ?? '...'}</span>
            </div>
            
            {/* Auto-Signer */}
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Game Signer</span>
              <span className="font-mono text-gray-300">{signerDisplay ?? '...'}</span>
            </div>
            
            {/* EVM Address */}
            <div className="flex justify-between items-center">
              <span className="text-gray-400">EVM Wallet</span>
              {isAuthenticated ? (
                <span className={`font-mono ${isLinked ? 'text-neon-green' : 'text-neon-yellow'}`}>
                  {evmDisplay} {isLinked ? '✓' : '(not linked)'}
                </span>
              ) : (
                <button
                  onClick={openLogin}
                  className="text-neon-purple hover:underline text-sm"
                >
                  Connect Wallet
                </button>
              )}
            </div>
          </div>
          
          {/* Link/Unlink button */}
          {isAuthenticated && !isLinked && (
            <button
              onClick={linkIdentity}
              disabled={isLinking}
              className="mt-4 w-full py-2 bg-neon-yellow/20 border border-neon-yellow text-neon-yellow rounded-lg hover:bg-neon-yellow/30 transition-colors disabled:opacity-50"
            >
              {isLinking ? 'Signing...' : '🔐 Link Wallet for Wagers'}
            </button>
          )}
          
          {linkError && (
            <p className="mt-2 text-sm text-neon-red">{linkError}</p>
          )}
          
          {/* Logout */}
          {isAuthenticated && (
            <button
              onClick={fullLogout}
              className="mt-3 w-full py-2 text-gray-500 hover:text-gray-300 text-sm"
            >
              Disconnect Wallet
            </button>
          )}
        </motion.div>
        
        {/* Coin Balance & Daily Claim */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-dark-800 rounded-xl p-6 border border-neon-yellow/30"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-white">Coins</h2>
              <p className="text-sm text-gray-500">Use coins to wager in matches</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-neon-yellow">
                🪙 {profile?.coinBalance ?? profile?.coins ?? 0}
              </div>
            </div>
          </div>
          
          {/* Daily Claim */}
          <div className="bg-dark-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-medium text-white">Daily Reward</h3>
                <p className="text-sm text-gray-500">Claim 50 coins every day</p>
              </div>
              <span className="text-2xl">🎁</span>
            </div>
            
            {canClaim() ? (
              <button
                onClick={handleClaim}
                disabled={isClaiming}
                className={`
                  w-full py-3 rounded-lg font-bold
                  bg-gradient-to-r from-neon-yellow to-neon-orange
                  text-dark-900 hover:shadow-neon-yellow transition-shadow
                  disabled:opacity-50
                `}
              >
                {isClaiming ? 'Claiming...' : '🎉 Claim 50 Coins'}
              </button>
            ) : (
              <div className="w-full py-3 rounded-lg bg-dark-600 text-center text-gray-400">
                ✓ Already claimed today
              </div>
            )}
            
            {claimSuccess && (
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-2 text-sm text-neon-green text-center"
              >
                +50 coins added!
              </motion.p>
            )}
            
            {claimError && (
              <p className="mt-2 text-sm text-neon-red text-center">{claimError}</p>
            )}
          </div>
        </motion.div>
        
        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-dark-800 rounded-xl p-6 border border-neon-cyan/30"
        >
          <h2 className="text-lg font-bold text-white mb-4">Statistics</h2>
          
          <div className="grid grid-cols-4 gap-4">
            {stats.map((stat, i) => (
              <div key={i} className="text-center">
                <div className={`text-2xl font-bold ${stat.color}`}>
                  {stat.value}
                </div>
                <div className="text-sm text-gray-500">{stat.label}</div>
              </div>
            ))}
          </div>
          
          {/* Puzzle stats */}
          <div className="mt-6 pt-4 border-t border-dark-600">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Puzzles Solved</span>
              <span className="text-neon-purple font-bold">{profile?.puzzlesSolved ?? profile?.puzzleWins ?? 0}</span>
            </div>
          </div>
        </motion.div>
        
        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-2 gap-4"
        >
          <button
            onClick={() => navigate('/pve')}
            className="p-4 bg-dark-800 border border-neon-purple/30 rounded-xl hover:border-neon-purple transition-colors text-left"
          >
            <span className="text-2xl mb-2 block">🧩</span>
            <span className="font-medium text-white">Daily Puzzle</span>
            <span className="text-sm text-gray-500 block">Train your skills</span>
          </button>
          
          <button
            onClick={() => navigate('/lobby')}
            className="p-4 bg-dark-800 border border-neon-cyan/30 rounded-xl hover:border-neon-cyan transition-colors text-left"
          >
            <span className="text-2xl mb-2 block">⚔️</span>
            <span className="font-medium text-white">PvP Match</span>
            <span className="text-sm text-gray-500 block">Battle other players</span>
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default ProfilePage;
