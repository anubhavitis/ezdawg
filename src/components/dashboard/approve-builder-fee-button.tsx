"use client";

import { Button } from "@/components/ui/button";
import { useHyperliquidStore } from "@/lib/hyperliquid/store";
import { approveBuilderFee } from "@/lib/hyperliquid/agent-service";
import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle, Loader2 } from "lucide-react";
import { Address } from "viem";

export function ApproveBuilderFeeButton() {
  const [isApproving, setIsApproving] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const exchangeClient = useHyperliquidStore((state) => state.exchangeClient);

  const builderAddress = process.env.NEXT_PUBLIC_BUILDER_ADDRESS as Address;
  const builderFee = process.env.NEXT_PUBLIC_BUILDER_FEE;

  if (!builderAddress || !builderFee) {
    return null;
  }

  const handleApprove = async () => {
    if (!exchangeClient) {
      toast.error("Exchange client not initialized");
      return;
    }

    const maxFeeRate = `${(parseInt(builderFee) / 10000).toFixed(2)}%`;
    console.log(
      "🚀 Approving with maxFeeRate:",
      maxFeeRate,
      "from builderFee:",
      builderFee
    );

    setIsApproving(true);
    try {
      await approveBuilderFee(exchangeClient, builderAddress, maxFeeRate);
      setIsApproved(true);
      toast.success(`Builder fee approved at ${maxFeeRate}`);
    } catch (error: any) {
      console.error("Failed to approve builder fee:", error);
      toast.error(error.message || "Failed to approve builder fee");
    } finally {
      setIsApproving(false);
    }
  };

  if (isApproved) {
    return (
      <div className="flex items-center gap-2 text-xs text-green-600">
        <CheckCircle className="w-4 h-4" />
        <span>Builder approved ({builderFee})</span>
      </div>
    );
  }

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={handleApprove}
      disabled={isApproving}
    >
      {isApproving ? (
        <>
          <Loader2 className="w-3 h-3 mr-2 animate-spin" />
          Approving...
        </>
      ) : (
        `Approve Builder Fee (${builderFee})`
      )}
    </Button>
  );
}
