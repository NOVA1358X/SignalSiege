// PvE Page - Daily Puzzle and Training Mode

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useLineraStore } from '../stores/lineraStore';
import { useGameStore } from '../stores/gameStore';
import { GameBoard } from '../components/GameBoard';
import { TileInventory } from '../components/TileInventory';
import { MiniHeader } from '../components/GameHeader';

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
  
  // Fetch current state on mount
  useEffect(() => {
    if (isConnected) {
      fetchPuzzle();
      fetchTraining();
    }
  }, [isConnected, fetchPuzzle, fetchTraining]);
  
  // Helper functions to normalize puzzle/training status
  const getPuzzleStatus = (p: typeof puzzle) => {
    if (!p) return undefined;
    // Map contract status to frontend status
    if (p.status === 'InProgress') return 'Playing';
    if (p.status === 'Finished') return 'Finished';
    if (p.status) return p.status;
    if (p.isCompleted) return 'Finished' as const;
    return 'Playing' as const;
  };

  const getTrainingStatus = (t: typeof training) => {
    if (!t) return undefined;
    // Map contract status to frontend status
    const status = t.status;
    if (status === 'InProgress') return 'Playing';
    if (status === 'Finished') return 'Finished';
    return status;
  };

  // Auto-switch to active mode
  useEffect(() => {
    if (puzzle && getPuzzleStatus(puzzle) === 'Playing') {
      setMode('puzzle');
    } else if (training && getTrainingStatus(training) === 'Playing') {
      setMode('training');
    }
  }, [puzzle, training]);
  
  // Start puzzle handler
  const handleStartPuzzle = async () => {
    try {
      await startPuzzle();
      setMode('puzzle');
    } catch (error) {
      console.error('Failed to start puzzle:', error);
      // May fail if already attempted today
    }
  };
  
  // Start training handler  
  const handleStartTraining = async () => {
    try {
      await startTrainingMatch(selectedMap);
      setMode('training');
    } catch (error) {
      console.error('Failed to start training:', error);
    }
  };
  
  // Board click handler
  const handleBoardClick = async (index: number) => {
    if (mode === 'puzzle') {
      await makePuzzleMove(index);
    } else if (mode === 'training') {
      await makeTrainingMove(index);
    }
  };
  
  // Connection check
  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 mb-4">Connect to play</p>
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
  
  // Menu mode - choose puzzle or training
  if (mode === 'menu') {
    return (
      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-xl mx-auto">
          {/* Back button */}
          <button
            onClick={() => navigate('/lobby')}
            className="text-gray-400 hover:text-white mb-6"
          >
            ← Back to Lobby
          </button>
          
          <h1 className="text-3xl font-bold text-white mb-8 text-center">
            Practice Mode
          </h1>
          
          {/* Daily Puzzle Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-dark-800 rounded-xl p-6 border border-neon-purple/30 mb-4"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-white">🧩 Daily Puzzle</h2>
                <p className="text-gray-400 text-sm">
                  One puzzle per day. Solve it to earn bonus coins!
                </p>
              </div>
              <span className="text-3xl">🏆</span>
            </div>
            
            {getPuzzleStatus(puzzle) === 'Finished' ? (
              <div className="text-center py-4">
                {(puzzle?.isWon ?? puzzle?.completed) ? (
                  <p className="text-neon-green">✓ Solved! Come back tomorrow.</p>
                ) : (
                  <p className="text-neon-red">❌ Failed. Try again tomorrow.</p>
                )}
              </div>
            ) : getPuzzleStatus(puzzle) === 'Playing' ? (
              <button
                onClick={() => setMode('puzzle')}
                className="w-full py-3 bg-neon-purple text-white rounded-lg font-bold hover:bg-neon-purple/80 transition-colors"
              >
                Continue Puzzle
              </button>
            ) : (
              <button
                onClick={handleStartPuzzle}
                disabled={isLoadingPuzzle}
                className="w-full py-3 bg-gradient-to-r from-neon-purple to-neon-pink text-white rounded-lg font-bold hover:shadow-neon-purple transition-shadow disabled:opacity-50"
              >
                {isLoadingPuzzle ? 'Starting...' : 'Start Today\'s Puzzle'}
              </button>
            )}
          </motion.div>
          
          {/* Training Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-dark-800 rounded-xl p-6 border border-neon-cyan/30"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-white">🤖 Training Mode</h2>
                <p className="text-gray-400 text-sm">
                  Practice against AI. No stakes, unlimited plays.
                </p>
              </div>
              <span className="text-3xl">🎮</span>
            </div>
            
            {/* Map selector */}
            <div className="mb-4">
              <label className="text-sm text-gray-400 mb-2 block">Select Map</label>
              <div className="grid grid-cols-3 gap-2">
                {[0, 1, 2].map((mapId) => (
                  <button
                    key={mapId}
                    onClick={() => setSelectedMap(mapId)}
                    className={`
                      py-2 rounded-lg transition-colors text-sm
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
            
            {getTrainingStatus(training) === 'Playing' ? (
              <button
                onClick={() => setMode('training')}
                className="w-full py-3 bg-neon-cyan text-dark-900 rounded-lg font-bold hover:bg-neon-cyan/80 transition-colors"
              >
                Continue Training
              </button>
            ) : (
              <button
                onClick={handleStartTraining}
                disabled={isLoadingTraining}
                className="w-full py-3 bg-gradient-to-r from-neon-cyan to-neon-green text-dark-900 rounded-lg font-bold hover:shadow-neon-cyan transition-shadow disabled:opacity-50"
              >
                {isLoadingTraining ? 'Starting...' : 'Start Training Match'}
              </button>
            )}
          </motion.div>
        </div>
      </div>
    );
  }
  
  // Active game mode (puzzle or training)
  const activeGame = mode === 'puzzle' ? puzzle : training;
  // isLoading can be used for loading states in future
  void (mode === 'puzzle' ? isLoadingPuzzle : isLoadingTraining);
  
  // Normalize properties across puzzle and training
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-neon-cyan border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto">
        {/* Back to menu */}
        <button
          onClick={() => setMode('menu')}
          className="text-gray-400 hover:text-white mb-4"
        >
          ← Back to Menu
        </button>
        
        {/* Header */}
        <MiniHeader
          title={mode === 'puzzle' ? '🧩 Daily Puzzle' : '🤖 Training Mode'}
          turnNumber={activeTurnNumber}
          status={activeStatus ?? 'WaitingForPlayers'}
        />
        
        {/* Game area */}
        <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Board */}
          <div className="lg:col-span-2">
            <GameBoard
              board={activeGame.board}
              isMyTurn={activeStatus === 'Playing'}
              signalPath={lastSignalPath}
              showSignal={showSignalAnimation}
              onCellClick={handleBoardClick}
              disabled={activeStatus !== 'Playing' || isProcessingMove}
            />
          </div>
          
          {/* Sidebar */}
          <div className="space-y-4">
            {/* Inventory */}
            <TileInventory
              inventory={activeInventory}
              disabled={activeStatus !== 'Playing'}
            />
            
            {/* Status for finished game */}
            {activeStatus === 'Finished' && (
              <div className={`
                p-4 rounded-xl text-center
                ${mode === 'puzzle' 
                  ? (puzzle?.isWon ?? puzzle?.completed)
                    ? 'bg-neon-green/20 border border-neon-green/50' 
                    : 'bg-neon-red/20 border border-neon-red/50'
                  : (training?.winner === 'One' || training?.winner === 'player1')
                    ? 'bg-neon-green/20 border border-neon-green/50'
                    : 'bg-neon-red/20 border border-neon-red/50'
                }
              `}>
                <h3 className="text-xl font-bold text-white mb-2">
                  {mode === 'puzzle'
                    ? ((puzzle?.isWon ?? puzzle?.completed) ? '🎉 Puzzle Solved!' : '❌ Puzzle Failed')
                    : ((training?.winner === 'One' || training?.winner === 'player1') ? '🎉 You Win!' : '❌ AI Wins')
                  }
                </h3>
                <button
                  onClick={() => setMode('menu')}
                  className="px-6 py-2 bg-dark-700 text-white rounded-lg hover:bg-dark-600 transition-colors"
                >
                  Back to Menu
                </button>
              </div>
            )}
            
            {/* Objective reminder */}
            {activeStatus === 'Playing' && (
              <div className="bg-dark-800/50 rounded-lg p-3 border border-dark-600">
                <h4 className="text-sm font-medium text-gray-400 mb-1">Objective</h4>
                <p className="text-sm text-gray-300">
                  {mode === 'puzzle'
                    ? 'Connect the signal path from source to target within the turn limit.'
                    : 'Defeat the AI by connecting more signals or blocking theirs.'
                  }
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PvEPage;
