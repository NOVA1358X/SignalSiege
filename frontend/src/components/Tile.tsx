// Tile SVG components for the game board
// Clean, stylized icons for each tile type

import React from 'react';
import type { TileKind, Rotation } from '../lib/types';

interface TileProps {
  kind: TileKind;
  rotation?: Rotation;
  size?: number;
  isSignalActive?: boolean;
  className?: string;
}

// Rotation degrees mapping
const rotationDegrees: Record<Rotation, number> = {
  R0: 0,
  R90: 90,
  R180: 180,
  R270: 270,
};

// Straight path tile - signal flows through
const StraightPath: React.FC<{ active?: boolean }> = ({ active }) => (
  <svg viewBox="0 0 64 64" className="w-full h-full">
    <rect x="0" y="0" width="64" height="64" fill="#1a1a2e" />
    <rect 
      x="26" 
      y="4" 
      width="12" 
      height="56" 
      rx="2"
      fill={active ? '#4ade80' : '#374151'}
      className={active ? 'animate-pulse' : ''}
    />
    {active && (
      <rect x="28" y="4" width="8" height="56" rx="1" fill="#86efac" opacity="0.6" />
    )}
  </svg>
);

// Curved path tile - 90 degree turn
const CurvedPath: React.FC<{ active?: boolean }> = ({ active }) => (
  <svg viewBox="0 0 64 64" className="w-full h-full">
    <rect x="0" y="0" width="64" height="64" fill="#1a1a2e" />
    <path
      d="M 32 4 L 32 32 Q 32 38 38 38 L 60 38 L 60 26 L 38 26 Q 26 26 26 32 L 26 4 Z"
      fill={active ? '#4ade80' : '#374151'}
      className={active ? 'animate-pulse' : ''}
    />
    {active && (
      <path
        d="M 30 4 L 30 32 Q 30 36 36 36 L 60 36 L 60 28 L 36 28 Q 28 28 28 32 L 28 4 Z"
        fill="#86efac"
        opacity="0.6"
      />
    )}
  </svg>
);

// T-Junction tile - 3-way split
const TJunction: React.FC<{ active?: boolean }> = ({ active }) => (
  <svg viewBox="0 0 64 64" className="w-full h-full">
    <rect x="0" y="0" width="64" height="64" fill="#1a1a2e" />
    {/* Vertical bar */}
    <rect 
      x="26" 
      y="26" 
      width="12" 
      height="34" 
      rx="2"
      fill={active ? '#4ade80' : '#374151'}
      className={active ? 'animate-pulse' : ''}
    />
    {/* Horizontal bar */}
    <rect 
      x="4" 
      y="26" 
      width="56" 
      height="12" 
      rx="2"
      fill={active ? '#4ade80' : '#374151'}
      className={active ? 'animate-pulse' : ''}
    />
    {active && (
      <>
        <rect x="28" y="28" width="8" height="32" rx="1" fill="#86efac" opacity="0.6" />
        <rect x="4" y="28" width="56" height="8" rx="1" fill="#86efac" opacity="0.6" />
      </>
    )}
  </svg>
);

// Crossroad tile - 4-way intersection
const Crossroad: React.FC<{ active?: boolean }> = ({ active }) => (
  <svg viewBox="0 0 64 64" className="w-full h-full">
    <rect x="0" y="0" width="64" height="64" fill="#1a1a2e" />
    {/* Vertical */}
    <rect 
      x="26" 
      y="4" 
      width="12" 
      height="56" 
      rx="2"
      fill={active ? '#4ade80' : '#374151'}
      className={active ? 'animate-pulse' : ''}
    />
    {/* Horizontal */}
    <rect 
      x="4" 
      y="26" 
      width="56" 
      height="12" 
      rx="2"
      fill={active ? '#4ade80' : '#374151'}
      className={active ? 'animate-pulse' : ''}
    />
    {active && (
      <>
        <rect x="28" y="4" width="8" height="56" rx="1" fill="#86efac" opacity="0.6" />
        <rect x="4" y="28" width="56" height="8" rx="1" fill="#86efac" opacity="0.6" />
      </>
    )}
  </svg>
);

