# NFT Ticket System - Frontend

A decentralized event ticketing system frontend built with Next.js 14 and Web3 stack, deployed on Base Sepolia testnet.

> **For Backend Team**: This frontend is ready to test! Follow the Quick Start Guide below to run it locally. No WalletConnect Project ID needed - just MetaMask wallet.

## Tech Stack

- **Framework**: Next.js 15 (App Router with Turbopack)
- **Blockchain Interaction**: Wagmi v2 + Viem
- **Wallet Connection**: RainbowKit
- **Styling**: Tailwind CSS v3
- **Language**: TypeScript
- **Network**: Base Sepolia Testnet

## Features

- ✅ Wallet connection (MetaMask via RainbowKit)
- ✅ Browse event information
- ✅ Purchase NFT tickets
- ✅ View owned tickets with beautiful card UI
- 🚧 Display ticket QR codes (pending backend support)
- 🚧 Ticket transfer functionality (in development)
- 🚧 Event verification system (in development)

## Quick Start Guide (for Backend Team Testing)

### Prerequisites

- **Node.js 18.x or higher** - [Download here](https://nodejs.org/)
- **MetaMask Browser Extension** - [Install here](https://metamask.io/)
- **Git** (to clone the repository)

### Step 1: Clone and Install

```bash
# Clone the repository
git clone https://github.com/abigail-langer/Web-3-NFT-Ticketing.git
cd Web-3-NFT-Ticketing

# Navigate to frontend directory
cd frontend

# Install dependencies
npm install
```

**Note**: If you see any dependency warnings, they're safe to ignore. The application is fully functional.

### Step 2: Configure Environment (Optional for Testing)

The frontend already has default configuration. For testing, you can skip this step or optionally create `.env.local`:

```bash
# Optional: Create environment file
cp .env.local.example .env.local
```

The `.env.local` should contain:
```env
# Contract address - UPDATE THIS after backend deployment
NEXT_PUBLIC_CONTRACT_ADDRESS=0x0000000000000000000000000000000000000000
```

**No WalletConnect Project ID needed!** The app works with MetaMask out of the box.

### Step 3: Run Development Server

```bash
npm run dev
```

The application will be available at:
- **Local**: http://localhost:3000
- **Network**: Check terminal output for network URL

Expected output:
```
✓ Ready in 1.5s
- Local:   http://localhost:3000
```

### Step 4: Configure MetaMask

**Add Base Sepolia Network to MetaMask:**

1. Open MetaMask
2. Click network dropdown (top of MetaMask)
3. Click "Add Network" → "Add a network manually"
4. Enter these details:

```
Network Name: Base Sepolia
RPC URL: https://sepolia.base.org
Chain ID: 84532
Currency Symbol: ETH
Block Explorer: https://sepolia.basescan.org
```

5. Click "Save"

**Get Test ETH:**
- Visit: https://www.coinbase.com/faucets/base-ethereum-goerli-faucet
- Connect your MetaMask wallet
- Request test ETH (you'll receive ~0.05 ETH)

### Step 5: Test the Frontend

1. **Open Browser**: Go to http://localhost:3000
2. **Connect Wallet**: Click "Connect Wallet" button (top right)
3. **Select MetaMask**: Choose MetaMask from the wallet options
4. **Approve Connection**: Click "Next" and "Connect" in MetaMask popup
5. **Switch Network**: MetaMask will prompt you to switch to Base Sepolia - click "Switch network"

You should now see:
- ✅ Wallet connected (address shown)
- ✅ Network: Base Sepolia (84532)
- ✅ Event information section
- ✅ My Tickets section

### Step 6: Integrate Your Smart Contract

**After deploying your smart contract**, update the frontend:

1. Open `frontend/app/page.tsx`
2. Find line ~41: `const CONTRACT_ADDRESS = '0x0000...'`
3. Replace with your deployed contract address:

```typescript
const CONTRACT_ADDRESS = '0xYOUR_DEPLOYED_CONTRACT_ADDRESS' as `0x${string}`;
```

4. Update the ABI (lines 8-39) with your contract's ABI
5. Save the file - the app will auto-reload

### Build for Production

```bash
# Build the application
npm run build

# Start production server
npm start
```

Production build will be available at http://localhost:3000

## Troubleshooting

### Common Issues and Solutions

#### 1. Port Already in Use

**Error**: `Port 3000 is in use`

**Solution**: The app will automatically use the next available port (3001, 3002, etc.). Check the terminal output for the actual URL.

Or manually specify a different port:
```bash
npm run dev -- -p 3001
```

#### 2. Module Not Found Errors

**Error**: `Cannot find module '@rainbow-me/rainbowkit'` or similar

**Solution**:
```bash
# Clean install
rm -rf node_modules package-lock.json .next
npm install
```

#### 3. Tailwind CSS Build Error

**Error**: `Cannot find module 'tailwindcss'` or PostCSS errors

**Solution**: This has been fixed in the current version. If you encounter it:
```bash
npm install -D tailwindcss@^3.4.0 postcss@^8.4.0 autoprefixer@^10.4.0
```

#### 4. Hot Reload Not Working

**Problem**: Changes to code don't reflect in browser

**Solution**:
```bash
# Stop the server (Ctrl+C)
# Clear Next.js cache
rm -rf .next
# Restart
npm run dev
```

#### 5. Wallet Connection Issues

**Problem**: MetaMask not connecting or wrong network

**Solution**:
- ✅ Make sure MetaMask extension is installed and unlocked
- ✅ Add Base Sepolia network to MetaMask (see Step 4 above)
- ✅ Switch to Base Sepolia in MetaMask before connecting
- ✅ Try refreshing the page after switching networks
- ✅ Check browser console for any errors (F12 → Console tab)

#### 6. Contract Interaction Fails

**Problem**: Transactions fail or show "execution reverted"

**Solution**:
- ✅ Verify the contract address is correct in `app/page.tsx` (line ~41)
- ✅ Ensure you're on Base Sepolia network (Chain ID: 84532)
- ✅ Confirm the smart contract is deployed and working
- ✅ Check you have sufficient Base Sepolia ETH (get from faucet)
- ✅ Verify the ABI matches your deployed contract

**Debug with Console**:
```javascript
// Open browser console (F12) and check:
console.log('Connected address:', address);
console.log('Chain ID:', chainId);
console.log('Contract address:', CONTRACT_ADDRESS);
```

#### 7. "Forbidden" Warnings in Console

**Warning**: `[Reown Config] Failed to fetch remote project configuration`

**This is safe to ignore!** It's just a warning about WalletConnect configuration. The app works perfectly with MetaMask without needing WalletConnect.

#### 8. TypeScript Errors in IDE

**Problem**: Red squiggly lines in code editor

**Solution**:
- The app will still run fine with TypeScript warnings
- Install dependencies: `npm install`
- Restart your IDE's TypeScript server
- In VSCode: `Ctrl+Shift+P` → "TypeScript: Restart TS Server"

### Getting Base Sepolia Test ETH

1. Visit the Base Sepolia faucet: https://www.coinbase.com/faucets/base-ethereum-goerli-faucet
2. Connect your wallet
3. Request test ETH
4. Wait for confirmation (usually 1-2 minutes)

## For Backend Team: Integration Guide

### What You Need to Provide

To integrate your smart contract with this frontend, you need to provide:

1. **Contract Address** - Your deployed contract address on Base Sepolia
2. **Contract ABI** - The complete ABI JSON from your compiled contract
3. **Function Names** - Confirm the exact function names match what frontend expects

### Expected Contract Interface

The frontend expects these functions (adjust if your contract differs):

**Read Functions:**
```solidity
function getEventInfo(uint256 eventId) external view returns (
    string memory name,
    uint256 price,
    uint256 maxTickets,
    uint256 ticketsSold
);

function getOwnedTickets(address owner) external view returns (uint256[] memory);
```

**Write Functions:**
```solidity
function purchaseTicket(uint256 eventId, uint256 quantity) external payable;
```

### How to Integrate Your Contract

**Step 1: Update Contract Address**

Open `frontend/app/page.tsx` and find line ~41:

```typescript
// BEFORE
const CONTRACT_ADDRESS = '0x0000000000000000000000000000000000000000' as `0x${string}`;

// AFTER - Replace with your deployed address
const CONTRACT_ADDRESS = '0xYourDeployedContractAddress' as `0x${string}`;
```

**Step 2: Update Contract ABI**

Replace the ABI in `frontend/app/page.tsx` (lines 8-39) with your contract's ABI:

```typescript
const TICKET_CONTRACT_ABI = [
  // Paste your complete ABI here
  // You can find it in artifacts/contracts/YourContract.sol/YourContract.json
];
```

**Step 3: Test the Integration**

1. Save the file - Next.js will auto-reload
2. Refresh browser at http://localhost:3000
3. Connect MetaMask wallet
4. Try purchasing a ticket
5. Check "My Tickets" section

**Step 4: Verify on Block Explorer**

Visit [Base Sepolia Explorer](https://sepolia.basescan.org) and search for:
- Your contract address
- Transaction hashes
- Token transfers

### Testing Checklist for Backend Team

- [ ] Contract deployed to Base Sepolia testnet
- [ ] Contract address updated in `app/page.tsx`
- [ ] ABI updated in `app/page.tsx`
- [ ] Frontend runs without errors (`npm run dev`)
- [ ] Wallet connects successfully
- [ ] Can view event information (if applicable)
- [ ] Can purchase tickets (transaction succeeds)
- [ ] Tickets appear in "My Tickets" section
- [ ] Can verify tickets on Base Sepolia explorer

### Alternative Testing Component

There's also a standalone admin/testing component at `components/TicketUI.tsx` that provides:
- Create events (owner only)
- Mint tickets (owner only)
- Verify ticket ownership
- Check ticket validity

To use it, import and render it in any page:
```typescript
import TicketUI from '@/components/TicketUI';

// In your component
<TicketUI />
```

## Project Structure

```
frontend/
├── app/
│   ├── layout.tsx          # Root layout with metadata
│   ├── page.tsx            # Main page - event browsing, ticket purchase & management
│   ├── providers.tsx       # Web3 Provider (Wagmi + RainbowKit)
│   └── globals.css         # Global Tailwind CSS styles
├── components/
│   └── TicketUI.tsx        # Admin/testing component (optional)
├── public/                 # Static assets (images, fonts, etc.)
├── .env.local              # Environment variables (gitignored)
├── .env.local.example      # Example env file
├── package.json            # Dependencies and scripts
├── tsconfig.json           # TypeScript configuration
├── next.config.js          # Next.js configuration
├── tailwind.config.js      # Tailwind CSS configuration
├── postcss.config.js       # PostCSS configuration
└── README.md               # This file
```

## Technology Stack Details

### Frontend Framework
- **Next.js 15** with App Router and Turbopack for fast refresh
- **React 18** with Server and Client Components
- **TypeScript 5** for type safety

### Web3 Libraries
- **Wagmi v2** - React Hooks for Ethereum
- **Viem** - TypeScript Ethereum library
- **RainbowKit** - Beautiful wallet connection UI

### Styling
- **Tailwind CSS v3** - Utility-first CSS framework
- **PostCSS** - CSS processing
- Custom gradient backgrounds and glass-morphism effects

### Network
- **Base Sepolia Testnet** (Chain ID: 84532)
- Powered by Optimism's OP Stack
- Low gas fees, fast confirmation times

## Base Sepolia Testnet Configuration

- **Chain ID**: 84532
- **RPC URL**: https://sepolia.base.org
- **Block Explorer**: https://sepolia.basescan.org
- **Faucet**: https://www.coinbase.com/faucets/base-ethereum-goerli-faucet

## Development Roadmap

### Phase 1: Core Features (✅ Complete)
- [x] Wallet connection with MetaMask
- [x] Base Sepolia network integration
- [x] Event information display
- [x] Ticket purchase interface
- [x] View owned tickets
- [x] Beautiful UI with Tailwind CSS

### Phase 2: Backend Integration (🚧 In Progress)
- [ ] Backend provides complete contract ABI
- [ ] Update CONTRACT_ADDRESS with deployed contract
- [ ] Test end-to-end ticket purchasing
- [ ] Verify ticket ownership queries

### Phase 3: Enhanced Features (📋 Planned)
- [ ] QR code generation for tickets
- [ ] Ticket verification system
- [ ] Event listing page (browse all events)
- [ ] Ticket transfer functionality
- [ ] Transaction history
- [ ] Event creation UI (for organizers)
- [ ] Ticket metadata display (IPFS integration)

### Phase 4: Production Ready (📋 Planned)
- [ ] Mobile responsive optimization
- [ ] Error handling improvements
- [ ] Loading states and animations
- [ ] Deploy to production (Vercel/Netlify)
- [ ] Production environment configuration

## Contributing

Contributions are welcome! If you find any issues or want to add features:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Support

For questions or issues:
- Open an issue on GitHub
- Check the Troubleshooting section above
- Review Base Sepolia documentation: https://docs.base.org

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Wagmi Documentation](https://wagmi.sh)
- [RainbowKit Documentation](https://rainbowkit.com)
- [Base Network Documentation](https://docs.base.org)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Viem Documentation](https://viem.sh)

## Acknowledgments

Special thanks to **Claude Code** (Anthropic's AI assistant) for helping debug and fix local development environment errors, including:
- Resolving Tailwind CSS v4 compatibility issues
- Fixing module import errors
- Configuring the development environment for seamless testing

This assistance enabled the frontend to run smoothly out of the box for the backend team.

## License

MIT License - feel free to use this project for learning or building your own NFT ticketing system!
