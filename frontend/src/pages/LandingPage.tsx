// Landing Page - Hero section with wallet connection

import React, { useMemo } from 'react';
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
  Unlink,
  Sparkles
} from 'lucide-react';

// Floating particle component
const FloatingParticle: React.FC<{ delay: number; x: number; size: number; color: string }> = ({ delay, x, size, color }) => (
  <motion.div
    className="absolute rounded-full pointer-events-none"
    style={{ 
      width: size, 
      height: size, 
      left: `${x}%`,
      background: color,
      boxShadow: `0 0 ${size * 2}px ${color}`,
    }}
    initial={{ y: '110vh', opacity: 0 }}
    animate={{ 
      y: '-10vh', 
      opacity: [0, 0.8, 0.8, 0],
      x: [0, Math.sin(x) * 30, -Math.sin(x) * 20, 0],
    }}
    transition={{ 
      duration: 12 + Math.random() * 8, 
      repeat: Infinity, 
      delay,
      ease: "linear",
    }}
  />
);

// Animated signal pulse along a path
const SignalPulse: React.FC<{ pathId: string; delay: number; color: string }> = ({ pathId, delay, color }) => (
  <motion.circle
    r="3"
    fill={color}
    filter="url(#glow)"
    initial={{ opacity: 0 }}
    animate={{ opacity: [0, 1, 1, 0] }}
    transition={{ duration: 3, repeat: Infinity, delay, ease: "linear" }}
  >
    <animateMotion dur="3s" repeatCount="indefinite" begin={`${delay}s`}>
      <mpath href={`#${pathId}`} />
    </animateMotion>
  </motion.circle>
);

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { isConnected, isConnecting, connect, disconnect, chainId, autoSignerAddress, error } = useLineraStore();
  const { isAuthenticated, isLinked, openLogin, isLinking, linkIdentity, fullLogout, dynamicEvmAddress, linkError, isAutoConnecting } = useDynamicWallet();
  
  // Combined connecting state
  const isFullyConnecting = isConnecting || isAutoConnecting;
  
  // Generate stable random particles
  const particles = useMemo(() => 
    Array.from({ length: 20 }, (_, i) => ({
      id: i,
      delay: i * 0.8,
      x: (i * 5.3 + 3) % 100,
      size: 2 + (i % 3) * 1.5,
      color: i % 3 === 0 ? 'rgba(0, 255, 255, 0.6)' : i % 3 === 1 ? 'rgba(168, 85, 247, 0.6)' : 'rgba(255, 0, 255, 0.5)',
    })), []
  );
  
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
      transition: { staggerChildren: 0.12, delayChildren: 0.3 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { type: "spring", stiffness: 100, damping: 12 }
    }
  };

  const pulseVariants = {
    pulse: {
      scale: [1, 1.05, 1],
      opacity: [0.7, 1, 0.7],
      transition: { duration: 2, repeat: Infinity }
    }
  };

  const featureCards = [
    { icon: Zap, text: 'On-Chain PvP', color: 'text-neon-cyan', glowColor: 'rgba(0,255,255,0.15)', borderColor: 'border-neon-cyan/30', hoverBg: 'hover:bg-neon-cyan/5' },
    { icon: Grid3X3, text: '7×7 Grid', color: 'text-neon-purple', glowColor: 'rgba(168,85,247,0.15)', borderColor: 'border-neon-purple/30', hoverBg: 'hover:bg-neon-purple/5' },
    { icon: Coins, text: 'Stake & Win', color: 'text-neon-yellow', glowColor: 'rgba(255,214,0,0.15)', borderColor: 'border-neon-yellow/30', hoverBg: 'hover:bg-neon-yellow/5' },
    { icon: Puzzle, text: 'Daily Puzzles', color: 'text-neon-pink', glowColor: 'rgba(255,0,255,0.15)', borderColor: 'border-neon-pink/30', hoverBg: 'hover:bg-neon-pink/5' },
  ];
  
  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-dark-900">
      {/* Animated background */}
      <div className="absolute inset-0">
        {/* Gradient orbs */}
        <motion.div 
          className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-neon-cyan/15 rounded-full blur-[100px]"
          animate={{ x: [0, 80, 0], y: [0, 50, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-neon-purple/15 rounded-full blur-[100px]"
          animate={{ x: [0, -80, 0], y: [0, -50, 0], scale: [1.2, 1, 1.2] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />
        <motion.div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/8 rounded-full blur-[120px]"
          animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />
        
        {/* Grid overlay */}
        <motion.div 
          className="absolute inset-0 opacity-[0.07]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.07 }}
          transition={{ duration: 2 }}
          style={{
            backgroundImage: `linear-gradient(rgba(0, 255, 255, 0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 255, 0.4) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />

        {/* Floating particles */}
        {particles.map(p => (
          <FloatingParticle key={p.id} {...p} />
        ))}

        {/* Animated circuit paths SVG */}
        <svg className="absolute inset-0 w-full h-full opacity-25 pointer-events-none">
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
            <linearGradient id="circuitGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00ffff" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#a855f7" stopOpacity="0.6" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          {/* Horizontal scanning lines */}
          {[15, 35, 55, 75, 90].map((y, i) => (
            <motion.line
              key={`hline-${i}`}
              x1="0%"
              y1={`${y}%`}
              x2="100%"
              y2={`${y}%`}
              stroke={i % 2 === 0 ? "url(#lineGrad1)" : "url(#lineGrad2)"}
              strokeWidth="1"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: [0, 1], opacity: [0, 0.5, 0] }}
              transition={{ duration: 5, repeat: Infinity, delay: i * 0.8, ease: "linear" }}
            />
          ))}

          {/* Circuit paths with signal pulses */}
          <path id="circuit1" d="M 0,200 Q 200,180 400,250 T 800,200 T 1200,280 T 1600,200" stroke="url(#circuitGrad)" strokeWidth="1" fill="none" opacity="0.3">
            <animate attributeName="stroke-dashoffset" from="1000" to="0" dur="20s" repeatCount="indefinite" />
          </path>
          <path id="circuit2" d="M 0,400 Q 300,350 500,420 T 900,380 T 1400,450" stroke="url(#circuitGrad)" strokeWidth="1" fill="none" opacity="0.2">
            <animate attributeName="stroke-dashoffset" from="800" to="0" dur="15s" repeatCount="indefinite" />
          </path>

          {/* Animated signal dots traveling along paths */}
          <SignalPulse pathId="circuit1" delay={0} color="#00ffff" />
          <SignalPulse pathId="circuit1" delay={1.5} color="#a855f7" />
          <SignalPulse pathId="circuit2" delay={0.8} color="#ff00ff" />

          {/* Corner circuit decorations */}
          <motion.path
            d="M 30,30 L 80,30 L 80,60"
            stroke="#00ffff"
            strokeWidth="1.5"
            fill="none"
            opacity="0.4"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2, delay: 0.5 }}
          />
          <motion.circle cx="80" cy="60" r="3" fill="#00ffff" opacity="0.6"
            animate={{ opacity: [0.3, 0.8, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <motion.path
            d="M 30,30 L 30,80 L 60,80"
            stroke="#a855f7"
            strokeWidth="1.5"
            fill="none"
            opacity="0.4"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2, delay: 0.8 }}
          />
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
          {/* Powered by badge */}
          <motion.div variants={itemVariants} className="mb-8">
            <motion.div 
              className="inline-flex items-center gap-3 px-5 py-2.5 bg-dark-800/50 backdrop-blur-md border border-neon-cyan/20 rounded-full mb-8 relative overflow-hidden"
              whileHover={{ scale: 1.05, borderColor: 'rgba(0, 255, 255, 0.6)' }}
            >
              {/* Shimmer effect on badge */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-neon-cyan/10 to-transparent"
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              />
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              >
                <Zap className="w-4 h-4 text-neon-cyan" />
              </motion.div>
              <span className="text-sm text-gray-300 relative">Powered by Linera Protocol</span>
              <ChevronRight className="w-4 h-4 text-gray-500" />
            </motion.div>
            
            {/* Title with animated gradient */}
            <motion.h1 
              className="text-5xl md:text-7xl lg:text-8xl font-black mb-5 tracking-tight relative"
              variants={itemVariants}
            >
              <motion.span 
                className="bg-clip-text text-transparent inline-block"
                style={{
                  backgroundImage: 'linear-gradient(90deg, #00ffff, #3b82f6, #a855f7, #00ffff)',
                  backgroundSize: '200% 100%',
                }}
                animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
                transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
              >
                Signal
              </motion.span>
              <span className="text-white">Siege</span>
              
              {/* Decorative sparkle */}
              <motion.div
                className="absolute -top-2 -right-4 md:right-4"
                animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.2, 1] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <Sparkles className="w-6 h-6 md:w-8 md:h-8 text-neon-yellow/60" />
              </motion.div>
            </motion.h1>
            
            <motion.p 
              className="text-lg md:text-xl text-gray-400 max-w-lg mx-auto leading-relaxed"
              variants={itemVariants}
            >
              Strategic circuit warfare on the blockchain. Build paths, outsmart opponents, claim victory.
            </motion.p>
          </motion.div>

          {/* Feature cards with enhanced animations */}
          <motion.div 
            className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-10"
            variants={itemVariants}
          >
            {featureCards.map((feature, i) => (
              <motion.div 
                key={i}
                className={`group relative p-5 bg-dark-800/30 backdrop-blur-sm border ${feature.borderColor} rounded-xl ${feature.hoverBg} transition-all duration-500 cursor-default overflow-hidden`}
                initial={{ opacity: 0, y: 40, rotateX: 15 }}
                animate={{ opacity: 1, y: 0, rotateX: 0 }}
                transition={{ delay: 0.4 + i * 0.12, type: "spring", stiffness: 100 }}
                whileHover={{ y: -6, scale: 1.04 }}
              >
                {/* Card glow on hover */}
                <motion.div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl"
                  style={{ background: `radial-gradient(circle at 50% 50%, ${feature.glowColor}, transparent 70%)` }}
                />
                
                {/* Animated border shimmer */}
                <motion.div
                  className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ 
                    background: `linear-gradient(90deg, transparent, ${feature.glowColor}, transparent)`,
                    mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                    maskComposite: 'exclude',
                    WebkitMaskComposite: 'xor',
                    padding: '1px',
                    borderRadius: '0.75rem',
                  }}
                  animate={{ backgroundPosition: ['0% 50%', '100% 50%'] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                
                <motion.div
                  className="relative"
                  whileHover={{ scale: 1.15, rotate: [0, -10, 10, 0] }}
                  transition={{ duration: 0.5 }}
                >
                  <feature.icon className={`w-7 h-7 ${feature.color} mx-auto mb-2.5`} />
                </motion.div>
                <span className="relative text-sm text-gray-300 font-semibold">{feature.text}</span>
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
          className="mt-20 max-w-3xl text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-50px" }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h3 className="text-gray-400 mb-2 text-sm uppercase tracking-[0.2em] font-medium">How It Works</h3>
            <motion.div 
              className="w-12 h-0.5 bg-gradient-to-r from-neon-cyan to-neon-purple mx-auto mb-10 rounded-full"
              initial={{ width: 0 }}
              whileInView={{ width: 48 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.3 }}
            />
          </motion.div>
          
          <div className="grid grid-cols-3 gap-4 md:gap-8 relative">
            {/* Connecting line between steps */}
            <motion.div 
              className="absolute top-7 left-[20%] right-[20%] h-[2px] bg-gradient-to-r from-neon-cyan/30 via-neon-purple/30 to-neon-pink/30 hidden md:block"
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.2, delay: 0.5 }}
            />
            
            {[
              { step: '01', title: 'Place Tiles', desc: 'Build signal paths on the grid', icon: Grid3X3, color: 'from-neon-cyan/20 to-blue-500/20', borderColor: 'border-neon-cyan/40', iconColor: 'text-neon-cyan', dotColor: 'bg-neon-cyan' },
              { step: '02', title: 'Route Signals', desc: 'Connect towers strategically', icon: Zap, color: 'from-neon-purple/20 to-pink-500/20', borderColor: 'border-neon-purple/40', iconColor: 'text-neon-purple', dotColor: 'bg-neon-purple' },
              { step: '03', title: 'Dominate', desc: 'Block opponents & claim victory', icon: Shield, color: 'from-neon-pink/20 to-red-500/20', borderColor: 'border-neon-pink/40', iconColor: 'text-neon-pink', dotColor: 'bg-neon-pink' },
            ].map((item, i) => (
              <motion.div 
                key={i} 
                className="group text-center relative"
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 + i * 0.2, type: "spring", stiffness: 100 }}
                whileHover={{ y: -8 }}
              >
                <div className="relative w-14 h-14 mx-auto mb-4">
                  {/* Animated ring */}
                  <motion.div
                    className={`absolute inset-0 rounded-xl border-2 ${item.borderColor} opacity-50`}
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 20 + i * 5, repeat: Infinity, ease: "linear" }}
                    style={{ borderRadius: '30% 70% 70% 30% / 30% 30% 70% 70%' }}
                  />
                  <div className={`absolute inset-0 rounded-xl bg-gradient-to-br ${item.color} group-hover:opacity-100 opacity-60 transition-opacity duration-300`} />
                  <div className={`absolute inset-0 rounded-xl border ${item.borderColor} group-hover:border-opacity-80 transition-colors`} />
                  <motion.div 
                    className="absolute inset-0 flex items-center justify-center"
                    whileHover={{ scale: 1.2, rotate: 10 }}
                  >
                    <item.icon className={`w-6 h-6 ${item.iconColor}`} />
                  </motion.div>
                  <motion.span 
                    className={`absolute -top-2.5 -right-2.5 text-[10px] font-bold text-white ${item.dotColor} w-6 h-6 flex items-center justify-center rounded-full shadow-lg`}
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.8 + i * 0.15, type: "spring", stiffness: 300 }}
                  >
                    {item.step}
                  </motion.span>
                </div>
                <div className="text-white font-bold mb-1 text-sm md:text-base">{item.title}</div>
                <div className="text-gray-500 text-xs md:text-sm">{item.desc}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Testimonial / Game preview teaser */}
        <motion.div
          className="mt-16 max-w-xl mx-auto"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
        >
          <motion.div 
            className="relative p-6 bg-dark-800/30 backdrop-blur-sm border border-gray-700/30 rounded-2xl overflow-hidden"
            whileHover={{ borderColor: 'rgba(0, 255, 255, 0.3)' }}
          >
            {/* Animated corner accents */}
            <motion.div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-neon-cyan/40 rounded-tl-2xl"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}
            />
            <motion.div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-neon-purple/40 rounded-br-2xl"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.7 }}
            />
            
            <div className="flex items-center gap-3 mb-3">
              <motion.div 
                className="w-8 h-8 rounded-full bg-gradient-to-br from-neon-cyan to-neon-purple flex items-center justify-center"
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
              >
                <Zap className="w-4 h-4 text-white" />
              </motion.div>
              <div className="text-left">
                <div className="text-white font-semibold text-sm">Zero Gas Gaming</div>
                <div className="text-gray-500 text-xs">Auto-signer technology</div>
              </div>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed text-left">
              Every move is recorded on-chain with zero gas fees. Linera&apos;s microchain architecture enables real-time PvP without compromising on decentralization.
            </p>
          </motion.div>
        </motion.div>
      </main>
      
      {/* Footer */}
      <footer className="py-8 text-center z-10 relative">
        <motion.div 
          className="w-full h-px bg-gradient-to-r from-transparent via-gray-700/50 to-transparent mb-6"
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
        />
        <motion.div 
          className="flex items-center justify-center gap-2 text-gray-500 text-sm"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <span>Built on</span>
          <motion.span 
            className="text-neon-cyan font-medium flex items-center gap-1"
            whileHover={{ scale: 1.05 }}
          >
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            >
              <Zap className="w-4 h-4" />
            </motion.div>
            Linera Protocol
          </motion.span>
        </motion.div>
      </footer>
    </div>
  );
};

export default LandingPage;
