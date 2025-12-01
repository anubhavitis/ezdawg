import { createClient } from '@/backend/lib/supabase';

/**
 * Database service - handles all Supabase queries
 * Easy to swap out for different DB in the future
 */

export interface User {
  id: string;
  wallet_address: string;
  created_at: string;
}

export interface AgentWallet {
  id: string;
  user_id: string;
  agent_address: string;
  encrypted_private_key: string;
  approved: boolean;
  created_at: string;
}

/**
 * Get or create user by wallet address
 */
export async function getUserByWallet(walletAddress: string): Promise<User | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('users')
    .upsert(
      { wallet_address: walletAddress },
      { onConflict: 'wallet_address' }
    )
    .select()
    .single();

  if (error || !data) {
    console.error('Failed to get/create user:', error);
    return null;
  }

  return data;
}

/**
 * Get agent wallet for a user
 */
export async function getAgentWallet(userId: string): Promise<AgentWallet | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('agent_wallets')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}

/**
 * Create agent wallet for a user
 */
export async function createAgentWallet(
  userId: string,
  agentAddress: string,
  encryptedPrivateKey: string
): Promise<AgentWallet | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('agent_wallets')
    .insert({
      user_id: userId,
      agent_address: agentAddress,
      encrypted_private_key: encryptedPrivateKey,
      approved: false,
    })
    .select()
    .single();

  if (error || !data) {
    console.error('Failed to create agent wallet:', error);
    return null;
  }

  return data;
}

/**
 * Update agent approval status
 */
export async function updateAgentApproval(
  userId: string,
  approved: boolean
): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('agent_wallets')
    .update({ approved })
    .eq('user_id', userId);

  if (error) {
    console.error('Failed to update agent approval:', error);
    return false;
  }

  return true;
}

/**
 * Get agent private key (only for backend use - cron jobs, etc)
 */
export async function getAgentPrivateKey(userId: string): Promise<string | null> {
  const agentWallet = await getAgentWallet(userId);
  if (!agentWallet) {
    return null;
  }
  return agentWallet.encrypted_private_key;
}
