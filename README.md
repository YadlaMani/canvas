# Canvas - Web3 Pixel Art Platform

A collaborative pixel art canvas built on the **Monad blockchain** where users can own and customize individual pixels using cryptocurrency. Experience the future of decentralized digital art on Monad's high-performance EVM-compatible Layer 1 network.

## Checkout here: https://canvas-monad.vercel.app/

## Screenshot

![WhatsApp Image 2025-08-02 at 16 29 26_2679b5a9](https://github.com/user-attachments/assets/109f2d54-51ea-4163-aee2-c6e5cf2ab0ce)

## 🎨 Features

- **Interactive Pixel Canvas**: 300x100 pixel grid with smooth zooming and panning
- **Monad Blockchain Integration**: Built specifically for Monad's high-performance network
- **Web3 Wallet Connection**: Seamless integration via Reown AppKit with Monad testnet
- **Crypto Pixel Ownership**: Purchase and customize pixels with 0.1 MON per transaction
- **On-Chain Transactions**: All pixel changes are recorded on the Monad blockchain
- **Real-time Updates**: Live pixel changes with MongoDB persistence and blockchain verification
- **Leaderboard System**: Track top pixel owners and recent blockchain activity
- **Responsive Design**: Mobile-friendly interface with dark/light theme support

## 🛠 Tech Stack

### Frontend

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Radix UI** - Accessible component primitives
- **React Canvas** - High-performance pixel rendering

### Web3 & Blockchain

- **Monad Testnet** - High-performance EVM-compatible Layer 1 blockchain
- **MON Token** - Native cryptocurrency for pixel transactions (0.1 MON per pixel)
- **Reown AppKit** - Wallet connection and Web3 integration optimized for Monad
- **Wagmi** - React hooks for Ethereum-compatible blockchain interactions
- **Viem** - TypeScript library for Monad blockchain operations
- **On-Chain Verification** - All pixel ownership changes recorded on Monad blockchain

### Backend & Database

- **MongoDB** - Pixel data persistence
- **Mongoose** - Object modeling for Node.js
- **Server Actions** - Next.js server-side functions

### UI/UX

- **Lucide React** - Icon library
- **Sonner** - Toast notifications
- **Next Themes** - Theme switching

## 🎮 How to Use

1. **Connect Wallet**: Click "Connect Wallet" and connect to Monad testnet
2. **Fund Wallet**: Ensure you have MON tokens for pixel transactions
3. **Browse Canvas**: Navigate the pixel grid using mouse controls (zoom with scroll wheel)
4. **Select Pixel**: Click on any pixel to view details and current ownership
5. **Purchase & Customize**: Pay 0.1 MON to change a pixel's color (transaction processed on Monad)
6. **Track Activity**: View recent blockchain edits and pixel ownership leaderboard

## 📁 Project Structure

```
src/
├── actions/          # Server actions for canvas operations
├── app/             # Next.js app router pages
├── components/      # React components
│   ├── ui/         # Reusable UI components
│   └── ...         # Feature-specific components
├── config/         # Web3 and app configuration
├── context/        # React context providers
├── hooks/          # Custom React hooks
├── lib/            # Utility functions
├── models/         # MongoDB data models
└── utils/          # Database connection utilities
```

## 🔧 Key Components

- **Canvas Engine**: Custom pixel rendering with zoom/pan controls
- **Monad Integration**: Direct blockchain interaction for pixel transactions
- **Wallet Connection**: Seamless Web3 wallet integration for Monad network
- **Payment System**: MON cryptocurrency transactions for pixel ownership
- **Blockchain Verification**: On-chain validation of all pixel changes
- **Real-time Sync**: Live updates across users with blockchain state consistency
- **Theme System**: Dynamic light/dark mode switching

## 🌐 Deployment

The application is optimized for deployment on Vercel with:

- **MongoDB Atlas** for pixel data persistence
- **Monad Testnet** for blockchain operations
- **Environment variables** for Monad network configuration
- **Reown Project ID** for Web3 wallet integration

### Monad Network Setup

Ensure your deployment environment includes:

- Monad testnet RPC endpoints
- MON token contract addresses
- Proper network configurations for Monad blockchain interactions

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

## 📄 License

This project is open source and available under the MIT License.
