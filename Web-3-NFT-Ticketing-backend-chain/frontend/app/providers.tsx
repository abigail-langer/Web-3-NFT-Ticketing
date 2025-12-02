"use client";

// Base Sepolia Network Configuration
import "@rainbow-me/rainbowkit/styles.css";
import { RainbowKitProvider, connectorsForWallets } from "@rainbow-me/rainbowkit";
import {
  injectedWallet,
  metaMaskWallet,
  rainbowWallet,
  walletConnectWallet,
  coinbaseWallet,
} from "@rainbow-me/rainbowkit/wallets";
import { WagmiProvider, createConfig, http } from "wagmi";
import { baseSepolia } from "wagmi/chains";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;
const baseSepoliaRpcUrl = process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL?.trim();

// Only enable WalletConnect when a valid 32-character projectId is provided
const enableWalletConnect = typeof projectId === 'string' && projectId.length === 32;

const walletGroups = [
  {
    groupName: 'Suggested',
    wallets: [
      // Always support injected wallets (e.g., MetaMask extension)
      injectedWallet,
      // Only include WalletConnect-dependent wallets when projectId is provided
      ...(
        enableWalletConnect
          ? [metaMaskWallet, rainbowWallet, coinbaseWallet]
          : []
      ),
    ],
  },
  // Conditionally include WalletConnect standalone option
  ...(
    enableWalletConnect
      ? [
          {
            groupName: 'Other',
            wallets: [walletConnectWallet],
          },
        ]
      : []
  ),
];

const connectors = connectorsForWallets(
  walletGroups,
  // If WalletConnect is disabled, omit projectId to avoid remote config fetches
  enableWalletConnect
    ? { appName: 'NFT Ticket System', projectId }
    : ({ appName: 'NFT Ticket System' } as any)
);


// Explicitly create the wagmi config
const config = createConfig({
  connectors,
  chains: [baseSepolia],
  transports: {
    [baseSepolia.id]: http(baseSepoliaRpcUrl && baseSepoliaRpcUrl.length > 0 ? baseSepoliaRpcUrl : "https://sepolia.base.org"),
  },
  ssr: true,
});


const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>{mounted && children}</RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

