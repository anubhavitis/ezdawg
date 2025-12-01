import { generateAgentWallet } from '@/lib/crypto/wallet';
import { encryptPrivateKey } from '@/backend/lib/encryption';
import * as db from './db.service';

/**
 * Agent service - handles agent business logic
 * Orchestrates between crypto and database operations
 */

export interface AgentResult {
  agentAddress: string;
  approved: boolean;
  message?: string;
}

/**
 * Create new agent for a wallet address
 * Returns existing agent if already exists
 */
export async function createAgent(walletAddress: string): Promise<AgentResult | null> {
  // Get or create user
  const user = await db.getUserByWallet(walletAddress);
  if (!user) {
    return null;
  }

  // Check if agent already exists
  const existingAgent = await db.getAgentWallet(user.id);
  if (existingAgent) {
    return {
      agentAddress: existingAgent.agent_address,
      approved: existingAgent.approved,
      message: 'Agent already exists',
    };
  }

  // Generate new agent wallet
  const { address, privateKey } = generateAgentWallet();
  const encryptedKey = encryptPrivateKey(privateKey);

  // Save to database
  const agentWallet = await db.createAgentWallet(user.id, address, encryptedKey);
  if (!agentWallet) {
    return null;
  }

  return {
    agentAddress: address,
    approved: false,
    message: 'Agent created successfully',
  };
}

/**
 * Get existing agent for a wallet address
 * Returns only agent address and approval status (NEVER private key)
 */
export async function getAgent(walletAddress: string): Promise<AgentResult | null> {
  // Get user
  const user = await db.getUserByWallet(walletAddress);
  if (!user) {
    return null;
  }

  // Get agent wallet
  const agentWallet = await db.getAgentWallet(user.id);
  if (!agentWallet) {
    return null;
  }

  return {
    agentAddress: agentWallet.agent_address,
    approved: agentWallet.approved,
  };
}

/**
 * Mark agent as approved
 * Called after frontend successfully approves agent on Hyperliquid
 */
export async function markAgentApproved(walletAddress: string): Promise<boolean> {
  const user = await db.getUserByWallet(walletAddress);
  if (!user) {
    return false;
  }

  return await db.updateAgentApproval(user.id, true);
}
