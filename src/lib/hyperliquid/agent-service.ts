/**
 * Agent initialization service layer
 *
 * This module contains all business logic for initializing Hyperliquid agents.
 * All functions are pure and can be tested independently of React.
 *
 * @module agent-service
 */

import { Address, isAddressEqual } from "viem";
import * as hl from "@nktkas/hyperliquid";

/**
 * Result of agent initialization
 */
export interface AgentInitResult {
  agentAddress: Address;
  initialized: boolean;
}

/**
 * Parameters for initializing an agent
 */
export interface InitializeAgentParams {
  userAddress: Address;
  infoClient: hl.InfoClient | null;
  exchangeClient: hl.ExchangeClient | null;
  initExchangeClient: () => Promise<void>;
}

/**
 * Get existing agent or create a new one via API
 * Returns only agent address (never private key - that stays on backend)
 *
 * @param userAddress - The user's wallet address
 * @returns Agent address and approval status
 */
export async function getOrCreateAgent(userAddress: Address): Promise<{
  agentAddress: Address;
  approved: boolean;
}> {
  // Try to get existing agent
  const getResponse = await fetch(`/api/agent?walletAddress=${userAddress}`);
  const existingAgent = await getResponse.json();

  if (existingAgent.agentAddress) {
    return {
      agentAddress: existingAgent.agentAddress,
      approved: existingAgent.approved,
    };
  }

  // Create new agent
  const createResponse = await fetch("/api/agent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ walletAddress: userAddress }),
  });

  const newAgent = await createResponse.json();

  if (!newAgent.agentAddress) {
    throw new Error("Failed to create agent");
  }

  return {
    agentAddress: newAgent.agentAddress,
    approved: newAgent.approved || false,
  };
}

// Removed: createAgentAccount - no longer needed on frontend
// Agent private keys never leave the backend

/**
 * Check if an agent is already approved for a user
 *
 * @param infoClient - Hyperliquid info client
 * @param userAddress - The user's wallet address
 * @param agentAddress - The agent's wallet address
 * @returns true if agent is approved, false otherwise
 */
export async function checkAgentApproval(
  infoClient: hl.InfoClient | null,
  userAddress: Address,
  agentAddress: Address
): Promise<boolean> {
  if (!infoClient) {
    return false;
  }

  try {
    const resp = await infoClient.extraAgents({ user: userAddress });
    console.log(
      "🚀 ~ checkAgentApproval ~ resp:",
      resp,
      "agentAddress",
      agentAddress
    );

    if (!resp) {
      return false;
    }

    const found = resp.find((agent: any) => {
      return isAddressEqual(agent.address, agentAddress);
    });

    console.log("🚀 ~ checkAgentApproval ~ found:", found);
    return !!found;
  } catch (error) {
    console.warn("Failed to check agent approval status:", error);
    return false;
  }
}

/**
 * Approve an agent if it's not already approved
 *
 * @param exchangeClient - Hyperliquid exchange client
 * @param agentAddress - The agent's wallet address
 * @param isApproved - Whether the agent is already approved
 */
export async function approveAgentIfNeeded(
  exchangeClient: hl.ExchangeClient | null,
  agentAddress: Address,
  isApproved: boolean
): Promise<void> {
  if (isApproved) {
    console.log("Agent already approved, skipping approval step");
    return;
  }

  if (!exchangeClient) {
    throw new Error("Exchange client not initialized");
  }

  try {
    await exchangeClient.approveAgent({
      agentAddress,
      agentName: "EzDawg Agent",
    });
    console.log("Agent approved successfully");
  } catch (error: any) {
    // If approval fails, log but don't throw - agent might already be approved
    console.warn(
      "Agent approval failed (might already be approved):",
      error?.message || error
    );
  }
}

/**
 * Main orchestrator function that initializes an agent
 *
 * This function coordinates all the steps required to initialize an agent:
 * 1. Get or create agent private key
 * 2. Initialize exchange client (user's wallet)
 * 3. Create agent account from private key
 * 4. Check if agent is already approved
 * 5. Approve agent if needed
 * 6. Initialize agent client
 *
 * @param params - Initialization parameters
 * @returns Agent initialization result
 */
export async function initializeAgent(
  params: InitializeAgentParams
): Promise<AgentInitResult> {
  const { userAddress, infoClient, exchangeClient, initExchangeClient } =
    params;

  // Step 1: Get or create agent via API (returns only address, never private key)
  const { agentAddress, approved } = await getOrCreateAgent(userAddress);

  console.log("agentAddress", agentAddress, "approved", approved);

  // Step 2: Initialize exchange client (user's wallet)
  if (!exchangeClient) {
    await initExchangeClient();
  }

  // Step 3: Check if agent is already approved on Hyperliquid
  let isApproved = await checkAgentApproval(
    infoClient,
    userAddress,
    agentAddress
  );

  console.log("isApproved", isApproved);

  // Step 4: Approve agent if needed
  if (!isApproved) {
    console.log("Approving agent");
    await approveAgentIfNeeded(exchangeClient, agentAddress, isApproved);
    console.log("Checking agent approval again");
    isApproved = await checkAgentApproval(
      infoClient,
      userAddress,
      agentAddress
    );
    console.log("isApproved", isApproved);
  }

  // Step 5: If we just approved it, mark in DB

  if (!approved && isApproved) {
    await fetch("/api/agent/approve", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ walletAddress: userAddress }),
    });
  }

  // Note: No agent client initialized on frontend
  // Agent will be used by backend cron jobs only

  return {
    agentAddress,
    initialized: true,
  };
}