// Tower - signal source/destination
const Tower: React.FC<{ active?: boolean; isPlayer?: boolean }> = ({ active, isPlayer }) => (
  <svg viewBox="0 0 64 64" className="w-full h-full">
    <rect x="0" y="0" width="64" height="64" fill="#1a1a2e" />
    {/* Tower base */}
    <rect 
      x="20" 
      y="40" 
      width="24" 
      height="20" 
      rx="2"
      fill={active ? '#3b82f6' : isPlayer ? '#6366f1' : '#78716c'}
    />
    {/* Tower body */}
    <polygon 
      points="32,8 44,36 20,36"
      fill={active ? '#60a5fa' : isPlayer ? '#818cf8' : '#a8a29e'}
    />
    {/* Signal rings when active */}
    {active && (
      <>
        <circle cx="32" cy="20" r="6" fill="none" stroke="#93c5fd" strokeWidth="2" opacity="0.8">
          <animate attributeName="r" from="6" to="20" dur="1s" repeatCount="indefinite" />
          <animate attributeName="opacity" from="0.8" to="0" dur="1s" repeatCount="indefinite" />
        </circle>
        <circle cx="32" cy="20" r="6" fill="none" stroke="#93c5fd" strokeWidth="2" opacity="0.8">
          <animate attributeName="r" from="6" to="20" dur="1s" repeatCount="indefinite" begin="0.5s" />
          <animate attributeName="opacity" from="0.8" to="0" dur="1s" repeatCount="indefinite" begin="0.5s" />
        </circle>
      </>
    )}
  </svg>
);

// Jammer - blocks signal
const Jammer: React.FC<{ active?: boolean }> = ({ active }) => (
  <svg viewBox="0 0 64 64" className="w-full h-full">
    <rect x="0" y="0" width="64" height="64" fill="#1a1a2e" />
    {/* X shape */}
    <rect 
      x="28" 
      y="-4" 
      width="8" 
      height="72" 
      rx="2"
      fill={active ? '#ef4444' : '#991b1b'}
      transform="rotate(45 32 32)"
    />
    <rect 
      x="28" 
      y="-4" 
      width="8" 
      height="72" 
      rx="2"
      fill={active ? '#ef4444' : '#991b1b'}
      transform="rotate(-45 32 32)"
    />
    {/* Center circle */}
    <circle 
      cx="32" 
      cy="32" 
      r="10" 
      fill={active ? '#dc2626' : '#7f1d1d'}
    />
    {active && (
      <circle cx="32" cy="32" r="14" fill="none" stroke="#fca5a5" strokeWidth="2" opacity="0.6">
        <animate attributeName="opacity" values="0.6;0.2;0.6" dur="0.5s" repeatCount="indefinite" />
      </circle>
    )}
  </svg>
);

// Amplifier - doubles signal
const Amplifier: React.FC<{ active?: boolean }> = ({ active }) => (
  <svg viewBox="0 0 64 64" className="w-full h-full">
    <rect x="0" y="0" width="64" height="64" fill="#1a1a2e" />
    {/* Diamond shape */}
    <polygon 
      points="32,8 56,32 32,56 8,32"
      fill={active ? '#fbbf24' : '#78350f'}
      stroke={active ? '#fcd34d' : '#92400e'}
      strokeWidth="2"
    />
    {/* Inner diamond */}
    <polygon 
      points="32,18 46,32 32,46 18,32"
      fill={active ? '#f59e0b' : '#451a03'}
    />
    {/* Center glow */}
    {active && (
      <>
        <circle cx="32" cy="32" r="8" fill="#fef3c7" opacity="0.6">
          <animate attributeName="r" values="8;12;8" dur="0.6s" repeatCount="indefinite" />
        </circle>
        <text x="32" y="37" textAnchor="middle" fill="#fef3c7" fontSize="16" fontWeight="bold">×2</text>
      </>
    )}
    {!active && (
      <text x="32" y="37" textAnchor="middle" fill="#d97706" fontSize="14" fontWeight="bold">×2</text>
    )}
  </svg>
);

