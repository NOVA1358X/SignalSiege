# ⚡ SignalSiege - Strategic Signal Warfare on Linera

## 🎮 Overview

SignalSiege is a fully on-chain strategic circuit-building PvP game on Linera Protocol. Players compete on a 7×7 grid, racing to connect their Power Source to Receiver by placing wire tiles, rotating paths, and deploying jammers to block opponents.

**🌐 Live:** https://signal-siege.vercel.app

## ⚡ Core Features

### 🔗 100% On-Chain Gameplay
Every move is a blockchain transaction. Game state is fully verifiable and tamper-proof with no centralized servers.

### 🌐 True Cross-Chain Multiplayer
Players battle from different Linera microchains with real-time state sync via cross-chain messages.

### 🤖 Auto-Signer (Smooth UX)
Browser WASM wallet with automatic transaction signing. No popups—Web2 smoothness with Web3 security.

### 💰 Stake & Wager System
Create rooms with coin stakes. Escrow-protected wagers on Hub Chain. Winner takes all—fully trustless.

### 🎯 Multiple Game Modes
- **PvP Multiplayer**: Real-time battles with stakes
- **Training Mode**: Practice against AI
- **Daily Puzzles**: Fresh challenges with rewards

## 🕹️ Gameplay

### Battlefield
7×7 grid with Power Sources and Receivers on opposite sides. Blue (top) vs Pink (bottom).

### Tiles
| Tile | Function |
|------|----------|
| Straight Wire | Connects opposite sides |
| Corner Wire | 90° signal turn |
| T-Junction | 3-way split |
| Crossroad | 4-way intersection |
| Jammer | Blocks enemy signals |

### Turn Actions (Pick ONE)
1. **Place Tile**: Deploy with rotation (0°/90°/180°/270°)
2. **Rotate Tile**: Turn existing tile 90° clockwise
3. **Move Jammer**: Relocate to block opponent

### Victory
Complete your circuit first, opponent forfeits, or better position at max turns.

## 🏗️ Architecture

### Stack
- Frontend: React 18 + TypeScript + Vite + TailwindCSS
- Contract: Rust on Linera
- Client: @linera/client WASM SDK (in-browser)

### Linera Integration

```
┌─────────────────────────────────────┐
│     BROWSER (Player Chain)          │
│  React ←→ WASM Client + AutoSigner  │
└─────────────────────────────────────┘
              ↓ GraphQL
┌─────────────────────────────────────┐
│      LINERA SMART CONTRACT          │
│  Profiles • Rooms • Moves • Escrow  │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│       LINERA MICROCHAINS            │
│  Chain A ←→ Hub ←→ Chain B          │
└─────────────────────────────────────┘
```

### Cross-Chain PvP Flow
1. Player A creates room → Opens escrow on Hub
2. Player B joins via Chain ID → Stakes to escrow
3. Game syncs across both chains
4. Each turn broadcasts as cross-chain message
5. Winner detected → Escrow releases to victor

## 📱 Pages

| Page | Description |
|------|-------------|
| Landing | Connect wallet, features |
| Lobby | Create/join rooms |
| Match | Live 7×7 gameplay |
| Profile | Stats, coins, daily claim |
| Training | AI practice |
| Puzzle | Daily challenge |

## 🔐 Security

- Trustless escrow held by contract
- All moves stored on-chain
- Contract validates every action
- No cheating possible

## 🎯 Linera Features Used

| Feature | Usage |
|---------|-------|
| Microchains | Each player's own chain |
| Cross-Chain Messages | Real-time game sync |
| Hub Chain | Escrow management |
| WASM Client | Browser chain interaction |
| Auto-Signer | Popup-free transactions |
| Instant Finality | Sub-second confirmation |

## 🚀 What Makes Us Different

1. **No Backend**: Pure client-to-blockchain
2. **Real-Time PvP**: Not async turn-based
3. **Economic Stakes**: Meaningful competition
4. **Smooth UX**: Auto-signing removes friction
5. **Scalable**: Multi-chain handles unlimited games

## 🛠️ Built With

Linera Protocol • Rust Contracts • React + TypeScript • @linera/client WASM • Dynamic.xyz • Vercel

---

**SignalSiege proves blockchain games don't choose between decentralization and UX. Linera delivers both.**

⚡ *Connect. Strategize. Dominate.* ⚡
