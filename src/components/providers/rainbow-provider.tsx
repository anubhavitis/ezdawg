"use client";

import "@rainbow-me/rainbowkit/styles.css";
import {
  connectorsForWallets,
  RainbowKitProvider,
} from "@rainbow-me/rainbowkit";
import { createConfig, http, WagmiProvider } from "wagmi";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { arbitrum } from "wagmi/chains";
import {
  metaMaskWallet,
  rabbyWallet,
  walletConnectWallet,
} from "@rainbow-me/rainbowkit/wallets";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

// Create connectors at module scope to prevent re-creation on every render
const connectors = connectorsForWallets(
  [
    {
      groupName: "Recommended",
      wallets: [metaMaskWallet, rabbyWallet, walletConnectWallet],
    },
  ],
  {
    appName: "EZDAWG - Hyperliquid SIP Platform",
    projectId:
      process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "blah blah",
  }
);

// Create config at module scope to prevent re-initialization of Wagmi on every render
const config = createConfig({
  chains: [arbitrum],
  connectors,
  transports: {
    [arbitrum.id]: http(),
  },
  ssr: false,
});

export function RainbowProvider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>{children}</RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
