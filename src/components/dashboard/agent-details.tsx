"use client";

import { useState } from "react";
import { useAccount, useWalletClient } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import { useAgentInfo, useApproveAgentMutation } from "@/lib/hyperliquid/hooks";
import { useHyperliquidStore } from "@/lib/hyperliquid/store";
import { approveBuilderFee } from "@/lib/hyperliquid/agent-service";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Address } from "viem";

export function AgentDetails() {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { data: agentData, isLoading: isLoadingAgent } = useAgentInfo();
  const approveAgentMutation = useApproveAgentMutation();
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

  if (!address) {
    return null;
  }

  if (isLoadingAgent || !agentData) {
    return (
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="agent-details">
          <AccordionTrigger className="hover:no-underline">
            Agent Details
          </AccordionTrigger>
          <AccordionContent>
            <div className="flex items-center gap-2 py-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm text-muted-foreground">
                Loading agent info...
              </span>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    );
  }

  const isAgentApproved = agentData.isApproved;
  const isBuilderApproved = approvedBuilderFee && approvedBuilderFee > 0;

  const handleApproveAgent = () => {
    // Use the mutation - this will trigger a signature request only when clicked
    approveAgentMutation.mutate(agentData.agentAddress);
  };

  const handleApproveBuilder = async () => {
    if (!builderAddress || !builderFee || !address || !walletClient) {
      toast.error("Wallet not connected");
      return;
    }

    // Initialize exchange client if needed
    let client = exchangeClient;
    if (!client) {
      await initExchangeClient(walletClient);
      client = useHyperliquidStore.getState().exchangeClient;
    }

    if (!client) {
      toast.error("Failed to initialize exchange client");
      return;
    }

    setIsApprovingBuilder(true);
    try {
      const maxFeeRate = `${parseInt(builderFee) / 10000}%`;
      await approveBuilderFee(client, builderAddress, maxFeeRate);
      await refetchBuilderFee();

      // Save to database - use wagmi's walletClient for signing
      const message = `Approve builder fee: ${maxFeeRate}`;
      const signature = await walletClient.signMessage({
        message,
      });

      await fetch("/api/builder/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress: address,
          builderFee: parseInt(builderFee),
          signature,
          message,
        }),
      });

      toast.success(`Builder fee approved at ${maxFeeRate}`);
    } catch (error: any) {
      console.error("Failed to approve builder fee:", error);
      toast.error(error.message || "Failed to approve builder fee");
    } finally {
      setIsApprovingBuilder(false);
    }
  };

  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="agent-details">
        <AccordionTrigger className="hover:no-underline">
          Agent Details
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Agent:</span>
                <code className="font-mono text-xs break-all">{agentData.agentAddress}</code>
              </div>

              {/* Status indicators */}
              <div className="flex flex-wrap items-center gap-3 text-xs">
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
                        <span className="text-amber-600">
                          Builder not approved
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Approval buttons */}
            {(!isAgentApproved || (builderAddress && !isBuilderApproved)) && (
              <div className="flex flex-wrap items-center gap-2">
                {!isAgentApproved && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleApproveAgent}
                    disabled={approveAgentMutation.isPending}
                  >
                    {approveAgentMutation.isPending ? (
                      <>
                        <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                        Approving...
                      </>
                    ) : (
                      "Approve Agent"
                    )}
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
            )}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
