"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useHyperliquidStore } from "../hyperliquid/store";
import { useAccount, useWalletClient } from "wagmi";
import { toast } from "sonner";

export function usePerpToSpotTransfer() {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const infoClient = useHyperliquidStore((state) => state.infoClient);
  const exchangeClient = useHyperliquidStore((state) => state.exchangeClient);
  const initExchangeClient = useHyperliquidStore((state) => state.initExchangeClient);
  const queryClient = useQueryClient();

  // Fetch Perp balance
  const { data: perpState, refetch: refetchPerpBalance } = useQuery({
    queryKey: ["hyperliquid", "perp-balance", address],
    queryFn: async () => {
      if (!address || !infoClient) return null;
      return await infoClient.clearinghouseState({ user: address });
    },
    enabled: !!address && !!infoClient,
  });

  // Transfer mutation
  const {
    mutateAsync: transfer,
    isPending,
    isSuccess,
    error,
  } = useMutation({
    mutationKey: ["hyperliquid", "perp-to-spot-transfer"],
    mutationFn: async (amount: number) => {
      if (!address) {
        throw new Error("Please connect your wallet");
      }

      if (!walletClient) {
        throw new Error("Wallet client not available");
      }

      // Initialize exchange client if not already done
      let client = exchangeClient;
      if (!client) {
        await initExchangeClient(walletClient);
        client = useHyperliquidStore.getState().exchangeClient;
      }

      if (!client) {
        throw new Error("Failed to initialize exchange client");
      }

      if (!perpState?.withdrawable) {
        throw new Error("Unable to fetch Perp balance");
      }

      const withdrawable = parseFloat(perpState.withdrawable);
      if (amount > withdrawable) {
        throw new Error("Insufficient Perp balance");
      }

      if (amount <= 0) {
        throw new Error("Amount must be greater than 0");
      }

      // Execute usdClassTransfer with toPerp: false (Perp → Spot)
      return await client.usdClassTransfer({
        amount: amount.toString(),
        toPerp: false,
      });
    },
    onSuccess: () => {
      toast.success("Transfer successful", {
        description: "Funds transferred from Perp to Spot account",
      });
      // Refetch balances
      refetchPerpBalance();
      queryClient.invalidateQueries({
        queryKey: ["hyperliquid", "balances", address],
      });
    },
    onError: (error: any) => {
      toast.error("Transfer failed", {
        description: error?.message || "Please try again",
      });
    },
  });

  return {
    transfer,
    isLoading: isPending,
    isSuccess,
    perpBalance: perpState?.withdrawable || "0",
    accountValue: perpState?.marginSummary?.accountValue || "0",
    refetchPerpBalance,
    error,
  };
}
