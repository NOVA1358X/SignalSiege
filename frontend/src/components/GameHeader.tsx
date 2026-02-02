// GameHeader component - shows match info, turn indicator, and player status

import React from 'react';
import { motion } from 'framer-motion';
import type { GameRoom } from '../lib/types';

interface GameHeaderProps {
  room: GameRoom;
  isMyTurn: boolean;
  myPlayerId?: 'player1' | 'player2';
}

export const GameHeader: React.FC<GameHeaderProps> = ({ room, isMyTurn, myPlayerId }) => {
  const { status, turnNumber, currentTurn, lastSignal, stakeAmount } = room;
  
  // Get player chain IDs
  const player1 = room.playerChainIds?.[0] ?? room.player1;
  const player2 = room.playerChainIds?.[1] ?? room.player2;
  const stakes = stakeAmount ?? room.stakes ?? 0;
  
  // Format turn indicator
  const getTurnText = () => {
    if (status === 'Waiting' || status === 'WaitingForPlayer') return 'Waiting for opponent...';
    if (status === 'Finished') {
      const winner = room.winner;
      if (!winner) return 'Game Over - Draw';
      const winnerPlayer = winner === 'One' ? 'player1' : winner === 'Two' ? 'player2' : winner;
      return winnerPlayer === myPlayerId ? '🎉 You Win!' : 'Game Over - You Lose';
    }
    return isMyTurn ? 'Your Turn' : "Opponent's Turn";
  };
  
  // Status color
  const getStatusColor = () => {
    if (status === 'Finished') {
      const winner = room.winner;
      const winnerPlayer = winner === 'One' ? 'player1' : winner === 'Two' ? 'player2' : winner;
      return winnerPlayer === myPlayerId ? 'text-neon-green' : 'text-neon-red';
    }
    if (status === 'Waiting' || status === 'WaitingForPlayer') return 'text-neon-yellow';
    return isMyTurn ? 'text-neon-cyan' : 'text-gray-400';
  };
  
  // Check if playing
  const isPlaying = status === 'Playing' || status === 'InProgress';
  
  // Get current turn player
  const currentTurnPlayer = currentTurn === 'One' ? 'player1' : currentTurn === 'Two' ? 'player2' : currentTurn;
  
  // Truncate address
  const truncate = (addr: string | null | undefined) => {
    if (!addr) return '...';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };
  
  return (
    <div className="bg-dark-800/90 rounded-xl p-4 border border-neon-cyan/20">
      {/* Turn indicator */}
      <div className="flex items-center justify-center mb-4">
        <motion.div
          className={`text-xl font-bold ${getStatusColor()}`}
          animate={isMyTurn && isPlaying ? { scale: [1, 1.05, 1] } : {}}
          transition={{ repeat: Infinity, duration: 1.5 }}
        >
          {getTurnText()}
        </motion.div>
      </div>
      
      {/* Match info row */}
      <div className="grid grid-cols-3 gap-4 text-center">
        {/* Player 1 */}
        <div className={`p-2 rounded-lg ${
          currentTurnPlayer === 'player1' ? 'bg-neon-cyan/20 border border-neon-cyan/50' : 'bg-dark-700'
        }`}>
          <div className="text-xs text-gray-400 mb-1">
            {myPlayerId === 'player1' ? 'You' : 'Opponent'}
          </div>
          <div className="text-sm font-mono text-neon-cyan truncate">
            {player1 ? truncate(player1) : 'Waiting...'}
          </div>
          {currentTurnPlayer === 'player1' && isPlaying && (
            <div className="w-2 h-2 bg-neon-cyan rounded-full mx-auto mt-1 animate-pulse" />
          )}
        </div>
        
        {/* Turn/Stakes info */}
        <div className="flex flex-col items-center justify-center">
          <div className="text-xs text-gray-500">Turn</div>
          <div className="text-lg font-bold text-white">{turnNumber}</div>
          {stakes > 0 && (
            <div className="mt-1 px-2 py-0.5 bg-neon-yellow/20 rounded text-xs text-neon-yellow">
              🪙 {stakes} stake
            </div>
          )}
        </div>
        
        {/* Player 2 */}
        <div className={`p-2 rounded-lg ${
          currentTurnPlayer === 'player2' ? 'bg-neon-pink/20 border border-neon-pink/50' : 'bg-dark-700'
        }`}>
          <div className="text-xs text-gray-400 mb-1">
            {myPlayerId === 'player2' ? 'You' : 'Opponent'}
          </div>
          <div className="text-sm font-mono text-neon-pink truncate">
            {player2 ? truncate(player2) : 'Waiting...'}
          </div>
          {currentTurnPlayer === 'player2' && isPlaying && (
            <div className="w-2 h-2 bg-neon-pink rounded-full mx-auto mt-1 animate-pulse" />
          )}
        </div>
      </div>
      
      {/* Last signal info */}
      {lastSignal && (lastSignal.strength ?? lastSignal.path?.length ?? 0) > 0 && (
        <div className="mt-4 pt-3 border-t border-dark-600">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Last Signal</span>
            <div className="flex items-center gap-2">
              <span className={`font-bold ${lastSignal.amplified ? 'text-neon-yellow' : 'text-neon-green'}`}>
                {lastSignal.amplified ? '⚡' : '📡'} {lastSignal.strength ?? lastSignal.path?.length ?? 0} cells
              </span>
              {lastSignal.blocked && (
                <span className="text-neon-red text-xs">🚫 Blocked</span>
              )}
              {(lastSignal.reachedTarget ?? lastSignal.reachedOpponentCore) && (
                <span className="text-neon-green text-xs">✓ Connected!</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Compact header for puzzle/training mode
interface MiniHeaderProps {
  title: string;
  turnNumber?: number;
  subtitle?: string;
  status?: string;
}

export const MiniHeader: React.FC<MiniHeaderProps> = ({ title, turnNumber, subtitle, status }) => (
  <div className="bg-dark-800/90 rounded-xl p-3 border border-neon-purple/20 flex items-center justify-between">
    <div>
      <h2 className="text-lg font-bold text-white">{title}</h2>
      {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
    </div>
    <div className="flex items-center gap-4">
      {turnNumber !== undefined && (
        <div className="text-center">
          <div className="text-xs text-gray-500">Turn</div>
          <div className="text-lg font-bold text-neon-cyan">{turnNumber}</div>
        </div>
      )}
      {status && (
        <div className="px-3 py-1 bg-neon-purple/20 rounded-full text-sm text-neon-purple">
          {status}
        </div>
      )}
    </div>
  </div>
);

export default GameHeader;
