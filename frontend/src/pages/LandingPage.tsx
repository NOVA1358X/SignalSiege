// Landing Page - Hero section with wallet connection

import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useLineraStore } from '../stores/lineraStore';
import { useDynamicWallet } from '../hooks/useDynamic';
import { 
  Zap, 
  Grid3X3, 
  Coins, 
  Puzzle, 
  Wallet, 
  Link2, 
  CheckCircle, 
  ArrowRight,
  Play,
  Shield,
  Globe,
  Cpu,
  ChevronRight,
  Unlink
} from 'lucide-react';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { isConnected, isConnecting, connect, disconnect, chainId, autoSignerAddress, error } = useLineraStore();
  const { isAuthenticated, isLinked, openLogin, isLinking, linkIdentity, fullLogout, dynamicEvmAddress, linkError, isAutoConnecting } = useDynamicWallet();
  
  // Combined connecting state - either Linera connecting or auto-connecting after Dynamic auth
  const isFullyConnecting = isConnecting || isAutoConnecting;
  
  const handlePlay = async () => {
    if (!isConnected) {
      await connect(dynamicEvmAddress || undefined);
    }
    navigate('/lobby');
  };
  
  const handleDisconnect = () => {
    disconnect();
    fullLogout();
  };
  
  const shortAddress = (addr: string | null) => {
    if (!addr) return '...';
    return `${addr.slice(0, 8)}...${addr.slice(-6)}`;
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const pulseVariants = {
    pulse: {
      scale: [1, 1.05, 1],
      opacity: [0.7, 1, 0.7],
      transition: { duration: 2, repeat: Infinity }
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-dark-900">
      {/* Animated background */}
      <div className="absolute inset-0">
        <motion.div 
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-neon-cyan/20 rounded-full blur-3xl"
          animate={{ x: [0, 50, 0], y: [0, 30, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-neon-purple/20 rounded-full blur-3xl"
          animate={{ x: [0, -50, 0], y: [0, -30, 0], scale: [1.1, 1, 1.1] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />
        
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `linear-gradient(rgba(0, 255, 255, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 255, 0.3) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />

        <svg className="absolute inset-0 w-full h-full opacity-20">
          <defs>
            <linearGradient id="lineGrad1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#00ffff" stopOpacity="0" />
              <stop offset="50%" stopColor="#00ffff" stopOpacity="1" />
              <stop offset="100%" stopColor="#00ffff" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="lineGrad2" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ff00ff" stopOpacity="0" />
              <stop offset="50%" stopColor="#ff00ff" stopOpacity="1" />
              <stop offset="100%" stopColor="#ff00ff" stopOpacity="0" />
            </linearGradient>
          </defs>
          
          {[15, 35, 55, 75, 90].map((y, i) => (
            <motion.line
              key={i}
              x1="0%"
              y1={`${y}%`}
              x2="100%"
              y2={`${y}%`}
              stroke={i % 2 === 0 ? "url(#lineGrad1)" : "url(#lineGrad2)"}
              strokeWidth="1"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: [0, 1], opacity: [0, 0.6, 0] }}
              transition={{ duration: 4, repeat: Infinity, delay: i * 0.6, ease: "linear" }}
            />
          ))}
        </svg>
      </div>
      
      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center z-10 px-4 py-12">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="text-center max-w-4xl"
        >
          {/* Logo/Title */}
          <motion.div variants={itemVariants} className="mb-6">
            <motion.div 
              className="inline-flex items-center gap-3 px-4 py-2 bg-dark-800/60 backdrop-blur-sm border border-neon-cyan/30 rounded-full mb-6"
              whileHover={{ scale: 1.02, borderColor: 'rgba(0, 255, 255, 0.6)' }}
            >
              <Zap className="w-4 h-4 text-neon-cyan" />
              <span className="text-sm text-gray-300">Powered by Linera Protocol</span>
              <ChevronRight className="w-4 h-4 text-gray-500" />
            </motion.div>
            
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black mb-4 tracking-tight">
              <span className="bg-gradient-to-r from-neon-cyan via-blue-400 to-neon-purple bg-clip-text text-transparent">
                Signal
              </span>
              <span className="text-white">Siege</span>
            </h1>
            
            <motion.p 
              className="text-lg md:text-xl text-gray-400 max-w-lg mx-auto"
              variants={itemVariants}
            >
              Strategic circuit warfare on the blockchain. Build paths, outsmart opponents, claim victory.
            </motion.p>
          </motion.div>
          
          {/* Feature cards */}
          <motion.div 
            className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10"
            variants={itemVariants}
          >
            {[
              { icon: Zap, text: 'On-Chain PvP', color: 'text-neon-cyan', border: 'hover:border-neon-cyan/50' },
              { icon: Grid3X3, text: '7×7 Grid', color: 'text-neon-purple', border: 'hover:border-neon-purple/50' },
              { icon: Coins, text: 'Stake & Win', color: 'text-neon-yellow', border: 'hover:border-neon-yellow/50' },
              { icon: Puzzle, text: 'Daily Puzzles', color: 'text-neon-pink', border: 'hover:border-neon-pink/50' },
            ].map((feature, i) => (
              <motion.div 
                key={i}
                className={`group relative p-4 bg-dark-800/40 backdrop-blur-sm border border-gray-700/50 rounded-xl ${feature.border} hover:bg-dark-800/60 transition-all duration-300 cursor-default`}
                whileHover={{ y: -4, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <feature.icon className={`w-6 h-6 ${feature.color} mx-auto mb-2 group-hover:scale-110 transition-transform`} />
                <span className="text-sm text-gray-300 font-medium">{feature.text}</span>
              </motion.div>
            ))}
          </motion.div>
          
          {/* CTA Buttons */}
          <motion.div className="flex flex-col sm:flex-row gap-4 justify-center mb-8" variants={itemVariants}>
            <motion.button
              onClick={handlePlay}
              disabled={isFullyConnecting}
              className="group relative px-8 py-4 text-lg font-bold rounded-2xl bg-gradient-to-r from-neon-cyan via-blue-500 to-neon-purple text-white shadow-lg shadow-neon-cyan/25 hover:shadow-xl hover:shadow-neon-cyan/40 transition-all duration-300 disabled:opacity-50 disabled:cursor-wait overflow-hidden"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
            >
              <motion.div 
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12"
                initial={{ x: '-100%' }}
                whileHover={{ x: '100%' }}
                transition={{ duration: 0.6 }}
              />
              
              <span className="relative flex items-center justify-center gap-2">
                {isFullyConnecting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Connecting...
                  </>
                ) : isConnected ? (
                  <>
                    <Play className="w-5 h-5" />
                    Enter Game
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5" />
                    Quick Play
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </span>
            </motion.button>
            
            {/* Wallet connection button - shows different states */}
            {!isAuthenticated ? (
              // Step 1: Not logged into Dynamic - show Connect Wallet
              <motion.button
                onClick={openLogin}
                className="group px-8 py-4 text-lg font-bold rounded-2xl bg-dark-800/60 backdrop-blur-sm border-2 border-neon-purple/50 text-neon-purple hover:border-neon-purple hover:bg-neon-purple/10 transition-all duration-300"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="flex items-center gap-2">
                  <Wallet className="w-5 h-5" />
                  Connect Wallet
                </span>
              </motion.button>
            ) : isAutoConnecting ? (
              // Step 2: Authenticated, auto-connecting to Linera
              <motion.button
                disabled
                className="group px-8 py-4 text-lg font-bold rounded-2xl bg-dark-800/60 backdrop-blur-sm border-2 border-neon-cyan/50 text-neon-cyan transition-all duration-300 opacity-70"
              >
                <span className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin" />
                  Connecting to Conway...
                </span>
              </motion.button>
            ) : !isConnected ? (
              // Step 2b: Authenticated but Linera connect failed/not started - show retry
              <motion.button
                onClick={() => connect(dynamicEvmAddress || undefined)}
                disabled={isConnecting}
                className="group px-8 py-4 text-lg font-bold rounded-2xl bg-dark-800/60 backdrop-blur-sm border-2 border-neon-yellow/50 text-neon-yellow hover:border-neon-yellow hover:bg-neon-yellow/10 transition-all duration-300 disabled:opacity-50"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  {isConnecting ? 'Connecting...' : 'Connect to Conway'}
                </span>
              </motion.button>
            ) : isLinking ? (
              // Step 3: Connected to Linera, linking identity
              <motion.button
                disabled
                className="group px-8 py-4 text-lg font-bold rounded-2xl bg-dark-800/60 backdrop-blur-sm border-2 border-neon-yellow/50 text-neon-yellow transition-all duration-300 opacity-70"
              >
                <span className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-neon-yellow border-t-transparent rounded-full animate-spin" />
                  Signing & Linking...
                </span>
              </motion.button>
            ) : !isLinked ? (
              // Step 3b: Connected but not linked - show Link button
              <motion.button
                onClick={linkIdentity}
                className="group px-8 py-4 text-lg font-bold rounded-2xl bg-dark-800/60 backdrop-blur-sm border-2 border-neon-yellow/50 text-neon-yellow hover:border-neon-yellow hover:bg-neon-yellow/10 transition-all duration-300"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="flex items-center gap-2">
                  <Link2 className="w-5 h-5" />
                  Link Identity
                </span>
              </motion.button>
            ) : (
              // Step 4: Fully connected and linked
              <motion.button
                onClick={() => navigate('/profile')}
                className="group px-8 py-4 text-lg font-bold rounded-2xl bg-dark-800/60 backdrop-blur-sm border-2 border-neon-green/50 text-neon-green hover:border-neon-green hover:bg-neon-green/10 transition-all duration-300"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Wallet Linked
                </span>
              </motion.button>
            )}
          </motion.div>
          
          {linkError && (
            <motion.div
              className="mb-6 px-4 py-3 bg-neon-red/10 border border-neon-red/30 rounded-xl inline-flex items-center gap-2"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Shield className="w-4 h-4 text-neon-red" />
              <span className="text-neon-red text-sm">{linkError}</span>
            </motion.div>
          )}
          
          {/* Connection Status Card */}
          {(isConnected || error) && (
            <motion.div
              className="max-w-md mx-auto p-5 bg-dark-800/60 backdrop-blur-sm border border-gray-700/50 rounded-2xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {error ? (
                <div className="flex items-center justify-center gap-3">
                  <Shield className="w-5 h-5 text-neon-red" />
                  <span className="text-neon-red">{error}</span>
                  <button onClick={() => connect()} className="ml-2 text-neon-cyan hover:underline text-sm font-medium">Retry</button>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <motion.div className="w-2.5 h-2.5 rounded-full bg-neon-green" variants={pulseVariants} animate="pulse" />
                      <span className="text-neon-green font-medium text-sm">Conway Testnet</span>
                    </div>
                    <button onClick={handleDisconnect} className="flex items-center gap-1 text-gray-400 hover:text-neon-red text-sm transition-colors">
                      <Unlink className="w-3.5 h-3.5" />
                      Disconnect
                    </button>
                  </div>
                  
                  <div className="space-y-2.5 text-sm">
                    <div className="flex justify-between items-center p-2 bg-dark-700/50 rounded-lg">
                      <span className="text-gray-400 flex items-center gap-2"><Globe className="w-4 h-4" />Chain</span>
                      <span className="font-mono text-neon-cyan">{shortAddress(chainId)}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-dark-700/50 rounded-lg">
                      <span className="text-gray-400 flex items-center gap-2"><Cpu className="w-4 h-4" />Signer</span>
                      <span className="font-mono text-gray-300">{shortAddress(autoSignerAddress)}</span>
                    </div>
                    {isAuthenticated && dynamicEvmAddress && (
                      <div className="flex justify-between items-center p-2 bg-dark-700/50 rounded-lg">
                        <span className="text-gray-400 flex items-center gap-2"><Wallet className="w-4 h-4" />EVM</span>
                        <span className="font-mono text-neon-purple">{shortAddress(dynamicEvmAddress)}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-4 pt-3 border-t border-gray-700/50 flex items-center justify-center gap-2 text-xs text-gray-500">
                    <Zap className="w-3.5 h-3.5" />
                    Auto-signer ready • Zero gas per move
                  </div>
                </>
              )}
            </motion.div>
          )}
        </motion.div>
        
        {/* How to play section */}
        <motion.div
          className="mt-16 max-w-2xl text-center"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <h3 className="text-gray-400 mb-6 text-sm uppercase tracking-wider font-medium">How It Works</h3>
          <div className="grid grid-cols-3 gap-6">
            {[
              { step: '01', title: 'Place Tiles', desc: 'Build signal paths', icon: Grid3X3 },
              { step: '02', title: 'Route Signals', desc: 'Connect your towers', icon: Zap },
              { step: '03', title: 'Dominate', desc: 'Block & win', icon: Shield },
            ].map((item, i) => (
              <motion.div key={i} className="group text-center" whileHover={{ y: -4 }}>
                <div className="relative w-14 h-14 mx-auto mb-3">
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-neon-cyan/20 to-neon-purple/20 group-hover:from-neon-cyan/30 group-hover:to-neon-purple/30 transition-colors" />
                  <div className="absolute inset-0 rounded-xl border border-neon-cyan/30 group-hover:border-neon-cyan/50 transition-colors" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <item.icon className="w-6 h-6 text-neon-cyan" />
                  </div>
                  <span className="absolute -top-2 -right-2 text-xs font-bold text-neon-purple bg-dark-800 px-1.5 py-0.5 rounded-md border border-neon-purple/30">{item.step}</span>
                </div>
                <div className="text-white font-semibold mb-1">{item.title}</div>
                <div className="text-gray-500 text-sm">{item.desc}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </main>
      
      {/* Footer */}
      <footer className="py-6 text-center z-10">
        <div className="flex items-center justify-center gap-2 text-gray-500 text-sm">
          <span>Built on</span>
          <span className="text-neon-cyan font-medium flex items-center gap-1">
            <Zap className="w-4 h-4" />
            Linera Protocol
          </span>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
