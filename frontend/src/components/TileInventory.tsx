// Tile Inventory component
// Shows available tiles and allows selection

import React from 'react';
import { motion } from 'framer-motion';
import { Tile } from './Tile';
import { useGameStore } from '../stores/gameStore';
import type { TileKind, TileInventory as TileInventoryType, Rotation } from '../lib/types';

interface TileInventoryProps {
  inventory: TileInventoryType;
  disabled?: boolean;
}

// Tiles that can be placed from inventory
const PLACEABLE_TILES: TileKind[] = ['WIRE_STRAIGHT', 'WIRE_CORNER', 'WIRE_T_JUNCTION', 'WIRE_CROSS'];

// Rotation options
const ROTATIONS: { value: Rotation; label: string }[] = [
  { value: 'R0', label: '0°' },
  { value: 'R90', label: '90°' },
  { value: 'R180', label: '180°' },
  { value: 'R270', label: '270°' },
];

export const TileInventory: React.FC<TileInventoryProps> = ({ inventory, disabled = false }) => {
  const { 
    selectedTile, 
    selectedRotation,
    actionType,
    selectTile, 
    setRotation,
    setActionType,
  } = useGameStore();
  
  // Get count for a tile type
  const getCount = (kind: TileKind): number => {
    switch (kind) {
      case 'StraightPath':
      case 'WIRE_STRAIGHT':
        return inventory.wireStraight ?? inventory.straight ?? 0;
      case 'CurvedPath':
      case 'WIRE_CORNER':
        return inventory.wireCorner ?? inventory.curved ?? 0;
      case 'TJunction':
      case 'WIRE_T_JUNCTION':
        return inventory.wireTJunction ?? inventory.tJunction ?? 0;
      case 'Crossroad':
      case 'WIRE_CROSS':
        return inventory.wireCross ?? inventory.crossroad ?? 0;
      default: return 0;
    }
  };
  
  const handleTileSelect = (kind: TileKind) => {
    if (disabled) return;
    if (getCount(kind) <= 0) return;
    
    if (selectedTile === kind) {
      selectTile(null);
    } else {
      selectTile(kind);
      setActionType('place');
    }
  };
  
  return (
    <div className="bg-dark-800/90 rounded-xl p-4 border border-neon-purple/30">
      <h3 className="text-sm font-bold text-gray-300 mb-3">INVENTORY</h3>
      
      {/* Tile grid */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {PLACEABLE_TILES.map((kind) => {
          const count = getCount(kind);
          const isSelected = selectedTile === kind;
          const isEmpty = count <= 0;
          
          return (
            <motion.button
              key={kind}
              onClick={() => handleTileSelect(kind)}
              disabled={disabled || isEmpty}
              className={`
                relative aspect-square rounded-lg
                border-2 transition-all
                ${isSelected 
                  ? 'border-neon-cyan bg-neon-cyan/20 shadow-neon-cyan' 
                  : isEmpty
                    ? 'border-gray-700 bg-gray-900/50 opacity-50'
                    : 'border-gray-600 bg-dark-700 hover:border-neon-cyan/50'
                }
              `}
              whileHover={!isEmpty && !disabled ? { scale: 1.05 } : {}}
              whileTap={!isEmpty && !disabled ? { scale: 0.95 } : {}}
            >
              <div className="absolute inset-1">
                <Tile kind={kind} rotation={selectedRotation} />
              </div>
              
              {/* Count badge */}
              <div className={`
                absolute -top-1 -right-1 w-5 h-5 rounded-full
                flex items-center justify-center text-xs font-bold
                ${isEmpty ? 'bg-gray-700 text-gray-500' : 'bg-neon-cyan text-dark-900'}
              `}>
                {count}
              </div>
            </motion.button>
          );
        })}
      </div>
      
      {/* Rotation selector - only show when tile is selected */}
      {selectedTile && (
        <div className="mb-4">
          <label className="text-xs text-gray-400 mb-1 block">Rotation</label>
          <div className="flex gap-1">
            {ROTATIONS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setRotation(value)}
                disabled={disabled}
                className={`
                  flex-1 py-1 text-xs rounded
                  transition-colors
                  ${selectedRotation === value
                    ? 'bg-neon-cyan text-dark-900 font-bold'
                    : 'bg-dark-600 text-gray-400 hover:bg-dark-500'
                  }
                `}
              >
                {label}
              </button>
            ))}
          </div>
          <p className="text-xs text-neon-cyan mt-1 opacity-70">
            💡 Match cyan dots to connect tiles!
          </p>
        </div>
      )}
      
      {/* Action mode selector */}
      <div>
        <label className="text-xs text-gray-400 mb-1 block">Action</label>
        <div className="flex gap-1">
          <button
            onClick={() => setActionType('place')}
            disabled={disabled}
            className={`
              flex-1 py-2 text-xs rounded
              transition-colors
              ${actionType === 'place'
                ? 'bg-neon-green text-dark-900 font-bold'
                : 'bg-dark-600 text-gray-400 hover:bg-dark-500'
              }
            `}
          >
            Place
          </button>
          <button
            onClick={() => setActionType('rotate')}
            disabled={disabled}
            className={`
              flex-1 py-2 text-xs rounded
              transition-colors
              ${actionType === 'rotate'
                ? 'bg-neon-yellow text-dark-900 font-bold'
                : 'bg-dark-600 text-gray-400 hover:bg-dark-500'
              }
            `}
          >
            Rotate
          </button>
          <button
            onClick={() => setActionType('move_jammer')}
            disabled={disabled}
            className={`
              flex-1 py-2 text-xs rounded
              transition-colors
              ${actionType === 'move_jammer'
                ? 'bg-neon-red text-dark-900 font-bold'
                : 'bg-dark-600 text-gray-400 hover:bg-dark-500'
              }
            `}
          >
            Jammer
          </button>
        </div>
      </div>
      
      {/* Help text */}
      <p className="mt-3 text-xs text-gray-500">
        {actionType === 'place' && !selectedTile && 'Select a tile to place'}
        {actionType === 'place' && selectedTile && 'Click an empty cell to place'}
        {actionType === 'rotate' && 'Click a path tile to rotate it'}
        {actionType === 'move_jammer' && 'Click a jammer to move it'}
      </p>
    </div>
  );
};

export default TileInventory;
