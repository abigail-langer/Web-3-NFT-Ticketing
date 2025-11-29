# NFT Ticket System

A decentralized event ticketing platform built on Base Sepolia testnet using blockchain technology and NFTs.

## Project Structure

```
web3-nft-ticket/
├── frontend/           # Next.js frontend application
│   ├── app/           # Next.js app directory
│   ├── components/    # React components
│   └── README.md      # Frontend documentation
├── backend/           # Smart contracts (to be implemented)
└── BACKEND_REQUIREMENTS.md  # Backend development requirements
```

## Features

- NFT-based event tickets on Base Sepolia
- Wallet connection with RainbowKit
- Purchase and manage tickets
- View owned NFT tickets
- QR code verification (planned)
- Ticket transfer functionality (planned)

## Getting Started

### Frontend Setup

Navigate to the frontend directory and follow the instructions in [frontend/README.md](frontend/README.md)

```bash
cd frontend
npm install
npm run dev
```

### Backend Requirements

The backend smart contract needs to be developed. See [BACKEND_REQUIREMENTS.md](BACKEND_REQUIREMENTS.md) for detailed specifications.

## Technology Stack

**Frontend:**
- Next.js 14
- React 18
- Wagmi v2
- RainbowKit
- Tailwind CSS
- TypeScript

**Blockchain:**
- Base Sepolia Testnet
- ERC-721 NFT Standard
- Solidity (backend)

## Network Information

- **Network**: Base Sepolia
- **Chain ID**: 84532
- **RPC URL**: https://sepolia.base.org
- **Block Explorer**: https://sepolia.basescan.org
- **Faucet**: https://www.coinbase.com/faucets/base-ethereum-goerli-faucet

## Development Status

- [x] Frontend UI implementation
- [x] Wallet connection setup
- [x] Contract interface design
- [ ] Smart contract development (backend team)
- [ ] Contract deployment
- [ ] Frontend-backend integration
- [ ] QR code generation
- [ ] Ticket verification system

## Contributing

This project is a collaborative effort between frontend and backend developers. Please refer to the respective documentation for contribution guidelines.

## License

MIT
