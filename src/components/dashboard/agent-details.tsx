"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import { useInitializeAgent } from "@/lib/hyperliquid/hooks";
import { useHyperliquidStore } from "@/lib/hyperliquid/store";
import { approveBuilderFee } from "@/lib/hyperliquid/agent-service";
import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Address } from "viem";

export function AgentDetails() {
  const { address } = useAccount();
  const { data: agentData, refetch: refetchAgent } = useInitializeAgent();
  const { infoClient, exchangeClient, initExchangeClient } =
    useHyperliquidStore();

  const [isApprovingBuilder, setIsApprovingBuilder] = useState(false);

  const builderAddress = process.env.NEXT_PUBLIC_BUILDER_ADDRESS as Address;
  const builderFee = process.env.NEXT_PUBLIC_BUILDER_FEE;

  // Check builder fee approval status
  const { data: approvedBuilderFee, refetch: refetchBuilderFee } = useQuery({
    queryKey: ["builder-fee-approval", address, builderAddress],
    queryFn: async () => {
      if (!infoClient || !address || !builderAddress) return null;
      const fee = await infoClient.maxBuilderFee({
        user: address,
        builder: builderAddress,
      });
      return fee;
    },
    enabled: !!infoClient && !!address && !!builderAddress,
    refetchInterval: 30000,
  });

  if (!agentData || !address) {
    return null;
  }

  const isAgentApproved = agentData.initialized;
  const isBuilderApproved = approvedBuilderFee && approvedBuilderFee > 0;

  const handleApproveAgent = async () => {
    if (!exchangeClient) {
      await initExchangeClient();
    }
    // This will trigger the agent initialization flow
    await refetchAgent();
  };

  const handleApproveBuilder = async () => {
    if (!exchangeClient || !builderAddress || !builderFee) {
      toast.error("Exchange client not initialized");
      return;
    }

    setIsApprovingBuilder(true);
    try {
      const maxFeeRate = `${parseInt(builderFee) / 10000}%`;
      await approveBuilderFee(exchangeClient, builderAddress, maxFeeRate);
      await refetchBuilderFee();
      toast.success(`Builder fee approved at ${maxFeeRate}`);
    } catch (error: any) {
      console.error("Failed to approve builder fee:", error);
      toast.error(error.message || "Failed to approve builder fee");
    } finally {
      setIsApprovingBuilder(false);
    }
  };

  return (
    <div className={`px-4 py-2 rounded border`}>
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Agent:</span>
            <code className="font-mono">{agentData.agentAddress}</code>
          </div>

          {/* Status indicators */}
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1">
              {isAgentApproved ? (
                <>
                  <CheckCircle className="w-3 h-3 text-green-600" />
                  <span className="text-green-600">Agent approved</span>
                </>
              ) : (
                <span className="text-amber-600">Agent not approved</span>
              )}
            </div>

            {builderAddress && (
              <>
                <span className="text-muted-foreground">•</span>
                <div className="flex items-center gap-1">
                  {isBuilderApproved ? (
                    <>
                      <CheckCircle className="w-3 h-3 text-green-600" />
                      <span className="text-green-600">
                        Builder approved (
                        {((approvedBuilderFee || 0) / 10000).toFixed(2)}%)
                      </span>
                    </>
                  ) : (
                    <span className="text-amber-600">Builder not approved</span>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Approval buttons */}
        <div className="flex items-center gap-2">
          {!isAgentApproved && (
            <Button size="sm" variant="outline" onClick={handleApproveAgent}>
              Approve Agent
            </Button>
          )}

          {builderAddress && !isBuilderApproved && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleApproveBuilder}
              disabled={isApprovingBuilder}
            >
              {isApprovingBuilder ? (
                <>
                  <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                  Approving...
                </>
              ) : (
                "Approve Builder"
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
