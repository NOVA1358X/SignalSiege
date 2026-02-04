// PvE Page - Daily Puzzle and Training Mode

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useLineraStore } from '../stores/lineraStore';
import { useGameStore } from '../stores/gameStore';
import { GameBoard } from '../components/GameBoard';
import { TileInventory } from '../components/TileInventory';
import {
  ArrowLeft,
  Puzzle,
  Bot,
  Trophy,
  Loader2,
  Target,
  Shield,
  Sparkles,
  Play,
  ChevronRight,
  Clock,
  Star,
  Zap,
  Home
} from 'lucide-react';

type Mode = 'menu' | 'puzzle' | 'training';

const PvEPage: React.FC = () => {
  const navigate = useNavigate();
  const { isConnected } = useLineraStore();
  const {
    puzzle,
    training,
    isLoadingPuzzle,
    isLoadingTraining,
    isProcessingMove,
    showSignalAnimation,
    lastSignalPath,
    fetchPuzzle,
    fetchTraining,
    startPuzzle,
    startTrainingMatch,
    makePuzzleMove,
    makeTrainingMove,
  } = useGameStore();
  
  const [mode, setMode] = useState<Mode>('menu');
  const [selectedMap, setSelectedMap] = useState(0);
  
  useEffect(() => {
    if (isConnected) {
      fetchPuzzle();
      fetchTraining();
    }
  }, [isConnected, fetchPuzzle, fetchTraining]);
  
  const getPuzzleStatus = (p: typeof puzzle) => {
    if (!p) return undefined;
    if (p.status === 'InProgress') return 'Playing';
    if (p.status === 'Finished') return 'Finished';
    if (p.status) return p.status;
    if (p.isCompleted) return 'Finished' as const;
    return 'Playing' as const;
  };

  const getTrainingStatus = (t: typeof training) => {
    if (!t) return undefined;
    const status = t.status;
    if (status === 'InProgress') return 'Playing';
    if (status === 'Finished') return 'Finished';
    return status;
  };

  useEffect(() => {
    if (puzzle && getPuzzleStatus(puzzle) === 'Playing') {
      setMode('puzzle');
    } else if (training && getTrainingStatus(training) === 'Playing') {
      setMode('training');
    }
  }, [puzzle, training]);
  
  const handleStartPuzzle = async () => {
    try {
      await startPuzzle();
      setMode('puzzle');
    } catch (error) {
      console.error('Failed to start puzzle:', error);
    }
  };
  
  const handleStartTraining = async () => {
    try {
      await startTrainingMatch(selectedMap);
      setMode('training');
    } catch (error) {
      console.error('Failed to start training:', error);
    }
  };
  
  const handleBoardClick = async (index: number) => {
    if (mode === 'puzzle') {
      await makePuzzleMove(index);
    } else if (mode === 'training') {
      await makeTrainingMove(index);
    }
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
          <p className="text-gray-400 mb-4">Connect to play</p>
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
  
  // Menu mode
  if (mode === 'menu') {
    return (
      <div className="min-h-screen p-4 md:p-8 bg-dark-900">
        <div className="max-w-xl mx-auto">
          <motion.button
            onClick={() => navigate('/lobby')}
            className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            whileHover={{ x: -4 }}
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Lobby
          </motion.button>
          
          <motion.h1 
            className="text-3xl font-bold text-white mb-8 text-center flex items-center justify-center gap-3"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Zap className="w-8 h-8 text-neon-cyan" />
            Practice Mode
          </motion.h1>
          
          {/* Daily Puzzle Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="group bg-dark-800/60 backdrop-blur-sm rounded-2xl p-6 border border-neon-purple/30 hover:border-neon-purple/50 mb-4 transition-all"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-neon-purple/20 to-neon-pink/20 border border-neon-purple/30 flex items-center justify-center">
                  <Puzzle className="w-6 h-6 text-neon-purple" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Daily Puzzle</h2>
                  <p className="text-gray-400 text-sm">One puzzle per day for bonus coins</p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-neon-yellow">
                <Trophy className="w-5 h-5" />
                <span className="font-bold">+100</span>
              </div>
            </div>
            
            {getPuzzleStatus(puzzle) === 'Finished' ? (
              <div className="text-center py-4 bg-dark-700/30 rounded-xl">
                {(puzzle?.isWon ?? puzzle?.completed) ? (
                  <div className="flex items-center justify-center gap-2 text-neon-green">
                    <Star className="w-5 h-5" />
                    <span className="font-medium">Solved! Come back tomorrow</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2 text-neon-red">
                    <Clock className="w-5 h-5" />
                    <span className="font-medium">Try again tomorrow</span>
                  </div>
                )}
              </div>
            ) : getPuzzleStatus(puzzle) === 'Playing' ? (
              <motion.button
                onClick={() => setMode('puzzle')}
                className="w-full py-3 bg-neon-purple text-white rounded-xl font-bold hover:bg-neon-purple/80 transition-colors flex items-center justify-center gap-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Play className="w-5 h-5" />
                Continue Puzzle
                <ChevronRight className="w-5 h-5" />
              </motion.button>
            ) : (
              <motion.button
                onClick={handleStartPuzzle}
                disabled={isLoadingPuzzle}
                className="w-full py-3 bg-gradient-to-r from-neon-purple to-neon-pink text-white rounded-xl font-bold hover:shadow-lg hover:shadow-neon-purple/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isLoadingPuzzle ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Starting...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Start Today's Puzzle
                  </>
                )}
              </motion.button>
            )}
          </motion.div>
          
          {/* Training Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="group bg-dark-800/60 backdrop-blur-sm rounded-2xl p-6 border border-neon-green/30 hover:border-neon-green/50 transition-all"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-neon-green/20 to-neon-cyan/20 border border-neon-green/30 flex items-center justify-center">
                  <Bot className="w-6 h-6 text-neon-green" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Training Mode</h2>
                  <p className="text-gray-400 text-sm">Practice vs AI, unlimited plays</p>
                </div>
              </div>
            </div>
            
            {/* Map selector */}
            <div className="mb-4">
              <label className="text-sm text-gray-400 mb-3 block">Select Map</label>
              <div className="grid grid-cols-3 gap-3">
                {[0, 1, 2].map((mapId) => (
                  <motion.button
                    key={mapId}
                    onClick={() => setSelectedMap(mapId)}
                    className={`p-3 rounded-xl transition-all ${
                      selectedMap === mapId 
                        ? 'bg-neon-green/20 border-2 border-neon-green text-white' 
                        : 'bg-dark-700/50 border-2 border-gray-700/50 text-gray-400 hover:border-gray-600'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Target className={`w-6 h-6 mx-auto mb-1 ${selectedMap === mapId ? 'text-neon-green' : 'text-gray-500'}`} />
                    <span className="text-sm font-medium">Map {mapId + 1}</span>
                  </motion.button>
                ))}
              </div>
            </div>
            
            {getTrainingStatus(training) === 'Playing' ? (
              <motion.button
                onClick={() => setMode('training')}
                className="w-full py-3 bg-neon-green text-dark-900 rounded-xl font-bold hover:bg-neon-green/80 transition-colors flex items-center justify-center gap-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Play className="w-5 h-5" />
                Continue Training
                <ChevronRight className="w-5 h-5" />
              </motion.button>
            ) : (
              <motion.button
                onClick={handleStartTraining}
                disabled={isLoadingTraining}
                className="w-full py-3 bg-gradient-to-r from-neon-green to-neon-cyan text-dark-900 rounded-xl font-bold hover:shadow-lg hover:shadow-neon-green/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isLoadingTraining ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Starting...
                  </>
                ) : (
                  <>
                    <Bot className="w-5 h-5" />
                    Start Training Match
                  </>
                )}
              </motion.button>
            )}
          </motion.div>
        </div>
      </div>
    );
  }
  
  // Active game mode
  const activeGame = mode === 'puzzle' ? puzzle : training;
  const activeStatus = mode === 'puzzle' ? getPuzzleStatus(puzzle) : getTrainingStatus(training);
  const activeTurnNumber = activeGame 
    ? Number(activeGame.turnNumber ?? ('currentTurn' in activeGame ? activeGame.currentTurn : 0))
    : 0;
  const emptyInventory = { 
    wireStraight: 0, wireCorner: 0, wireTJunction: 0, wireCross: 0, 
    blocker: 0, jammer: 0, amplifier: 0
  };
  const activeInventory = activeGame
    ? (activeGame.player1Inventory ?? ('inventory' in activeGame ? activeGame.inventory : activeGame.inventories?.[0]) ?? emptyInventory)
    : emptyInventory;
  
  if (!activeGame) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-900">
        <Loader2 className="w-10 h-10 text-neon-cyan animate-spin" />
      </div>
    );
  }
  
  const isWin = mode === 'puzzle'
    ? (puzzle?.isWon ?? puzzle?.completed)
    : (training?.winner === 'One' || training?.winner === 'player1');
  
  return (
    <div className="min-h-screen p-4 bg-dark-900">
      <div className="max-w-4xl mx-auto">
        <motion.button
          onClick={() => setMode('menu')}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          whileHover={{ x: -4 }}
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Menu
        </motion.button>
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-dark-800/60 backdrop-blur-sm rounded-2xl p-4 border border-gray-700/50 mb-4 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            {mode === 'puzzle' ? (
              <Puzzle className="w-6 h-6 text-neon-purple" />
            ) : (
              <Bot className="w-6 h-6 text-neon-green" />
            )}
            <h2 className="text-lg font-bold text-white">
              {mode === 'puzzle' ? 'Daily Puzzle' : 'Training Mode'}
            </h2>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-center">
              <span className="text-gray-400 text-xs">Turn</span>
              <p className="text-xl font-bold text-white">{activeTurnNumber}</p>
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              activeStatus === 'Playing' ? 'bg-neon-green/20 text-neon-green' : 'bg-gray-700/50 text-gray-400'
            }`}>
              {activeStatus === 'Playing' ? 'Playing' : 'Finished'}
            </div>
          </div>
        </motion.div>
        
        {/* Game area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Board */}
          <motion.div 
            className="lg:col-span-2"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <GameBoard
              board={activeGame.board}
              isMyTurn={activeStatus === 'Playing'}
              signalPath={lastSignalPath}
              showSignal={showSignalAnimation}
              onCellClick={handleBoardClick}
              disabled={activeStatus !== 'Playing' || isProcessingMove}
            />
          </motion.div>
          
          {/* Sidebar */}
          <motion.div 
            className="space-y-4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <TileInventory
              inventory={activeInventory}
              disabled={activeStatus !== 'Playing'}
            />
            
            {/* Finished state */}
            <AnimatePresence>
              {activeStatus === 'Finished' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={`p-6 rounded-2xl text-center ${
                    isWin
                      ? 'bg-gradient-to-br from-neon-green/20 to-neon-cyan/10 border border-neon-green/30' 
                      : 'bg-gradient-to-br from-neon-red/20 to-neon-pink/10 border border-neon-red/30'
                  }`}
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                  >
                    {isWin ? (
                      <Trophy className="w-12 h-12 text-neon-green mx-auto mb-3" />
                    ) : (
                      <Shield className="w-12 h-12 text-neon-red mx-auto mb-3" />
                    )}
                  </motion.div>
                  
                  <h3 className="text-xl font-bold text-white mb-4">
                    {mode === 'puzzle'
                      ? (isWin ? 'Puzzle Solved!' : 'Puzzle Failed')
                      : (isWin ? 'You Win!' : 'AI Wins')
                    }
                  </h3>
                  
                  <motion.button
                    onClick={() => setMode('menu')}
                    className="px-6 py-3 bg-dark-700/50 text-white rounded-xl hover:bg-dark-600 transition-colors flex items-center gap-2 mx-auto"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Home className="w-5 h-5" />
                    Back to Menu
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Objective */}
            {activeStatus === 'Playing' && (
              <motion.div 
                className="bg-dark-800/40 rounded-xl p-4 border border-gray-700/30"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <h4 className="text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Objective
                </h4>
                <p className="text-sm text-gray-300">
                  {mode === 'puzzle'
                    ? 'Connect the signal path from source to target within the turn limit.'
                    : 'Defeat the AI by connecting more signals or blocking theirs.'
                  }
                </p>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default PvEPage;
