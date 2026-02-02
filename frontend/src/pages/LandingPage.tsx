// Landing Page - Hero section with wallet connection

import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useLineraStore } from '../stores/lineraStore';
import { useDynamicWallet } from '../hooks/useDynamic';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { isConnected, isConnecting, connect, disconnect, chainId, autoSignerAddress, error } = useLineraStore();
  const { isAuthenticated, isLinked, openLogin, isLinking, linkIdentity, fullLogout, dynamicEvmAddress, linkError } = useDynamicWallet();
  
  const handlePlay = async () => {
    if (!isConnected) {
      // First connect to Linera
      await connect();
    }
    
    // Navigate to lobby after connection
    navigate('/lobby');
  };
  
  const handleDisconnect = () => {
    disconnect();
    fullLogout();
  };
  
  // Helper to shorten addresses
  const shortAddress = (addr: string | null) => {
    if (!addr) return '...';
    return `${addr.slice(0, 8)}...${addr.slice(-6)}`;
  };
  
  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-radial from-dark-800 via-dark-900 to-black" />
      <div className="absolute inset-0">
        {/* Grid pattern */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
              linear-gradient(rgba(0, 255, 255, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0, 255, 255, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
          }}
        />
        
        {/* Animated signal lines */}
        <svg className="absolute inset-0 w-full h-full opacity-30">
          <defs>
            <linearGradient id="signalGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#00ffff" stopOpacity="0" />
              <stop offset="50%" stopColor="#00ffff" stopOpacity="1" />
              <stop offset="100%" stopColor="#00ffff" stopOpacity="0" />
            </linearGradient>
          </defs>
          
          {/* Animated horizontal lines */}
          {[20, 40, 60, 80].map((y, i) => (
            <motion.line
              key={i}
              x1="0%"
              y1={`${y}%`}
              x2="100%"
              y2={`${y}%`}
              stroke="url(#signalGrad)"
              strokeWidth="2"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ 
                pathLength: [0, 1], 
                opacity: [0, 1, 0],
              }}
              transition={{ 
                duration: 3, 
                repeat: Infinity, 
                delay: i * 0.8,
                ease: "linear",
              }}
            />
          ))}
        </svg>
      </div>
      
      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center z-10 px-4">
        {/* Logo/Title */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-8"
        >
          <h1 className="text-6xl md:text-8xl font-bold mb-4">
            <span className="bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-pink bg-clip-text text-transparent">
              Signal
            </span>
            <span className="text-white">Siege</span>
          </h1>
          
          <motion.p 
            className="text-xl md:text-2xl text-gray-400"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Strategic Signal Warfare on Linera
          </motion.p>
        </motion.div>
        
        {/* Feature highlights */}
        <motion.div 
          className="flex flex-wrap justify-center gap-4 mb-12 text-sm md:text-base"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {[
            { icon: '⚡', text: 'On-Chain PvP' },
            { icon: '🎯', text: '7×7 Grid Combat' },
            { icon: '🪙', text: 'Wager & Win' },
            { icon: '🧩', text: 'Daily Puzzles' },
          ].map((feature, i) => (
            <div 
              key={i}
              className="px-4 py-2 bg-dark-800/50 border border-neon-cyan/30 rounded-lg flex items-center gap-2"
            >
              <span>{feature.icon}</span>
              <span className="text-gray-300">{feature.text}</span>
            </div>
          ))}
        </motion.div>
        
        {/* CTA Buttons */}
        <motion.div
          className="flex flex-col sm:flex-row gap-4"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          {/* Main Play Button */}
          <motion.button
            onClick={handlePlay}
            disabled={isConnecting}
            className={`
              px-8 py-4 text-lg font-bold rounded-xl
              bg-gradient-to-r from-neon-cyan to-neon-purple
              text-dark-900 shadow-neon-cyan
              hover:shadow-[0_0_30px_rgba(0,255,255,0.6)]
              transition-shadow
              disabled:opacity-50 disabled:cursor-wait
            `}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isConnecting ? (
              <span className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-dark-900 border-t-transparent rounded-full animate-spin" />
                Connecting...
              </span>
            ) : isConnected ? (
              '🎮 Enter Game'
            ) : (
              '⚡ Quick Play'
            )}
          </motion.button>
          
          {/* Wallet Button */}
          {!isAuthenticated ? (
            <motion.button
              onClick={openLogin}
              className={`
                px-8 py-4 text-lg font-bold rounded-xl
                border-2 border-neon-purple text-neon-purple
                hover:bg-neon-purple/10
                transition-colors
              `}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              🔗 Connect Wallet
            </motion.button>
          ) : !isLinked ? (
            <motion.button
              type="button"
              onClick={async (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('[LandingPage] Link Identity clicked');
                try {
                  await linkIdentity();
                } catch (err) {
                  console.error('[LandingPage] Link failed:', err);
                }
              }}
              disabled={isLinking || !isConnected}
              className={`
                px-8 py-4 text-lg font-bold rounded-xl
                border-2 border-neon-yellow text-neon-yellow
                hover:bg-neon-yellow/10
                transition-colors
                disabled:opacity-50
              `}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isLinking ? 'Linking...' : !isConnected ? '⏳ Connect First' : '🔐 Link Identity'}
            </motion.button>
          ) : (
            <motion.button
              onClick={() => navigate('/profile')}
              className={`
                px-8 py-4 text-lg font-bold rounded-xl
                border-2 border-neon-green text-neon-green
                hover:bg-neon-green/10
                transition-colors
              `}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              ✓ Wallet Linked
            </motion.button>
          )}
        </motion.div>
        
        {/* Link Error Display */}
        {linkError && (
          <motion.div
            className="mt-4 px-4 py-2 bg-neon-red/10 border border-neon-red/50 rounded-lg"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <span className="text-neon-red text-sm">⚠️ {linkError}</span>
          </motion.div>
        )}
        
        {/* Connection Status Card - Show when connected or error */}
        {(isConnected || error) && (
          <motion.div
            className="mt-8 p-4 bg-dark-800/80 border border-neon-cyan/30 rounded-xl max-w-md w-full"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {error ? (
              <div className="text-center">
                <span className="text-neon-red">⚠️ {error}</span>
                <button 
                  onClick={() => connect()}
                  className="ml-3 text-neon-cyan underline text-sm"
                >
                  Retry
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-neon-green animate-pulse" />
                    <span className="text-neon-green font-medium">Connected to Conway Testnet</span>
                  </div>
                  <button
                    onClick={handleDisconnect}
                    className="text-gray-400 hover:text-neon-red text-sm transition-colors"
                  >
                    Disconnect
                  </button>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Chain ID:</span>
                    <span className="font-mono text-neon-cyan">{shortAddress(chainId)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Game Signer:</span>
                    <span className="font-mono text-gray-300">{shortAddress(autoSignerAddress)}</span>
                  </div>
                  {isAuthenticated && dynamicEvmAddress && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">EVM Wallet:</span>
                      <span className="font-mono text-neon-purple">{shortAddress(dynamicEvmAddress)}</span>
                    </div>
                  )}
                </div>
                
                <div className="mt-3 pt-3 border-t border-gray-700 text-center text-xs text-gray-500">
                  Auto-signer ready • No gas fees per move
                </div>
              </>
            )}
          </motion.div>
        )}
        
        {/* How to play teaser */}
        <motion.div
          className="mt-16 max-w-2xl text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <h3 className="text-gray-400 mb-4">How It Works</h3>
          <div className="grid grid-cols-3 gap-6">
            {[
              { step: '1', title: 'Place Tiles', desc: 'Build signal paths' },
              { step: '2', title: 'Route Signals', desc: 'Connect your towers' },
              { step: '3', title: 'Dominate', desc: 'Block opponents & win' },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-neon-cyan/20 border border-neon-cyan/50 flex items-center justify-center text-neon-cyan font-bold">
                  {item.step}
                </div>
                <div className="text-white font-medium">{item.title}</div>
                <div className="text-gray-500 text-sm">{item.desc}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </main>
      
      {/* Footer */}
      <footer className="py-4 text-center text-gray-600 text-sm z-10">
        Built on <span className="text-neon-cyan">Linera Protocol</span>
      </footer>
    </div>
  );
};

export default LandingPage;
