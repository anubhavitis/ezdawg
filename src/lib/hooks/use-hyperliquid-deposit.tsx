import { useWriteContract, useWaitForTransactionReceipt, useReadContract, useAccount } from "wagmi";
import { parseUnits, formatUnits } from "viem";
import { toast } from "sonner";
import { HYPERLIQUID_BRIDGE, USDC_ADDRESS, ERC20_ABI, USDC_DECIMALS, MIN_DEPOSIT } from "@/lib/constants/hyperliquid";
import { arbitrum } from "wagmi/chains";

export function useHyperliquidDeposit() {
  const { address } = useAccount();

  // Read USDC balance on Arbitrum
  const { data: balance, refetch: refetchBalance } = useReadContract({
    address: USDC_ADDRESS.arbitrum,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    chainId: arbitrum.id,
    query: {
      enabled: !!address,
    },
  });

  // Write contract hook for transfer
  const {
    writeContract,
    data: hash,
    isPending: isWritePending,
    error: writeError,
  } = useWriteContract();

  // Wait for transaction
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const deposit = async (amount: number) => {
    if (!address) {
      toast.error("Please connect your wallet");
      return;
    }

    if (amount < MIN_DEPOSIT) {
      toast.error(`Minimum deposit is ${MIN_DEPOSIT} USDC`);
      return;
    }

    const amountWei = parseUnits(amount.toString(), USDC_DECIMALS);

    // Check balance
    if (balance && amountWei > (balance as bigint)) {
      toast.error("Insufficient USDC balance");
      return;
    }

    try {
      writeContract({
        address: USDC_ADDRESS.arbitrum,
        abi: ERC20_ABI,
        functionName: "transfer",
        args: [HYPERLIQUID_BRIDGE.mainnet, amountWei],
        chainId: arbitrum.id,
      });
    } catch (error: any) {
      toast.error(error.message || "Transaction failed");
    }
  };

  return {
    deposit,
    isLoading: isWritePending || isConfirming,
    isSuccess,
    balance: balance ? formatUnits(balance as bigint, USDC_DECIMALS) : "0",
    refetchBalance,
    error: writeError,
  };
}
