// Profile Page - Player stats, daily claim, and settings

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useLineraStore } from '../stores/lineraStore';
import { useGameStore } from '../stores/gameStore';
import { useDynamicWallet, useWalletDisplay } from '../hooks/useDynamic';
import {
  ArrowLeft,
  Coins,
  Trophy,
  Gift,
  Wallet,
  Link2,
  CheckCircle,
  Shield,
  Globe,
  Cpu,
  Loader2,
  LogOut,
  Sparkles,
  Award,
  Percent,
  Skull,
  Equal
} from 'lucide-react';

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { profile, isConnected, refreshProfile } = useLineraStore();
  const { claimDailyCoins } = useGameStore();
  const { isLinked, isAuthenticated, openLogin, fullLogout, linkIdentity, isLinking, linkError } = useDynamicWallet();
  const { evmDisplay, signerDisplay, chainDisplay } = useWalletDisplay();
  
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [claimSuccess, setClaimSuccess] = useState(false);
  
  useEffect(() => {
    if (isConnected) {
      refreshProfile();
    }
  }, [isConnected, refreshProfile]);
  
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
      setClaimError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsClaiming(false);
    }
  };
  
  const wins = profile?.wins ?? profile?.totalWins ?? 0;
  const losses = profile?.losses ?? profile?.totalLosses ?? 0;
  const draws = profile?.draws ?? profile?.totalDraws ?? 0;
  const winRate = wins + losses > 0 ? Math.round((wins / (wins + losses)) * 100) : 0;
  
  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-900">
        <motion.div 
          className="text-center p-8 bg-dark-800/60 backdrop-blur-sm border border-gray-700/50 rounded-2xl"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Shield className="w-12 h-12 text-neon-cyan mx-auto mb-4" />
          <p className="text-gray-400 mb-4">Connect to view your profile</p>
          <motion.button 
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-gradient-to-r from-neon-cyan to-neon-purple text-white rounded-xl font-bold"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Go Home
          </motion.button>
        </motion.div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen p-4 md:p-8 bg-dark-900">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <motion.div 
          className="flex items-center justify-between"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <motion.button
            onClick={() => navigate('/lobby')}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            whileHover={{ x: -4 }}
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Lobby
          </motion.button>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Trophy className="w-6 h-6 text-neon-yellow" />
            Profile
          </h1>
          <div className="w-24" />
        </motion.div>
        
        {/* Coins & Daily Claim Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-neon-yellow/10 to-neon-yellow/5 backdrop-blur-sm rounded-2xl p-6 border border-neon-yellow/30"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-gray-400 text-sm mb-1">Your Balance</p>
              <div className="flex items-center gap-3">
                <Coins className="w-8 h-8 text-neon-yellow" />
                <span className="text-4xl font-black text-white">{profile?.coinBalance ?? profile?.coins ?? 0}</span>
              </div>
            </div>
            
            <motion.button
              onClick={handleClaim}
              disabled={isClaiming || !canClaim() || claimSuccess}
              className={`
                px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all
                ${canClaim() && !claimSuccess
                  ? 'bg-gradient-to-r from-neon-yellow to-neon-green text-dark-900 hover:shadow-lg hover:shadow-neon-yellow/30'
                  : 'bg-dark-700/50 text-gray-500 cursor-not-allowed'
                }
              `}
              whileHover={canClaim() && !claimSuccess ? { scale: 1.05 } : {}}
              whileTap={canClaim() && !claimSuccess ? { scale: 0.95 } : {}}
            >
              {isClaiming ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Claiming...
                </>
              ) : claimSuccess ? (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Claimed!
                </>
              ) : canClaim() ? (
                <>
                  <Gift className="w-5 h-5" />
                  Claim Daily
                </>
              ) : (
                <>
                  <Gift className="w-5 h-5" />
                  Already Claimed
                </>
              )}
            </motion.button>
          </div>
          
          {claimError && (
            <motion.p 
              className="text-neon-red text-sm flex items-center gap-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <Shield className="w-4 h-4" />
              {claimError}
            </motion.p>
          )}
          
          {claimSuccess && (
            <motion.div 
              className="flex items-center gap-2 text-neon-green"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Sparkles className="w-5 h-5" />
              <span>+100 coins added to your balance!</span>
            </motion.div>
          )}
        </motion.div>
        
        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {[
            { label: 'Wins', value: wins, icon: Trophy, color: 'neon-green', bg: 'from-neon-green/20 to-neon-green/5' },
            { label: 'Losses', value: losses, icon: Skull, color: 'neon-red', bg: 'from-neon-red/20 to-neon-red/5' },
            { label: 'Draws', value: draws, icon: Equal, color: 'gray-400', bg: 'from-gray-600/20 to-gray-600/5' },
            { label: 'Win Rate', value: `${winRate}%`, icon: Percent, color: 'neon-cyan', bg: 'from-neon-cyan/20 to-neon-cyan/5' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              className={`bg-gradient-to-br ${stat.bg} backdrop-blur-sm rounded-xl p-4 border border-gray-700/30`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.05 }}
              whileHover={{ y: -2 }}
            >
              <stat.icon className={`w-6 h-6 text-${stat.color} mb-2`} />
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-gray-400 text-sm">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>
        
        {/* Wallet Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-dark-800/60 backdrop-blur-sm rounded-2xl p-6 border border-neon-purple/30"
        >
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Wallet className="w-5 h-5 text-neon-purple" />
            Wallet Connection
          </h2>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-dark-700/50 rounded-xl">
              <span className="text-gray-400 flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Chain ID
              </span>
              <span className="font-mono text-neon-cyan text-sm">{chainDisplay ?? '...'}</span>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-dark-700/50 rounded-xl">
              <span className="text-gray-400 flex items-center gap-2">
                <Cpu className="w-4 h-4" />
                Game Signer
              </span>
              <span className="font-mono text-gray-300 text-sm">{signerDisplay ?? '...'}</span>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-dark-700/50 rounded-xl">
              <span className="text-gray-400 flex items-center gap-2">
                <Wallet className="w-4 h-4" />
                EVM Wallet
              </span>
              {isAuthenticated ? (
                <span className={`font-mono text-sm flex items-center gap-2 ${isLinked ? 'text-neon-green' : 'text-neon-yellow'}`}>
                  {evmDisplay}
                  {isLinked && <CheckCircle className="w-4 h-4" />}
                </span>
              ) : (
                <motion.button
                  onClick={openLogin}
                  className="text-neon-purple hover:underline text-sm font-medium flex items-center gap-1"
                  whileHover={{ scale: 1.02 }}
                >
                  <Link2 className="w-4 h-4" />
                  Connect
                </motion.button>
              )}
            </div>
          </div>
          
          {isAuthenticated && !isLinked && (
            <motion.button
              onClick={linkIdentity}
              disabled={isLinking}
              className="mt-4 w-full py-3 bg-neon-yellow/20 border border-neon-yellow text-neon-yellow rounded-xl hover:bg-neon-yellow/30 transition-colors disabled:opacity-50 font-medium flex items-center justify-center gap-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isLinking ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Signing...
                </>
              ) : (
                <>
                  <Link2 className="w-5 h-5" />
                  Link Wallet for Wagers
                </>
              )}
            </motion.button>
          )}
          
          {linkError && (
            <p className="mt-2 text-sm text-neon-red flex items-center gap-1">
              <Shield className="w-4 h-4" />
              {linkError}
            </p>
          )}
          
          {isAuthenticated && (
            <motion.button
              onClick={fullLogout}
              className="mt-4 w-full py-3 border border-gray-600 text-gray-400 rounded-xl hover:bg-dark-700 hover:text-neon-red transition-all font-medium flex items-center justify-center gap-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <LogOut className="w-5 h-5" />
              Disconnect Wallet
            </motion.button>
          )}
        </motion.div>
        
        {/* Achievement Card Placeholder */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-dark-800/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/30"
        >
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-neon-pink" />
            Achievements
          </h2>
          
          <div className="grid grid-cols-4 gap-3">
            {[
              { name: 'First Win', unlocked: wins > 0 },
              { name: '10 Wins', unlocked: wins >= 10 },
              { name: 'Daily Streak', unlocked: false },
              { name: 'Wager Master', unlocked: false },
            ].map((achievement, i) => (
              <motion.div
                key={i}
                className={`p-3 rounded-xl text-center ${
                  achievement.unlocked 
                    ? 'bg-neon-pink/20 border border-neon-pink/30' 
                    : 'bg-dark-700/30 border border-gray-700/30 opacity-50'
                }`}
                whileHover={{ scale: achievement.unlocked ? 1.05 : 1 }}
              >
                <Award className={`w-6 h-6 mx-auto mb-1 ${achievement.unlocked ? 'text-neon-pink' : 'text-gray-600'}`} />
                <span className="text-xs text-gray-400">{achievement.name}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ProfilePage;
