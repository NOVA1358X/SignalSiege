# ⚡ SignalSiege

<div align="center">

![SignalSiege Banner](https://img.shields.io/badge/SignalSiege-Blockchain%20Game-00ffff?style=for-the-badge&logo=ethereum&logoColor=white)

**A Strategic Circuit-Building Game on Linera Blockchain**

[![Linera](https://img.shields.io/badge/Built%20on-Linera-ff00ff?style=flat-square)](https://linera.io)
[![Rust](https://img.shields.io/badge/Smart%20Contract-Rust-orange?style=flat-square&logo=rust)](https://rust-lang.org)
[![React](https://img.shields.io/badge/Frontend-React%20+%20TypeScript-blue?style=flat-square&logo=react)](https://reactjs.org)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

[Play Now](#quick-start) • [How to Play](#how-to-play) • [Architecture](#architecture) • [Documentation](#documentation)

</div>

---

## 🎮 What is SignalSiege?

SignalSiege is a **strategic puzzle game** where players build circuit paths to connect power sources to receivers. Built on the **Linera blockchain**, every move is recorded on-chain with true cross-chain multiplayer capabilities.

### 🌟 Key Features

| Feature | Description |
|---------|-------------|
| 🔗 **On-Chain Gameplay** | Every tile placement, rotation, and game action is a blockchain transaction |
| ⚡ **Cross-Chain Multiplayer** | Players on different Linera chains can battle in real-time |
| 🎰 **Stake & Wager** | Bet your in-game coins on PvP matches |
| 🧩 **Daily Puzzles** | Solve procedurally generated puzzles for rewards |
| 🤖 **Training Mode** | Practice against AI to improve your skills |
| 🪙 **Daily Rewards** | Claim free coins every day |

---

## 🎯 Game Modes

### 1. 🎓 Training Mode (vs AI)
Practice your circuit-building skills against a smart AI opponent. Perfect for learning game mechanics without risking coins.

- No coins required
- AI adapts to your skill level
- Learn tile placement strategies

### 2. ⚔️ PvP Multiplayer
Challenge other players in real-time cross-chain battles!

- **Create a Room**: Set a map and optional stake amount
- **Share Chain ID**: Send your Chain ID to a friend
- **Battle**: Take turns placing tiles to complete your circuit first
- **Win Stakes**: Winner takes all staked coins!

### 3. 🧩 Daily Puzzle
Each day brings a new puzzle challenge:

- Unique puzzle generated daily
- Complete for coin rewards
- One attempt per day
- Leaderboard rankings

---

## 🕹️ How to Play

### Basic Mechanics

The game is played on a **7x7 grid** board with two sides:
- **Blue Side (Top)**: Player 1's power source and receiver
- **Pink Side (Bottom)**: Player 2's power source and receiver

### Goal
Build a complete circuit path from your **Power Source** ⚡ to your **Receiver** 📡 before your opponent!

### Tile Types

| Tile | Name | Description |
|------|------|-------------|
| ║ | **Straight Wire** | Connects two opposite sides |
| ╔ | **Corner Wire** | Makes a 90° turn |
| ╠ | **T-Junction** | Splits signal three ways |
| ╬ | **Crossroad** | Four-way intersection |
| 🏔️ | **Obstacle** | Cannot be removed or modified |
| 📶 | **Jammer** | Blocks signal flow (can be moved) |

### Actions Per Turn

Each turn you can perform **ONE** action:

1. **Place Tile** 🔧
   - Select a tile from your inventory
   - Choose rotation (0°, 90°, 180°, 270°)
   - Click an empty cell to place

2. **Rotate Tile** 🔄
   - Click any existing path tile on the board
   - Rotates 90° clockwise

3. **Move Jammer** 📍
   - Click a jammer tile
   - Move it to any empty cell

### Winning

The game ends when:
- ✅ A player completes their circuit (connects source to receiver)
- ❌ A player forfeits
- 🏁 Maximum turns reached (tie)

### Signal Propagation

When you complete a circuit:
1. Signal flows from your Power Source
2. Travels through connected wire tiles
3. Must reach your Receiver
4. Path is highlighted with animation

---

## 🏗️ Architecture

### Tech Stack

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND                                │
│  React + TypeScript + Vite + TailwindCSS + Framer Motion   │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ GraphQL Mutations/Queries
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    LINERA CLIENT (WASM)                     │
│              @anthropic/linera-client SDK                    │
│                   Auto-Signer Wallet                         │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ Cross-Chain Messages
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   SMART CONTRACT (Rust)                      │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Players    │  │  Game Rooms  │  │   Puzzles    │      │
│  │   Profiles   │  │   & State    │  │   & Daily    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Escrow     │  │   Training   │  │  Leaderboard │      │
│  │   System     │  │   Matches    │  │   Rankings   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    LINERA BLOCKCHAIN                         │
│                                                              │
│   Chain A ←──── Cross-Chain Messages ────→ Chain B          │
│   (Host)                                    (Joiner)         │
│                                                              │
│                    Hub Chain (Escrow)                        │
└─────────────────────────────────────────────────────────────┘
```

### Cross-Chain Messaging Flow

```
Player 1 (Chain A)                    Player 2 (Chain B)
      │                                      │
      │ CreateRoom(stake: 20)                │
      ├──────────────────────────────────────►
      │        Message::EscrowOpen           │
      │                                      │
      │                                      │ JoinRoom(hostChainId)
      │◄──────────────────────────────────────
      │        Message::JoinRequest          │
      │                                      │
      │ GameStateSync ─────────────────────► │
      │                                      │
      │◄───── PlayTurn ──────────────────────│
      │        Message::TurnPlayed           │
      │                                      │
      │ Game continues...                    │
      │                                      │
      │ GameFinished ───────────────────────►│
      │        Message::GameResult           │
      │                                      │
      │ ◄───── Escrow Release ──────────────►│
```

---

## 🔗 Why Linera?

### Benefits of Building on Linera

| Benefit | Description |
|---------|-------------|
| ⚡ **Instant Finality** | Transactions confirm in milliseconds, enabling real-time gameplay |
| 🔀 **Multi-Chain Architecture** | Each player operates on their own chain for parallel processing |
| 💰 **Low Fees** | Micro-chains enable cost-effective per-move transactions |
| 🌐 **Cross-Chain Communication** | Native support for cross-chain messages between players |
| 🔒 **Decentralized State** | Game state is fully on-chain and verifiable |
| 📈 **Scalability** | Horizontal scaling through multiple chains |

### Linera-Specific Features Used

1. **Micro-Chains**: Each player gets their own chain for game operations
2. **Cross-Chain Messages**: Real-time game state sync between players
3. **Auto-Signer**: Seamless transaction signing for smooth gameplay
4. **Hub Chain**: Centralized escrow management for stakes

---

## 📁 Project Structure

```
SignalSiege/
├── contracts/
│   └── signalsiege/
│       ├── src/
│       │   ├── contract.rs    # Main contract logic
│       │   ├── service.rs     # GraphQL query handlers
│       │   ├── state.rs       # On-chain state definitions
│       │   └── lib.rs         # Module exports
│       └── Cargo.toml
│
├── frontend/
│   ├── src/
│   │   ├── components/        # React components
│   │   │   ├── GameBoard.tsx
│   │   │   ├── TileInventory.tsx
│   │   │   ├── GameHeader.tsx
│   │   │   └── Tile.tsx
│   │   ├── pages/             # Page components
│   │   │   ├── LandingPage.tsx
│   │   │   ├── LobbyPage.tsx
│   │   │   ├── MatchPage.tsx
│   │   │   ├── ProfilePage.tsx
│   │   │   ├── PvEPage.tsx
│   │   │   └── PuzzlePage.tsx
│   │   ├── stores/            # Zustand state stores
│   │   │   ├── lineraStore.ts
│   │   │   └── gameStore.ts
│   │   ├── lib/
│   │   │   ├── linera/        # Linera SDK integration
│   │   │   ├── gameApi.ts     # Game API functions
│   │   │   └── types.ts       # TypeScript types
│   │   └── hooks/             # Custom React hooks
│   ├── public/
│   └── package.json
│
├── Cargo.toml                  # Workspace config
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Rust toolchain with `wasm32-unknown-unknown` target
- Linera CLI (optional, for contract deployment)

### Frontend Setup

```bash
# Clone the repository
git clone https://github.com/YourUsername/SignalSiege.git
cd SignalSiege/frontend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Start development server
npm run dev
```

### Environment Variables

Create a `.env` file in the `frontend` directory:

```env
VITE_DYNAMIC_ENVIRONMENT_ID=your_dynamic_environment_id
VITE_LINERA_FAUCET_URL=https://faucet.testnet-conway.linera.net
VITE_APPLICATION_ID=your_deployed_application_id
VITE_HUB_CHAIN_ID=your_hub_chain_id
```

### Contract Deployment (Advanced)

```bash
# Build the contract
cargo build --release --target wasm32-unknown-unknown -p signalsiege

# Deploy to Linera
linera publish-and-create \
  target/wasm32-unknown-unknown/release/signalsiege_contract.wasm \
  target/wasm32-unknown-unknown/release/signalsiege_service.wasm \
  YOUR_HUB_CHAIN_ID \
  --json-argument '{"hub_chain_id": "YOUR_HUB_CHAIN_ID"}'
```

---

## 📱 Pages & Features

### 🏠 Landing Page
- Quick Play button for instant game access
- Connect wallet with auto-signer generation
- Link EVM wallet for enhanced features

### 🎮 Game Lobby
- Create PvP match with map selection
- Set optional stake amount
- Join existing room via Chain ID
- View current balance

### ⚔️ Match Page
- Interactive 7x7 game board
- Real-time turn indicator
- Tile inventory with rotation
- Signal path visualization
- Forfeit option

### 👤 Profile Page
- View game statistics (wins/losses/draws)
- Claim daily coin rewards
- Link/unlink EVM wallet
- View chain information

### 🎓 Training Page
- Practice against AI
- No stakes required
- Learn game mechanics

### 🧩 Puzzle Page
- Daily puzzle challenge
- Timed completion
- Reward system

---

## 🔒 Smart Contract Operations

### Mutations (Write Operations)

| Operation | Description |
|-----------|-------------|
| `register` | Create player profile |
| `claimDaily` | Claim daily coin reward |
| `createRoom` | Create PvP match room |
| `joinRoom` | Join existing room |
| `playTurn` | Execute game move |
| `forfeit` | Surrender match |
| `startTraining` | Begin AI match |
| `startPuzzle` | Begin daily puzzle |

### Queries (Read Operations)

| Query | Description |
|-------|-------------|
| `myProfile` | Get current player profile |
| `room` | Get current room state |
| `training` | Get training match state |
| `puzzle` | Get puzzle state |
| `leaderboard` | Get top players |
| `canClaimDaily` | Check daily claim status |

---

## 🎨 UI/UX Features

- **Neon Cyberpunk Theme**: Vibrant colors with dark mode
- **Smooth Animations**: Framer Motion transitions
- **Responsive Design**: Works on desktop and mobile
- **Signal Pulse Animation**: Visual feedback on circuit completion
- **Real-time Updates**: Polling for opponent moves

---

## 🛠️ Development

### Tech Stack Details

| Technology | Purpose |
|------------|---------|
| **React 18** | UI framework |
| **TypeScript** | Type safety |
| **Vite** | Build tool |
| **TailwindCSS** | Styling |
| **Framer Motion** | Animations |
| **Zustand** | State management |
| **@anthropic/linera-client** | Linera blockchain SDK |
| **Dynamic.xyz** | Web3 wallet auth |

### Building for Production

```bash
cd frontend
npm run build
```

---

## 🌐 Deployment

### Vercel Deployment

1. Connect your GitHub repository to Vercel
2. Set the root directory to `frontend`
3. Add environment variables in Vercel dashboard
4. Deploy!

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## 📞 Contact

- **GitHub**: [@NOVA1358X](https://github.com/NOVA1358X)
- **Project**: [SignalSiege](https://github.com/NOVA1358X/SignalSiege)

---

<div align="center">

**Built with ⚡ on Linera**

</div>
