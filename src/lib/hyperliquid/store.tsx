import { create } from "zustand";
import * as hl from "@nktkas/hyperliquid";

interface HyperliquidStore {
  // Read-only info client (no private key needed)
  infoClient: hl.InfoClient | null;
  // Exchange client (user's wallet - for approving agents, manual trades)
  exchangeClient: hl.ExchangeClient | null;
  // Note: No agent client on frontend - agent only used by backend cron jobs

  // Initialize all clients and setup
  init: () => void;
  // Accept wagmi's WalletClient (typed as any for compatibility with hyperliquid library)
  initExchangeClient: (walletClient: any) => Promise<void>;
}

const globalTransport = new hl.WebSocketTransport({ isTestnet: false });

export const useHyperliquidStore = create<HyperliquidStore>((set, get) => ({
  infoClient: null,
  exchangeClient: null,

  init: () => {
    const infoClient = new hl.InfoClient({ transport: globalTransport });
    set({
      infoClient,
    });
  },

  initExchangeClient: async (walletClient) => {
    const exchangeClient = new hl.ExchangeClient({
      transport: globalTransport,
      wallet: walletClient as any, // Type assertion for hyperliquid library compatibility
    });
    set({ exchangeClient });
  },
}));