// Empty cell
const EmptyCell: React.FC = () => (
  <svg viewBox="0 0 64 64" className="w-full h-full">
    <rect x="0" y="0" width="64" height="64" fill="#0f0f17" />
    <rect 
      x="4" 
      y="4" 
      width="56" 
      height="56" 
      rx="4"
      fill="none"
      stroke="#1e1e2e"
      strokeWidth="2"
      strokeDasharray="4 4"
    />
  </svg>
);

// Blocked cell (wall)
const BlockedCell: React.FC = () => (
  <svg viewBox="0 0 64 64" className="w-full h-full">
    <rect x="0" y="0" width="64" height="64" fill="#0f0f17" />
    <rect 
      x="4" 
      y="4" 
      width="56" 
      height="56" 
      rx="4"
      fill="#27272a"
    />
    {/* Wall pattern */}
    <line x1="4" y1="20" x2="60" y2="20" stroke="#3f3f46" strokeWidth="1" />
    <line x1="4" y1="36" x2="60" y2="36" stroke="#3f3f46" strokeWidth="1" />
    <line x1="4" y1="52" x2="60" y2="52" stroke="#3f3f46" strokeWidth="1" />
    <line x1="20" y1="4" x2="20" y2="20" stroke="#3f3f46" strokeWidth="1" />
    <line x1="44" y1="4" x2="44" y2="20" stroke="#3f3f46" strokeWidth="1" />
    <line x1="8" y1="20" x2="8" y2="36" stroke="#3f3f46" strokeWidth="1" />
    <line x1="32" y1="20" x2="32" y2="36" stroke="#3f3f46" strokeWidth="1" />
    <line x1="56" y1="20" x2="56" y2="36" stroke="#3f3f46" strokeWidth="1" />
  </svg>
);

// Main Tile component
export const Tile: React.FC<TileProps> = ({ 
  kind, 
  rotation = 'R0', 
  size = 64,
  isSignalActive = false,
  className = '',
}) => {
  const degrees = rotationDegrees[rotation];
  
  const renderTile = () => {
    switch (kind) {
      case 'Empty':
      case 'EMPTY':
        return <EmptyCell />;
      case 'Blocked':
      case 'WALL':
      case 'BLOCKER':
        return <BlockedCell />;
      case 'StraightPath':
      case 'WIRE_STRAIGHT':
        return <StraightPath active={isSignalActive} />;
      case 'CurvedPath':
      case 'WIRE_CORNER':
        return <CurvedPath active={isSignalActive} />;
      case 'TJunction':
      case 'WIRE_T_JUNCTION':
        return <TJunction active={isSignalActive} />;
      case 'Crossroad':
      case 'WIRE_CROSS':
        return <Crossroad active={isSignalActive} />;
      case 'Tower':
      case 'CORE':
        return <Tower active={isSignalActive} isPlayer />;
      case 'Jammer':
      case 'JAMMER':
        return <Jammer active={isSignalActive} />;
      case 'Amplifier':
      case 'AMPLIFIER':
        return <Amplifier active={isSignalActive} />;
      case 'RELAY':
        return <Tower active={isSignalActive} isPlayer={false} />;
      default:
        return <EmptyCell />;
    }
  };
  
  // Special tiles that shouldn't rotate visually
  const noRotateTiles = ['Empty', 'EMPTY', 'Blocked', 'WALL', 'BLOCKER', 'Jammer', 'JAMMER', 'Amplifier', 'AMPLIFIER', 'Crossroad', 'WIRE_CROSS'];
  const shouldRotate = !noRotateTiles.includes(kind);
  
  return (
    <div 
      className={`relative ${className}`}
      style={{ 
        width: size, 
        height: size,
        transform: shouldRotate && degrees !== 0 ? `rotate(${degrees}deg)` : undefined,
      }}
    >
      {renderTile()}
    </div>
  );
};

// Export individual tile components for inventory display
export { StraightPath, CurvedPath, TJunction, Crossroad, Tower, Jammer, Amplifier, EmptyCell, BlockedCell };
