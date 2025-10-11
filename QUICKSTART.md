# Quick Start Guide

This guide will help you get the NFT Ticket System frontend running quickly.

## For Developers Cloning This Repository

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Set Up Environment Variables

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your WalletConnect Project ID from https://cloud.walletconnect.com/

### 3. Run the Development Server

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

## Current Status

**Frontend**: ✓ Complete and ready
**Backend**: Pending - Smart contract needs to be deployed

The frontend is fully functional but requires backend integration:
- Smart contract deployment on Base Sepolia
- Contract address and ABI from backend team

See [BACKEND_REQUIREMENTS.md](BACKEND_REQUIREMENTS.md) for what the backend team needs to provide.

## IDE Errors?

Red/yellow errors in your IDE are normal before running `npm install`. The errors will disappear once dependencies are installed.

If errors persist after installation:
1. Restart your IDE
2. Reload the TypeScript server (VS Code: `Ctrl+Shift+P` → "TypeScript: Restart TS Server")

## Test the Application

1. Install MetaMask browser extension
2. Add Base Sepolia network to MetaMask
3. Get test ETH from https://www.coinbase.com/faucets/base-ethereum-goerli-faucet
4. Connect your wallet in the application
5. Try purchasing tickets (will fail until backend contract is deployed)

## Next Steps

- Backend team: Review [BACKEND_REQUIREMENTS.md](BACKEND_REQUIREMENTS.md)
- Frontend team: See [frontend/README.md](frontend/README.md) for detailed documentation
- All team members: Check the project [README.md](README.md) for overview

## Questions?

- Check the Troubleshooting section in [frontend/README.md](frontend/README.md)
- Review the backend requirements in [BACKEND_REQUIREMENTS.md](BACKEND_REQUIREMENTS.md)
- Open a GitHub issue for problems
