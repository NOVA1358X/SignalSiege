// Lobby Page - Create or join PvP matches

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useLineraStore } from '../stores/lineraStore';
import { useGameStore } from '../stores/gameStore';
import { useCanWager } from '../hooks/useDynamic';
import { 
  ArrowLeft, 
  Plus, 
  Users, 
  Coins, 
  Copy, 
  Check, 
  Loader2, 
  Swords, 
  Bot,
  ChevronRight,
  Shield,
  Clock,
  X,
  Sparkles,
  Target
} from 'lucide-react';

const LobbyPage: React.FC = () => {
  const navigate = useNavigate();
  const { isConnected, chainId, profile, refreshProfile } = useLineraStore();
  const { room, isLoadingRoom, fetchRoom, refreshRoomSilent, createNewRoom, joinExistingRoom, exitRoom } = useGameStore();
  const { canWager, reason: wagerBlockReason } = useCanWager();
  
  const [mode, setMode] = useState<'menu' | 'create' | 'join'>('menu');
  const [selectedMap, setSelectedMap] = useState(0);
  const [stake, setStake] = useState(0);
  const [joinChainId, setJoinChainId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  
  useEffect(() => {
    if (isConnected) {
      refreshProfile();
      fetchRoom();
    }
  }, [isConnected, refreshProfile, fetchRoom]);
  
  useEffect(() => {
    const roomStatus = room?.status;
    if (roomStatus === 'Waiting' || roomStatus === 'WaitingForPlayer') {
      const pollInterval = setInterval(() => refreshRoomSilent(), 3000);
      return () => clearInterval(pollInterval);
    }
  }, [room?.status, refreshRoomSilent]);
  
  useEffect(() => {
    const roomStatus = room?.status;
    if (roomStatus === 'Playing' || roomStatus === 'InProgress') {
      navigate('/match');
    }
  }, [room, navigate]);

  const handleCopy = () => {
    navigator.clipboard.writeText(chainId ?? '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-900">
        <motion.div 
          className="text-center p-8 bg-dark-800/60 backdrop-blur-sm border border-gray-700/50 rounded-2xl"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Shield className="w-12 h-12 text-neon-cyan mx-auto mb-4" />
          <p className="text-gray-400 mb-4">Connect to access the lobby</p>
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
  
  const handleCreate = async () => {
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
      setError(err instanceof Error ? err.message : String(err));
    }
  };
  
  const handleJoin = async () => {
    if (!joinChainId.trim()) {
      setError('Enter host chain ID');
      return;
    }
    setError(null);
    try {
      await joinExistingRoom(joinChainId.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };
  
  const handleLeave = async () => {
    await exitRoom();
    setMode('menu');
  };
  
  const roomStatus = room?.status;
  const roomStakes = room?.stakeAmount ?? room?.stakes ?? 0;
  
  // Waiting room view
  if (roomStatus === 'Waiting' || roomStatus === 'WaitingForPlayer') {
    return (
      <div className="min-h-screen p-4 md:p-8 bg-dark-900">
        <div className="max-w-lg mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-dark-800/60 backdrop-blur-sm rounded-2xl p-6 border border-neon-yellow/30"
          >
            {/* Header */}
            <div className="text-center mb-6">
              <motion.div 
                className="w-16 h-16 mx-auto mb-4 rounded-full bg-neon-yellow/20 border border-neon-yellow/50 flex items-center justify-center"
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <Clock className="w-8 h-8 text-neon-yellow" />
              </motion.div>
              <h2 className="text-2xl font-bold text-white mb-2">Waiting for Opponent</h2>
              <p className="text-gray-400">Share your Chain ID to invite a friend</p>
            </div>
            
            {/* Chain ID Card */}
            <div className="bg-dark-700/50 rounded-xl p-4 mb-4">
              <label className="text-xs text-gray-500 uppercase tracking-wider mb-2 block">Your Chain ID</label>
              <div className="flex items-center gap-3">
                <code className="flex-1 text-neon-cyan font-mono text-sm break-all bg-dark-900/50 p-3 rounded-lg">
                  {chainId}
                </code>
                <motion.button
                  onClick={handleCopy}
                  className="p-3 bg-dark-600 hover:bg-dark-500 rounded-lg transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {copied ? <Check className="w-5 h-5 text-neon-green" /> : <Copy className="w-5 h-5 text-gray-300" />}
                </motion.button>
              </div>
            </div>
            
            {/* Stakes info */}
            {roomStakes > 0 && (
              <div className="bg-dark-700/50 rounded-xl p-4 mb-4 flex items-center justify-between">
                <span className="text-gray-400 flex items-center gap-2">
                  <Coins className="w-5 h-5" />
                  Stake Amount
                </span>
                <span className="text-neon-yellow font-bold text-lg">{roomStakes}</span>
              </div>
            )}
            
            {/* Animated waiting indicator */}
            <div className="flex justify-center gap-2 mb-6">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-3 h-3 rounded-full bg-neon-yellow"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                />
              ))}
            </div>
            
            <motion.button
              onClick={handleLeave}
              className="w-full py-3 border border-gray-600 text-gray-400 rounded-xl hover:bg-dark-700 hover:text-white transition-all flex items-center justify-center gap-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <X className="w-5 h-5" />
              Cancel & Leave
            </motion.button>
          </motion.div>
        </div>
      </div>
    );
  }
  
  // Main lobby
  return (
    <div className="min-h-screen p-4 md:p-8 bg-dark-900">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.div 
          className="flex items-center justify-between mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <motion.button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            whileHover={{ x: -4 }}
          >
            <ArrowLeft className="w-5 h-5" />
            Home
          </motion.button>
          
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Swords className="w-6 h-6 text-neon-cyan" />
            Lobby
          </h1>
          
          <motion.button
            onClick={() => navigate('/profile')}
            className="flex items-center gap-2 px-4 py-2 bg-dark-800/60 rounded-xl border border-gray-700/50 hover:border-neon-yellow/50 transition-colors"
            whileHover={{ scale: 1.02 }}
          >
            <Coins className="w-5 h-5 text-neon-yellow" />
            <span className="text-neon-yellow font-bold">{profile?.coinBalance ?? profile?.coins ?? 0}</span>
          </motion.button>
        </motion.div>
        
        {/* Mode selection or forms */}
        <AnimatePresence mode="wait">
          {mode === 'menu' ? (
            <motion.div
              key="menu"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {/* Create Room Card */}
              <motion.div
                onClick={() => setMode('create')}
                className="group p-6 bg-dark-800/60 backdrop-blur-sm border border-gray-700/50 rounded-2xl cursor-pointer hover:border-neon-cyan/50 transition-all"
                whileHover={{ scale: 1.01, y: -2 }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-neon-cyan/20 to-neon-purple/20 border border-neon-cyan/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Plus className="w-7 h-7 text-neon-cyan" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-1">Create Room</h3>
                    <p className="text-gray-400 text-sm">Host a new PvP match and invite a friend</p>
                  </div>
                  <ChevronRight className="w-6 h-6 text-gray-500 group-hover:text-neon-cyan group-hover:translate-x-1 transition-all" />
                </div>
              </motion.div>
              
              {/* Join Room Card */}
              <motion.div
                onClick={() => setMode('join')}
                className="group p-6 bg-dark-800/60 backdrop-blur-sm border border-gray-700/50 rounded-2xl cursor-pointer hover:border-neon-purple/50 transition-all"
                whileHover={{ scale: 1.01, y: -2 }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-neon-purple/20 to-neon-pink/20 border border-neon-purple/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Users className="w-7 h-7 text-neon-purple" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-1">Join Room</h3>
                    <p className="text-gray-400 text-sm">Enter a Chain ID to join an existing match</p>
                  </div>
                  <ChevronRight className="w-6 h-6 text-gray-500 group-hover:text-neon-purple group-hover:translate-x-1 transition-all" />
                </div>
              </motion.div>
              
              {/* Divider */}
              <div className="flex items-center gap-4 py-4">
                <div className="flex-1 h-px bg-gray-700/50" />
                <span className="text-gray-500 text-sm">or play solo</span>
                <div className="flex-1 h-px bg-gray-700/50" />
              </div>
              
              {/* Training Mode Card */}
              <motion.div
                onClick={() => navigate('/training')}
                className="group p-6 bg-dark-800/60 backdrop-blur-sm border border-gray-700/50 rounded-2xl cursor-pointer hover:border-neon-green/50 transition-all"
                whileHover={{ scale: 1.01, y: -2 }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-neon-green/20 to-neon-cyan/20 border border-neon-green/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Bot className="w-7 h-7 text-neon-green" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-1">Training Mode</h3>
                    <p className="text-gray-400 text-sm">Practice against AI to improve your skills</p>
                  </div>
                  <ChevronRight className="w-6 h-6 text-gray-500 group-hover:text-neon-green group-hover:translate-x-1 transition-all" />
                </div>
              </motion.div>
            </motion.div>
          ) : mode === 'create' ? (
            <motion.div
              key="create"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-dark-800/60 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <motion.button
                  onClick={() => setMode('menu')}
                  className="p-2 hover:bg-dark-700 rounded-lg transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <ArrowLeft className="w-5 h-5 text-gray-400" />
                </motion.button>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Plus className="w-5 h-5 text-neon-cyan" />
                  Create Room
                </h2>
              </div>
              
              {/* Map Selection */}
              <div className="mb-6">
                <label className="text-sm text-gray-400 mb-3 block">Select Map</label>
                <div className="grid grid-cols-3 gap-3">
                  {[0, 1, 2].map((mapId) => (
                    <motion.button
                      key={mapId}
                      onClick={() => setSelectedMap(mapId)}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        selectedMap === mapId 
                          ? 'border-neon-cyan bg-neon-cyan/10' 
                          : 'border-gray-700/50 hover:border-gray-600'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Target className={`w-8 h-8 mx-auto mb-2 ${selectedMap === mapId ? 'text-neon-cyan' : 'text-gray-500'}`} />
                      <span className={`text-sm font-medium ${selectedMap === mapId ? 'text-white' : 'text-gray-400'}`}>
                        Map {mapId + 1}
                      </span>
                    </motion.button>
                  ))}
                </div>
              </div>
              
              {/* Stake Amount */}
              <div className="mb-6">
                <label className="text-sm text-gray-400 mb-3 block flex items-center gap-2">
                  <Coins className="w-4 h-4" />
                  Stake Amount (Optional)
                </label>
                <div className="flex gap-2">
                  {[0, 10, 25, 50, 100].map((amount) => (
                    <motion.button
                      key={amount}
                      onClick={() => setStake(amount)}
                      className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                        stake === amount 
                          ? 'bg-neon-yellow/20 border-2 border-neon-yellow text-neon-yellow' 
                          : 'bg-dark-700/50 border-2 border-gray-700/50 text-gray-400 hover:border-gray-600'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {amount === 0 ? 'Free' : amount}
                    </motion.button>
                  ))}
                </div>
                {stake > 0 && !canWager && (
                  <p className="mt-2 text-sm text-neon-red flex items-center gap-1">
                    <Shield className="w-4 h-4" />
                    {wagerBlockReason}
                  </p>
                )}
              </div>
              
              {error && (
                <motion.div 
                  className="mb-4 p-3 bg-neon-red/10 border border-neon-red/30 rounded-xl text-neon-red text-sm flex items-center gap-2"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Shield className="w-4 h-4" />
                  {error}
                </motion.div>
              )}
              
              <motion.button
                onClick={handleCreate}
                disabled={isLoadingRoom}
                className="w-full py-4 bg-gradient-to-r from-neon-cyan to-neon-purple text-white font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isLoadingRoom ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Create Room
                  </>
                )}
              </motion.button>
            </motion.div>
          ) : (
            <motion.div
              key="join"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-dark-800/60 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <motion.button
                  onClick={() => setMode('menu')}
                  className="p-2 hover:bg-dark-700 rounded-lg transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <ArrowLeft className="w-5 h-5 text-gray-400" />
                </motion.button>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-neon-purple" />
                  Join Room
                </h2>
              </div>
              
              <div className="mb-6">
                <label className="text-sm text-gray-400 mb-3 block">Host Chain ID</label>
                <input
                  type="text"
                  value={joinChainId}
                  onChange={(e) => setJoinChainId(e.target.value)}
                  placeholder="Paste the host's Chain ID here"
                  className="w-full px-4 py-3 bg-dark-700/50 border border-gray-700/50 rounded-xl text-white placeholder-gray-500 focus:border-neon-purple focus:outline-none transition-colors font-mono text-sm"
                />
              </div>
              
              {error && (
                <motion.div 
                  className="mb-4 p-3 bg-neon-red/10 border border-neon-red/30 rounded-xl text-neon-red text-sm flex items-center gap-2"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Shield className="w-4 h-4" />
                  {error}
                </motion.div>
              )}
              
              <motion.button
                onClick={handleJoin}
                disabled={isLoadingRoom || !joinChainId.trim()}
                className="w-full py-4 bg-gradient-to-r from-neon-purple to-neon-pink text-white font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isLoadingRoom ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Joining...
                  </>
                ) : (
                  <>
                    <Swords className="w-5 h-5" />
                    Join Match
                  </>
                )}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default LobbyPage;
