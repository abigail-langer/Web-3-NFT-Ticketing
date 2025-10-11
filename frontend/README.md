# NFT Ticket System - Frontend

A decentralized event ticketing system frontend built with Next.js 14 and Web3 stack, deployed on Base Sepolia testnet.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Blockchain Interaction**: Wagmi v2 + Viem
- **Wallet Connection**: RainbowKit
- **Styling**: Tailwind CSS
- **Language**: TypeScript
- **Network**: Base Sepolia Testnet

## Features

- Wallet connection (MetaMask, WalletConnect, etc.)
- Browse event information
- Purchase NFT tickets
- View owned tickets
- Display ticket QR codes (pending backend support)
- Ticket transfer functionality (in development)
- Event verification system (in development)

## Installation and Setup

### Prerequisites

- Node.js 18.x or higher
- npm or yarn package manager
- MetaMask or another Web3 wallet

### Step 1: Install Dependencies

```bash
cd frontend
npm install
```

If you encounter any errors during installation, try:

```bash
npm install --legacy-peer-deps
```

### Step 2: Configure Environment Variables

1. Copy the example environment file:
```bash
cp .env.example .env.local
```

2. Edit `.env.local` and add your values:
```env
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here
NEXT_PUBLIC_CONTRACT_ADDRESS=0x0000000000000000000000000000000000000000
```

**How to get WalletConnect Project ID:**
- Visit https://cloud.walletconnect.com/
- Sign up for a free account
- Create a new project
- Copy your Project ID

**Note**: The contract address is currently a placeholder. Update it once the backend team deploys the smart contract.

### Step 3: Run Development Server

```bash
npm run dev
```

The application will be available at http://localhost:3000

### Step 4: Build for Production

```bash
npm run build
npm start
```

## Troubleshooting

### Common Issues and Solutions

#### 1. TypeScript Errors in IDE

If you see red errors in `page.tsx`, `providers.tsx`, or `TicketUI.tsx`:

**Solution**: Install dependencies first
```bash
npm install
```

After installation, the TypeScript server should recognize all types. If errors persist, restart your IDE or TypeScript server.

#### 2. Module Not Found Errors

**Error**: `Cannot find module '@rainbow-me/rainbowkit'` or similar

**Solution**:
```bash
rm -rf node_modules package-lock.json
npm install
```

#### 3. Tailwind CSS Warnings in globals.css

**Solution**: The globals.css file uses Tailwind's `@layer` directive to prevent conflicts. This is the correct approach and warnings can be ignored.

#### 4. Wallet Connection Issues

**Problem**: Wallet doesn't connect or shows wrong network

**Solution**:
- Make sure MetaMask is installed
- Switch to Base Sepolia network in MetaMask
- Add Base Sepolia network manually if needed:
  - Network Name: Base Sepolia
  - RPC URL: https://sepolia.base.org
  - Chain ID: 84532
  - Currency Symbol: ETH
  - Block Explorer: https://sepolia.basescan.org

#### 5. Contract Interaction Fails

**Problem**: Transactions fail or contract calls return errors

**Solution**:
- Verify the contract address is correct in `app/page.tsx` (line 42)
- Ensure you're connected to Base Sepolia network
- Make sure the backend smart contract is deployed
- Check you have sufficient Base Sepolia ETH (get from faucet)

#### 6. Build Errors

**Error**: Build fails with dependency issues

**Solution**:
```bash
npm run build -- --no-lint
```

Or fix TypeScript errors first:
```bash
npm run lint
```

### Getting Base Sepolia Test ETH

1. Visit the Base Sepolia faucet: https://www.coinbase.com/faucets/base-ethereum-goerli-faucet
2. Connect your wallet
3. Request test ETH
4. Wait for confirmation (usually 1-2 minutes)

### Updating Contract Configuration

When the backend team provides the contract address and ABI:

1. Open `app/page.tsx`
2. Update line 42:
```typescript
const CONTRACT_ADDRESS = '0xYOUR_CONTRACT_ADDRESS_HERE' as `0x${string}`;
```

3. Update the ABI (lines 8-39) with the complete ABI provided by backend

4. If needed, update `app/providers.tsx` with the WalletConnect Project ID (line 12)

## Project Structure

```
frontend/
├── app/
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Main page - purchase and manage tickets
│   ├── providers.tsx       # Web3 Provider configuration
│   └── globals.css         # Global styles
├── components/
│   └── TicketUI.tsx        # Ticket display component
├── public/                 # Static assets
├── package.json
├── tsconfig.json
├── next.config.js
└── tailwind.config.js
```

## Smart Contract Integration

The frontend is prepared with the following contract interfaces:

### Read Functions
- `getEventInfo(eventId)` - Get event information
- `getOwnedTickets(owner)` - Get user's owned tickets

### Write Functions
- `purchaseTicket(eventId, quantity)` - Purchase tickets

**Note**: Backend team needs to provide:
1. Complete smart contract ABI
2. Contract address deployed on Base Sepolia
3. Specific contract function signatures

See [BACKEND_REQUIREMENTS.md](../BACKEND_REQUIREMENTS.md) for details.

## Base Sepolia Testnet Configuration

- **Chain ID**: 84532
- **RPC URL**: https://sepolia.base.org
- **Block Explorer**: https://sepolia.basescan.org
- **Faucet**: https://www.coinbase.com/faucets/base-ethereum-goerli-faucet

## Todo List

- [ ] Backend provides complete contract ABI
- [ ] Update CONTRACT_ADDRESS
- [ ] Backend provides ticket metadata API
- [ ] Implement QR code generation and verification
- [ ] Add event listing page
- [ ] Implement ticket transfer functionality
- [ ] Add transaction history
- [ ] Optimize mobile experience

## Backend Integration

Please refer to [BACKEND_REQUIREMENTS.md](../BACKEND_REQUIREMENTS.md) for detailed backend requirements.

## License

MIT
