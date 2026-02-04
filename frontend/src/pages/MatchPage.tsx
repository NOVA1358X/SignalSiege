// Match Page - Active PvP gameplay

import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useLineraStore } from '../stores/lineraStore';
import { useGameStore } from '../stores/gameStore';
import { GameBoard } from '../components/GameBoard';
import { TileInventory } from '../components/TileInventory';
import { GameHeader } from '../components/GameHeader';
import { isMyTurn } from '../lib/gameApi';

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
  
  // Fetch room and determine player ID - use silent refresh if we have data
  useEffect(() => {
    if (isConnected) {
      // If we already have room data, use silent refresh to avoid loading spinner
      if (room) {
        refreshRoomSilent();
      } else {
        fetchRoom();
      }
    }
  }, [isConnected]);
  
  // Determine if it's my turn
  useEffect(() => {
    const checkTurn = async () => {
      if (!room) return;
      
      const p1Chain = room.playerChainIds?.[0] ?? room.player1;
      const p2Chain = room.playerChainIds?.[1] ?? room.player2;
      const currentPlayer = room.currentTurn === 'One' ? 'player1' : room.currentTurn === 'Two' ? 'player2' : room.currentTurn;
      
      // Determine which player we are
      if (p1Chain === chainId) {
        setMyPlayerId('player1');
        setMyTurn(currentPlayer === 'player1');
      } else if (p2Chain === chainId) {
        setMyPlayerId('player2');
        setMyTurn(currentPlayer === 'player2');
      } else {
        // Also check via API
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
  
  // Poll for updates when waiting for opponent - fast polling with periodic full sync
  useEffect(() => {
    const roomStatus = room?.status;
    const isPlaying = roomStatus === 'Playing' || roomStatus === 'InProgress';
    if (isPlaying && !myTurn) {
      // Start polling with silent refresh (no loading state)
      const interval = setInterval(() => {
        pollCountRef.current += 1;
        
        // Every 5th poll, do a full sync to ensure we get updates
        if (pollCountRef.current % 5 === 0) {
          fetchRoom();
        } else {
          refreshRoomSilent();
        }
      }, 2000); // Poll every 2 seconds
      
      setPollInterval(interval);
      return () => clearInterval(interval);
    } else {
      // Clear polling and reset counter
      if (pollInterval) {
        clearInterval(pollInterval);
        setPollInterval(null);
      }
      pollCountRef.current = 0;
    }
  }, [room?.status, myTurn, refreshRoomSilent, fetchRoom]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [pollInterval]);
  
  // Handle cell click
  const handleCellClick = useCallback(async (index: number) => {
    if (!myTurn || isProcessingMove) return;
    
    try {
      await makeMove(index);
    } catch (error) {
      console.error('Move failed:', error);
    }
  }, [myTurn, isProcessingMove, makeMove]);
  
  // Handle forfeit
  const handleForfeit = async () => {
    await forfeitMatch();
    setShowForfeitConfirm(false);
  };
  
  // Handle leave after game ends
  const handleLeave = async () => {
    await exitRoom();
    navigate('/lobby');
  };
  
  // Loading state
  if (isLoadingRoom && !room) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-neon-cyan border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-gray-400">Loading match...</p>
        </div>
      </div>
    );
  }
  
  // No room - redirect to lobby
  const roomStatus = room?.status;
  const isWaiting = roomStatus === 'Waiting' || roomStatus === 'WaitingForPlayer';
  if (!room || isWaiting) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 mb-4">No active match found</p>
          <button 
            onClick={() => navigate('/lobby')}
            className="px-6 py-2 bg-neon-cyan text-dark-900 rounded-lg font-bold"
          >
            Go to Lobby
          </button>
        </div>
      </div>
    );
  }
  
  // Get the right inventory based on player
  const myInventory = myPlayerId === 'player1' 
    ? (room.player1Inventory ?? room.inventories?.[0]) 
    : (room.player2Inventory ?? room.inventories?.[1]);
  const isPlaying = roomStatus === 'Playing' || roomStatus === 'InProgress';
  const roomStakes = room.stakeAmount ?? room.stakes ?? 0;
  
  return (
    <div className="min-h-screen p-2 md:p-4">
      <div className="max-w-6xl mx-auto">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigate('/lobby')}
            className="text-gray-400 hover:text-white text-sm"
          >
            ← Lobby
          </button>
          
          {isPlaying && (
            <button
              onClick={() => setShowForfeitConfirm(true)}
              className="text-sm text-neon-red/60 hover:text-neon-red"
            >
              Forfeit
            </button>
          )}
        </div>
        
        {/* Game Header */}
        <GameHeader room={room} isMyTurn={myTurn} myPlayerId={myPlayerId ?? undefined} />
        
        {/* Main game area */}
        <div className="mt-4 grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Game Board */}
          <div className="lg:col-span-3">
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
              <div className="mt-2 p-3 bg-neon-red/20 border border-neon-red/50 rounded-lg text-neon-red text-sm">
                {roomError}
              </div>
            )}
          </div>
          
          {/* Sidebar */}
          <div className="space-y-4">
            {/* Inventory */}
            {myInventory && (
              <TileInventory
                inventory={myInventory}
                disabled={!isPlaying || !myTurn}
              />
            )}
            
            {/* Turn indicator mobile */}
            <div className="lg:hidden p-3 bg-dark-800 rounded-lg text-center">
              {isPlaying ? (
                myTurn ? (
                  <span className="text-neon-cyan font-bold animate-pulse">Your Turn!</span>
                ) : (
                  <span className="text-gray-400">Waiting for opponent...</span>
                )
              ) : (
                <span className="text-neon-yellow">Game Over</span>
              )}
            </div>
            
            {/* Game finished card */}
            {roomStatus === 'Finished' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`
                  p-6 rounded-xl text-center
                  ${room.winner === myPlayerId || room.winner === 'One' && myPlayerId === 'player1' || room.winner === 'Two' && myPlayerId === 'player2'
                    ? 'bg-neon-green/20 border-2 border-neon-green' 
                    : room.winner 
                      ? 'bg-neon-red/20 border-2 border-neon-red'
                      : 'bg-neon-yellow/20 border-2 border-neon-yellow'
                  }
                `}
              >
                {(() => {
                  const isWinner = room.winner === myPlayerId || 
                    (room.winner === 'One' && myPlayerId === 'player1') || 
                    (room.winner === 'Two' && myPlayerId === 'player2');
                  return (
                    <>
                      <div className="text-4xl mb-2">
                        {isWinner ? '🎉' : room.winner ? '😔' : '🤝'}
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">
                        {isWinner 
                          ? 'Victory!' 
                          : room.winner 
                            ? 'Defeat' 
                            : 'Draw'
                        }
                      </h3>
                      
                      {roomStakes > 0 && (
                        <p className={`mb-4 ${isWinner ? 'text-neon-green' : 'text-gray-400'}`}>
                          {isWinner 
                            ? `+${roomStakes * 2} coins won!` 
                            : room.winner
                              ? `-${roomStakes} coins lost`
                              : 'Stakes returned'
                          }
                        </p>
                      )}
                    </>
                  );
                })()}
                
                <button
                  onClick={handleLeave}
                  className="w-full py-3 bg-dark-700 text-white rounded-lg hover:bg-dark-600 transition-colors"
                >
                  Back to Lobby
                </button>
              </motion.div>
            )}
            
            {/* Sync button (for when things get stuck) */}
            {isPlaying && !myTurn && (
              <button
                onClick={refreshRoomSilent}
                className="w-full py-2 text-sm text-gray-500 hover:text-gray-300 transition-colors"
              >
                🔄 Refresh
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Forfeit confirmation modal */}
      {showForfeitConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-dark-800 rounded-xl p-6 max-w-sm w-full border border-neon-red/30"
          >
            <h3 className="text-xl font-bold text-white mb-4">Forfeit Match?</h3>
            <p className="text-gray-400 mb-6">
              You will lose this match and forfeit any wagered coins.
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowForfeitConfirm(false)}
                className="flex-1 py-3 bg-dark-700 text-white rounded-lg hover:bg-dark-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleForfeit}
                disabled={isProcessingMove}
                className="flex-1 py-3 bg-neon-red text-white rounded-lg hover:bg-neon-red/80 transition-colors disabled:opacity-50"
              >
                {isProcessingMove ? 'Forfeiting...' : 'Forfeit'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default MatchPage;
