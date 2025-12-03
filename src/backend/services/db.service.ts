import { createClient } from "@/backend/lib/supabase";

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
  builder_approved: boolean;
  builder_fee: number; // Builder fee in 0.1 basis points format (10000 = 1%)
  created_at: string;
}

export interface SIP {
  id: string;
  user_id: string;
  asset_name: string;
  asset_index: number;
  monthly_amount_usdc: number;
  status: "active" | "paused" | "cancelled";
  created_at: string;
  updated_at: string;
}

export interface SIPWithExecutionData extends SIP {
  encrypted_private_key: string;
  user_wallet_address: string;
  builder_approved: boolean;
  builder_fee: number;
}

/**
 * Get or create user by wallet address
 */
export async function getUserByWallet(
  walletAddress: string
): Promise<User | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("users")
    .upsert({ wallet_address: walletAddress }, { onConflict: "wallet_address" })
    .select()
    .single();

  if (error || !data) {
    console.error("Failed to get/create user:", error);
    return null;
  }

  return data;
}

/**
 * Get agent wallet for a user
 */
export async function getAgentWallet(
  userId: string
): Promise<AgentWallet | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("agent_wallets")
    .select("*")
    .eq("user_id", userId)
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
    .from("agent_wallets")
    .insert({
      user_id: userId,
      agent_address: agentAddress,
      encrypted_private_key: encryptedPrivateKey,
      approved: false,
    })
    .select()
    .single();

  if (error || !data) {
    console.error("Failed to create agent wallet:", error);
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
    .from("agent_wallets")
    .update({ approved })
    .eq("user_id", userId);

  if (error) {
    console.error("Failed to update agent approval:", error);
    return false;
  }

  return true;
}

/**
 * Update builder approval status and fee
 */
export async function updateBuilderApproval(
  userId: string,
  builderApproved: boolean,
  builderFee: number
): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("agent_wallets")
    .update({
      builder_approved: builderApproved,
      builder_fee: builderFee,
    })
    .eq("user_id", userId);

  if (error) {
    console.error("Failed to update builder approval:", error);
    return false;
  }

  return true;
}

/**
 * Get agent private key (only for backend use - cron jobs, etc)
 */
export async function getAgentPrivateKey(
  userId: string
): Promise<string | null> {
  const agentWallet = await getAgentWallet(userId);
  if (!agentWallet) {
    return null;
  }
  return agentWallet.encrypted_private_key;
}

/**
 * Create a new SIP for a user
 */
export async function createSIP(
  userId: string,
  assetName: string,
  assetIndex: number,
  monthlyAmountUsdc: number
): Promise<SIP | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("sips")
    .insert({
      user_id: userId,
      asset_name: assetName,
      asset_index: assetIndex,
      monthly_amount_usdc: monthlyAmountUsdc,
      status: "active",
    })
    .select()
    .single();

  if (error || !data) {
    console.error("Failed to create SIP:", error);
    return null;
  }

  return data;
}

/**
 * Get all SIPs for a user
 */
export async function getUserSIPs(userId: string): Promise<SIP[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("sips")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error || !data) {
    console.error("Failed to get user SIPs:", error);
    return [];
  }

  return data;
}

/**
 * Get all active SIPs for a user
 */
export async function getActiveSIPs(userId: string): Promise<SIP[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("sips")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (error || !data) {
    console.error("Failed to get active SIPs:", error);
    return [];
  }

  return data;
}

/**
 * Update SIP status
 */
export async function updateSIPStatus(
  sipId: string,
  status: "active" | "paused" | "cancelled"
): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("sips")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", sipId);

  if (error) {
    console.error("Failed to update SIP status:", error);
    return false;
  }

  return true;
}

/**
 * Get all active SIPs with agent wallet info (for cron execution)
 */
export async function getAllActiveSIPs(): Promise<SIPWithExecutionData[]> {
  const supabase = await createClient();

  const { data: sips, error: sipsError } = await supabase
    .from("sips")
    .select("*")
    .eq("status", "active");

  if (sipsError || !sips) {
    console.error("Failed to get active SIPs:", sipsError);
    return [];
  }

  const result: SIPWithExecutionData[] = [];

  for (const sip of sips) {
    const { data: agentWallet, error: agentError } = await supabase
      .from("agent_wallets")
      .select("encrypted_private_key, approved, builder_approved, builder_fee")
      .eq("user_id", sip.user_id)
      .eq("approved", true)
      .single();

    if (agentError || !agentWallet) {
      continue;
    }

    // Get user wallet address
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("wallet_address")
      .eq("id", sip.user_id)
      .single();

    if (userError || !user) {
      continue;
    }

    result.push({
      ...sip,
      encrypted_private_key: agentWallet.encrypted_private_key,
      user_wallet_address: user.wallet_address,
      builder_approved: agentWallet.builder_approved,
      builder_fee: agentWallet.builder_fee,
    });
  }

  return result;
}

/**
 * Get all active SIPs for a specific user with agent wallet info (for cron execution)
 */
export async function getUserActiveSIPsWithExecutionData(
  userWalletAddress: string
): Promise<SIPWithExecutionData[]> {
  const supabase = await createClient();

  // Get user by wallet address
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("id, wallet_address")
    .eq("wallet_address", userWalletAddress)
    .single();

  if (userError || !user) {
    console.error("User not found:", userWalletAddress);
    return [];
  }

  // Get active SIPs for this user
  const { data: sips, error: sipsError } = await supabase
    .from("sips")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", "active");

  if (sipsError || !sips || sips.length === 0) {
    return [];
  }

  // Get agent wallet for this user
  const { data: agentWallet, error: agentError } = await supabase
    .from("agent_wallets")
    .select("encrypted_private_key, approved, builder_approved, builder_fee")
    .eq("user_id", user.id)
    .eq("approved", true)
    .single();

  if (agentError || !agentWallet) {
    console.error(
      "Agent wallet not found or not approved for user:",
      userWalletAddress
    );
    return [];
  }

  // Combine all SIPs with execution data
  return sips.map((sip) => ({
    ...sip,
    encrypted_private_key: agentWallet.encrypted_private_key,
    user_wallet_address: user.wallet_address,
    builder_approved: agentWallet.builder_approved,
    builder_fee: agentWallet.builder_fee,
  }));
}
