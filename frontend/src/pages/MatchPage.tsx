// Match Page - Active PvP gameplay

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useLineraStore } from '../stores/lineraStore';
import { useGameStore } from '../stores/gameStore';
import { GameBoard } from '../components/GameBoard';
import { TileInventory } from '../components/TileInventory';
import { GameHeader } from '../components/GameHeader';
import { isMyTurn } from '../lib/gameApi';
import {
  ArrowLeft,
  Flag,
  Trophy,
  Skull,
  Handshake,
  Coins,
  RefreshCw,
  Loader2,
  Home,
  Swords,
  X,
  AlertTriangle
} from 'lucide-react';

const MatchPage: React.FC = () => {
  const navigate = useNavigate();
  const { isConnected, chainId } = useLineraStore();
  const {
    room,
    isLoadingRoom,
    roomError,
    isProcessingMove,
    showSignalAnimation,
    lastSignalPath,
    fetchRoom,
    refreshRoomSilent,
    makeMove,
    forfeitMatch,
    exitRoom,
  } = useGameStore();
  
  const [myTurn, setMyTurn] = useState(false);
  const [myPlayerId, setMyPlayerId] = useState<'player1' | 'player2' | null>(null);
  const [showForfeitConfirm, setShowForfeitConfirm] = useState(false);
  const [pollInterval, setPollInterval] = useState<NodeJS.Timeout | null>(null);
  const pollCountRef = React.useRef(0);
  
  useEffect(() => {
    if (isConnected) {
      if (room) {
        refreshRoomSilent();
      } else {
        fetchRoom();
      }
    }
  }, [isConnected]);
  
  useEffect(() => {
    const checkTurn = async () => {
      if (!room) return;
      
      const p1Chain = room.playerChainIds?.[0] ?? room.player1;
      const p2Chain = room.playerChainIds?.[1] ?? room.player2;
      const currentPlayer = room.currentTurn === 'One' ? 'player1' : room.currentTurn === 'Two' ? 'player2' : room.currentTurn;
      
      if (p1Chain === chainId) {
        setMyPlayerId('player1');
        setMyTurn(currentPlayer === 'player1');
      } else if (p2Chain === chainId) {
        setMyPlayerId('player2');
        setMyTurn(currentPlayer === 'player2');
      } else {
        try {
          const isTurn = await isMyTurn();
          setMyTurn(isTurn);
        } catch {
          // Fallback
        }
      }
    };
    
    checkTurn();
  }, [room, chainId]);
  
  useEffect(() => {
    const roomStatus = room?.status;
    const isPlaying = roomStatus === 'Playing' || roomStatus === 'InProgress';
    if (isPlaying && !myTurn) {
      const interval = setInterval(() => {
        pollCountRef.current += 1;
        if (pollCountRef.current % 5 === 0) {
          fetchRoom();
        } else {
          refreshRoomSilent();
        }
      }, 2000);
      
      setPollInterval(interval);
      return () => clearInterval(interval);
    } else {
      if (pollInterval) {
        clearInterval(pollInterval);
        setPollInterval(null);
      }
      pollCountRef.current = 0;
    }
  }, [room?.status, myTurn, refreshRoomSilent, fetchRoom]);
  
  useEffect(() => {
    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [pollInterval]);
  
  const handleCellClick = useCallback(async (index: number) => {
    if (!myTurn || isProcessingMove) return;
    
    try {
      await makeMove(index);
    } catch (error) {
      console.error('Move failed:', error);
    }
  }, [myTurn, isProcessingMove, makeMove]);
  
  const handleForfeit = async () => {
    await forfeitMatch();
    setShowForfeitConfirm(false);
  };
  
  const handleLeave = async () => {
    await exitRoom();
    navigate('/lobby');
  };
  
  // Loading state
  if (isLoadingRoom && !room) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-900">
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Loader2 className="w-12 h-12 text-neon-cyan animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading match...</p>
        </motion.div>
      </div>
    );
  }
  
  const roomStatus = room?.status;
  const isWaiting = roomStatus === 'Waiting' || roomStatus === 'WaitingForPlayer';
  if (!room || isWaiting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-900">
        <motion.div 
          className="text-center p-8 bg-dark-800/60 backdrop-blur-sm border border-gray-700/50 rounded-2xl"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Swords className="w-12 h-12 text-neon-cyan mx-auto mb-4" />
          <p className="text-gray-400 mb-4">No active match found</p>
          <motion.button 
            onClick={() => navigate('/lobby')}
            className="px-6 py-3 bg-gradient-to-r from-neon-cyan to-neon-purple text-white rounded-xl font-bold"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Go to Lobby
          </motion.button>
        </motion.div>
      </div>
    );
  }
  
  const myInventory = myPlayerId === 'player1' 
    ? (room.player1Inventory ?? room.inventories?.[0]) 
    : (room.player2Inventory ?? room.inventories?.[1]);
  const isPlaying = roomStatus === 'Playing' || roomStatus === 'InProgress';
  const roomStakes = room.stakeAmount ?? room.stakes ?? 0;
  
  const isWinner = room.winner === myPlayerId || 
    (room.winner === 'One' && myPlayerId === 'player1') || 
    (room.winner === 'Two' && myPlayerId === 'player2');
  
  return (
    <div className="min-h-screen p-2 md:p-4 bg-dark-900">
      <div className="max-w-6xl mx-auto">
        {/* Top bar */}
        <motion.div 
          className="flex items-center justify-between mb-4"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <motion.button
            onClick={() => navigate('/lobby')}
            className="flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-colors"
            whileHover={{ x: -4 }}
          >
            <ArrowLeft className="w-4 h-4" />
            Lobby
          </motion.button>
          
          {isPlaying && (
            <motion.button
              onClick={() => setShowForfeitConfirm(true)}
              className="flex items-center gap-1 text-sm text-neon-red/60 hover:text-neon-red transition-colors"
              whileHover={{ scale: 1.05 }}
            >
              <Flag className="w-4 h-4" />
              Forfeit
            </motion.button>
          )}
        </motion.div>
        
        {/* Game Header */}
        <GameHeader room={room} isMyTurn={myTurn} myPlayerId={myPlayerId ?? undefined} />
        
        {/* Main game area */}
        <div className="mt-4 grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Game Board */}
          <motion.div 
            className="lg:col-span-3"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <GameBoard
              board={room.board}
              isMyTurn={myTurn && isPlaying}
              signalPath={lastSignalPath}
              showSignal={showSignalAnimation}
              onCellClick={handleCellClick}
              disabled={!isPlaying || !myTurn}
            />
            
            {/* Error display */}
            {roomError && (
              <motion.div 
                className="mt-2 p-3 bg-neon-red/20 border border-neon-red/30 rounded-xl text-neon-red text-sm flex items-center gap-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <AlertTriangle className="w-4 h-4" />
                {roomError}
              </motion.div>
            )}
          </motion.div>
          
          {/* Sidebar */}
          <motion.div 
            className="space-y-4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            {/* Inventory */}
            {myInventory && (
              <TileInventory
                inventory={myInventory}
                disabled={!isPlaying || !myTurn}
              />
            )}
            
            {/* Turn indicator mobile */}
            <div className="lg:hidden p-4 bg-dark-800/60 backdrop-blur-sm border border-gray-700/50 rounded-xl text-center">
              {isPlaying ? (
                myTurn ? (
                  <span className="text-neon-cyan font-bold animate-pulse flex items-center justify-center gap-2">
                    <Swords className="w-5 h-5" />
                    Your Turn!
                  </span>
                ) : (
                  <span className="text-gray-400 flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Waiting for opponent...
                  </span>
                )
              ) : (
                <span className="text-neon-yellow font-medium">Game Over</span>
              )}
            </div>
            
            {/* Game finished card */}
            <AnimatePresence>
              {roomStatus === 'Finished' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className={`p-6 rounded-2xl text-center ${
                    isWinner
                      ? 'bg-gradient-to-br from-neon-green/20 to-neon-cyan/10 border border-neon-green/30' 
                      : room.winner 
                        ? 'bg-gradient-to-br from-neon-red/20 to-neon-pink/10 border border-neon-red/30'
                        : 'bg-gradient-to-br from-neon-yellow/20 to-neon-yellow/5 border border-neon-yellow/30'
                  }`}
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                  >
                    {isWinner ? (
                      <Trophy className="w-12 h-12 text-neon-green mx-auto mb-3" />
                    ) : room.winner ? (
                      <Skull className="w-12 h-12 text-neon-red mx-auto mb-3" />
                    ) : (
                      <Handshake className="w-12 h-12 text-neon-yellow mx-auto mb-3" />
                    )}
                  </motion.div>
                  
                  <h3 className="text-xl font-bold text-white mb-2">
                    {isWinner ? 'Victory!' : room.winner ? 'Defeat' : 'Draw'}
                  </h3>
                  
                  {roomStakes > 0 && (
                    <motion.div 
                      className={`flex items-center justify-center gap-2 mb-4 ${
                        isWinner ? 'text-neon-green' : room.winner ? 'text-neon-red' : 'text-gray-400'
                      }`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      <Coins className="w-5 h-5" />
                      <span className="font-bold">
                        {isWinner 
                          ? `+${roomStakes * 2} coins won!` 
                          : room.winner
                            ? `-${roomStakes} coins lost`
                            : 'Stakes returned'
                        }
                      </span>
                    </motion.div>
                  )}
                  
                  <motion.button
                    onClick={handleLeave}
                    className="w-full py-3 bg-dark-700/50 text-white rounded-xl hover:bg-dark-600 transition-colors flex items-center justify-center gap-2"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Home className="w-5 h-5" />
                    Back to Lobby
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Sync button */}
            {isPlaying && !myTurn && (
              <motion.button
                onClick={refreshRoomSilent}
                className="w-full py-2 text-sm text-gray-500 hover:text-gray-300 transition-colors flex items-center justify-center gap-2"
                whileHover={{ scale: 1.02 }}
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </motion.button>
            )}
          </motion.div>
        </div>
      </div>
      
      {/* Forfeit confirmation modal */}
      <AnimatePresence>
        {showForfeitConfirm && (
          <motion.div 
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-dark-800/90 backdrop-blur-sm rounded-2xl p-6 max-w-sm w-full border border-neon-red/30"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-neon-red/20 flex items-center justify-center">
                  <Flag className="w-5 h-5 text-neon-red" />
                </div>
                <h3 className="text-xl font-bold text-white">Forfeit Match?</h3>
              </div>
              
              <p className="text-gray-400 mb-6">
                You will lose this match and forfeit any wagered coins. This cannot be undone.
              </p>
              
              <div className="flex gap-3">
                <motion.button
                  onClick={() => setShowForfeitConfirm(false)}
                  className="flex-1 py-3 bg-dark-700/50 text-white rounded-xl hover:bg-dark-600 transition-colors flex items-center justify-center gap-2"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <X className="w-5 h-5" />
                  Cancel
                </motion.button>
                <motion.button
                  onClick={handleForfeit}
                  disabled={isProcessingMove}
                  className="flex-1 py-3 bg-neon-red text-white rounded-xl hover:bg-neon-red/80 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isProcessingMove ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Forfeiting...
                    </>
                  ) : (
                    <>
                      <Flag className="w-5 h-5" />
                      Forfeit
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MatchPage;
