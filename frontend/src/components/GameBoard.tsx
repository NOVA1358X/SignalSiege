// Game Board component - 7x7 grid
// Interactive board for placing tiles and viewing game state

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tile } from './Tile';
import { useGameStore } from '../stores/gameStore';
import type { Board, Cell } from '../lib/types';

interface GameBoardProps {
  board: Board;
  isMyTurn?: boolean;
  signalPath?: number[];
  showSignal?: boolean;
  onCellClick?: (index: number) => void;
  disabled?: boolean;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  board,
  isMyTurn = false,
  signalPath = [],
  showSignal = false,
  onCellClick,
  disabled = false,
}) => {
  const { selectedTile, actionType, isProcessingMove } = useGameStore();
  
  // Create signal path set for quick lookup
  const signalPathSet = useMemo(() => new Set(signalPath), [signalPath]);
  
  // Parse board - expected to be an array of 49 cells
  const cells: Cell[] = useMemo(() => {
    if (Array.isArray(board)) return board;
    if (typeof board === 'object' && 'cells' in board) {
      return (board as { cells: Cell[] }).cells;
    }
    // Return empty board
    return Array(49).fill({ tile: null, owner: null });
  }, [board]);
  
  const handleCellClick = (index: number) => {
    if (disabled || !isMyTurn || isProcessingMove) return;
    
    const cell = cells[index];
    
    // For 'place' action, only allow clicking empty cells when a tile is selected
    if (actionType === 'place') {
      if (!selectedTile) return;
      if (cell.kind !== 'EMPTY' && cell.kind !== 'Empty') return; // Can't place on occupied cell
    }
    
    // For 'rotate', need a path tile that can rotate
    if (actionType === 'rotate') {
      if (cell.kind === 'EMPTY' || cell.kind === 'Empty') return;
      const rotatableTiles = ['WIRE_STRAIGHT', 'WIRE_CORNER', 'WIRE_T_JUNCTION', 'StraightPath', 'CurvedPath', 'TJunction'];
      if (!rotatableTiles.includes(cell.kind)) return;
    }
    
    // For 'move_jammer', need to click on a jammer
    if (actionType === 'move_jammer') {
      if (cell.kind !== 'JAMMER' && cell.kind !== 'Jammer') return;
    }
    
    onCellClick?.(index);
  };
  
  // Get cursor style based on action type
  const getCellCursor = (cell: Cell) => {
    if (disabled || !isMyTurn || isProcessingMove) return 'not-allowed';
    
    if (actionType === 'place' && selectedTile && (cell.kind === 'EMPTY' || cell.kind === 'Empty')) {
      return 'pointer';
    }
    if (actionType === 'rotate' && cell.kind !== 'EMPTY' && cell.kind !== 'Empty') {
      const rotatableTiles = ['WIRE_STRAIGHT', 'WIRE_CORNER', 'WIRE_T_JUNCTION', 'StraightPath', 'CurvedPath', 'TJunction'];
      if (rotatableTiles.includes(cell.kind)) return 'pointer';
    }
    if (actionType === 'move_jammer' && (cell.kind === 'JAMMER' || cell.kind === 'Jammer')) {
      return 'pointer';
    }
    
    return 'default';
  };
  
  // Check if cell should show hover preview
  const showPreview = (cell: Cell) => {
    return (
      isMyTurn && 
      !isProcessingMove &&
      actionType === 'place' && 
      selectedTile && 
      (cell.kind === 'EMPTY' || cell.kind === 'Empty')
    );
  };
  
  return (
    <div className="relative">
      {/* Board container with neon border */}
      <div className="bg-dark-900/80 rounded-xl p-3 border border-neon-cyan/30 shadow-neon-cyan">
        {/* Grid */}
        <div 
          className="grid gap-1"
          style={{
            gridTemplateColumns: 'repeat(7, 1fr)',
          }}
        >
          {cells.map((cell, index) => {
            const isInSignalPath = showSignal && signalPathSet.has(index);
            const row = Math.floor(index / 7);
            const col = index % 7;
            
            return (
              <motion.div
                key={index}
                className={`
                  relative aspect-square rounded
                  transition-all duration-150
                  ${isMyTurn && !disabled ? 'hover:ring-2 hover:ring-neon-cyan/50' : ''}
                  ${isInSignalPath ? 'ring-2 ring-neon-green' : ''}
                `}
                style={{ cursor: getCellCursor(cell) }}
                onClick={() => handleCellClick(index)}
                whileHover={showPreview(cell) ? { scale: 1.05 } : {}}
                whileTap={showPreview(cell) ? { scale: 0.95 } : {}}
              >
                {/* Cell background */}
                <div className="absolute inset-0 bg-dark-800 rounded" />
                
                {/* Tile content */}
                {cell.kind !== 'EMPTY' && cell.kind !== 'Empty' ? (
                  <div className="absolute inset-0 p-0.5">
                    <Tile
                      kind={cell.kind}
                      rotation={cell.rotation}
                      isSignalActive={isInSignalPath}
                    />
                    
                    {/* Owner indicator */}
                    {cell.owner !== 0 && (
                      <div className={`
                        absolute top-0.5 right-0.5 w-2 h-2 rounded-full
                        ${cell.owner === 1 ? 'bg-neon-cyan' : 'bg-neon-pink'}
                      `} />
                    )}
                  </div>
                ) : (
                  <div className="absolute inset-0 p-0.5">
                    <Tile kind="EMPTY" />
                  </div>
                )}
                
                {/* Placement preview */}
                {showPreview(cell) && (
                  <div className="absolute inset-0 p-0.5 opacity-40">
                    <Tile
                      kind={selectedTile!}
                      rotation="R0"
                    />
                  </div>
                )}
                
                {/* Coordinate labels (optional, for debugging) */}
                {process.env.NODE_ENV === 'development' && (
                  <span className="absolute bottom-0 left-0 text-[8px] text-gray-600">
                    {row},{col}
                  </span>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
      
      {/* Signal animation overlay */}
      <AnimatePresence>
        {showSignal && signalPath.length > 0 && (
          <SignalPulse path={signalPath} />
        )}
      </AnimatePresence>
      
      {/* Processing overlay */}
      {isProcessingMove && (
        <div className="absolute inset-0 bg-dark-900/50 rounded-xl flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-neon-cyan border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
};

// Signal pulse animation component
const SignalPulse: React.FC<{ path: number[] }> = ({ path }) => {
  // Calculate positions for the signal path
  const cellSize = 48; // Approximate cell size in pixels
  const gap = 4;
  
  const getPosition = (index: number) => {
    const row = Math.floor(index / 7);
    const col = index % 7;
    return {
      x: col * (cellSize + gap) + cellSize / 2 + 12, // +12 for padding
      y: row * (cellSize + gap) + cellSize / 2 + 12,
    };
  };
  
  // Create SVG path
  const pathData = path.map((index, i) => {
    const pos = getPosition(index);
    return i === 0 ? `M ${pos.x} ${pos.y}` : `L ${pos.x} ${pos.y}`;
  }).join(' ');
  
  return (
    <motion.svg
      className="absolute inset-0 pointer-events-none z-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Base path */}
      <path
        d={pathData}
        fill="none"
        stroke="rgba(74, 222, 128, 0.3)"
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {/* Animated pulse */}
      <motion.path
        d={pathData}
        fill="none"
        stroke="#4ade80"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="20 10"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.5, ease: "easeInOut" }}
      />
      
      {/* Glowing pulse circles at each node */}
      {path.map((index, i) => {
        const pos = getPosition(index);
        return (
          <motion.circle
            key={index}
            cx={pos.x}
            cy={pos.y}
            r="6"
            fill="#4ade80"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: (i / path.length) * 1.5, duration: 0.3 }}
          >
            <animate
              attributeName="r"
              values="6;10;6"
              dur="0.5s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="opacity"
              values="1;0.5;1"
              dur="0.5s"
              repeatCount="indefinite"
            />
          </motion.circle>
        );
      })}
    </motion.svg>
  );
};

export default GameBoard;
