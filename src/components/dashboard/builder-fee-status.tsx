"use client";

import { useHyperliquidStore } from "@/lib/hyperliquid/store";
import { useQuery } from "@tanstack/react-query";
import { Address } from "viem";

interface BuilderFeeStatusProps {
  userAddress: Address;
}

export function BuilderFeeStatus({ userAddress }: BuilderFeeStatusProps) {
  const infoClient = useHyperliquidStore((state) => state.infoClient);
  const builderAddress = process.env.NEXT_PUBLIC_BUILDER_ADDRESS as Address;

  const { data: approvedFee, isLoading } = useQuery({
    queryKey: ["builder-fee-approval", userAddress, builderAddress],
    queryFn: async () => {
      if (!infoClient || !builderAddress) return null;

      const fee = await infoClient.maxBuilderFee({
        user: userAddress,
        builder: builderAddress,
      });

      return fee;
    },
    enabled: !!infoClient && !!userAddress && !!builderAddress,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  if (!builderAddress) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="text-xs text-muted-foreground">
        Checking builder fee approval...
      </div>
    );
  }

  if (approvedFee === null || approvedFee === undefined || approvedFee === 0) {
    return (
      <div className="text-xs text-amber-600">Builder fee not approved</div>
    );
  }

  console.log("🚀 ~ BuilderFeeStatus ~ approvedFee:", approvedFee);

  const feePercentage = (approvedFee / 10000).toFixed(2);

  return (
    <div className="text-xs text-muted-foreground">
      Builder fee approved:{" "}
      <span className="font-semibold text-green-600">{feePercentage}%</span>{" "}
      (max)
    </div>
  );
}
