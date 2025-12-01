import { create } from "zustand";
import * as hl from "@nktkas/hyperliquid";
import { createWalletClient, custom } from "viem";

interface HyperliquidStore {
  // Read-only info client (no private key needed)
  infoClient: hl.InfoClient | null;
  // Exchange client (user's wallet - for approving agents, manual trades)
  exchangeClient: hl.ExchangeClient | null;
  // Note: No agent client on frontend - agent only used by backend cron jobs

  // Initialize all clients and setup
  init: () => void;
  initExchangeClient: () => Promise<void>;
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

  initExchangeClient: async () => {
    const [account] = (await window.ethereum.request({
      method: "eth_requestAccounts",
    })) as `0x${string}`[];
    const externalWallet = createWalletClient({
      account,
      transport: custom(window.ethereum),
    });
    const exchangeClient = new hl.ExchangeClient({
      transport: globalTransport,
      wallet: externalWallet,
    });
    set({ exchangeClient });
  },
}));
