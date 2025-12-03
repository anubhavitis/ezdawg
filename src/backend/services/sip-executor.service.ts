import {
  getAllActiveSIPs,
  getUserActiveSIPsWithExecutionData,
  updateBuilderApproval,
  type SIPWithExecutionData,
} from "./db.service";
import { executeSingleSIP } from "./order.service";
import { getInfoClient } from "./hl.service";

interface ExecutionResult {
  totalSIPs: number;
  successCount: number;
  failureCount: number;
  errors: Array<{ sipId: string; assetName: string; error: string }>;
}

// Minimum builder fee threshold (in 0.1 basis points format)
// 1000 = 0.1%, 10000 = 1%
const MIN_BUILDER_FEE_THRESHOLD = 1000; // 0.1%

/**
 * Sync builder approval status from blockchain for all users with active SIPs
 */
async function syncBuilderApprovals(
  sips: SIPWithExecutionData[]
): Promise<void> {
  const builderAddress = process.env
    .NEXT_PUBLIC_BUILDER_ADDRESS as `0x${string}`;
  if (!builderAddress) {
    console.log("[SIP Executor] No builder address configured, skipping sync");
    return;
  }

  // Get unique users (user_id + wallet_address pairs)
  const uniqueUsers = new Map<string, string>();
  for (const sip of sips) {
    if (!uniqueUsers.has(sip.user_id)) {
      uniqueUsers.set(sip.user_id, sip.user_wallet_address);
    }
  }

  console.log(
    `[SIP Executor] Syncing builder approvals for ${uniqueUsers.size} users`
  );

  const infoClient = getInfoClient();

  // Check and update builder approval for each user
  for (const [userId, userWallet] of uniqueUsers.entries()) {
    try {
      const approvedFee = await infoClient.maxBuilderFee({
        user: userWallet as `0x${string}`,
        builder: builderAddress,
      });

      const isApproved = approvedFee > 0;
      await updateBuilderApproval(userId, isApproved, approvedFee);

      console.log(
        `[SIP Executor] User ${userWallet.slice(0, 6)}...${userWallet.slice(
          -4
        )}: builder_approved=${isApproved}, fee=${approvedFee}`
      );
    } catch (error) {
      console.error(
        `[SIP Executor] Failed to sync builder approval for user ${userWallet}:`,
        error
      );
    }
  }
}

export async function executeAllSIPs(): Promise<ExecutionResult> {
  const activeSIPs = await getAllActiveSIPs();
  console.log(
    `[SIP Executor] Found ${activeSIPs.length} active SIPs to execute`
  );

  await syncBuilderApprovals(activeSIPs);
  const result: ExecutionResult = {
    totalSIPs: activeSIPs.length,
    successCount: 0,
    failureCount: 0,
    errors: [],
  };

  // Sync builder approval status before executing SIPs

  for (const sip of activeSIPs) {
    try {
      // Validate builder approval before executing
      if (
        !sip.builder_approved ||
        sip.builder_fee < MIN_BUILDER_FEE_THRESHOLD
      ) {
        const reason = !sip.builder_approved
          ? "Builder not approved"
          : `Builder fee ${sip.builder_fee} below minimum threshold ${MIN_BUILDER_FEE_THRESHOLD}`;

        console.log(
          `[SIP Executor] ⊘ Skipping SIP ${sip.id} (${sip.asset_name}): ${reason}`
        );
        result.failureCount++;
        result.errors.push({
          sipId: sip.id,
          assetName: sip.asset_name,
          error: reason,
        });
        continue;
      }

      await executeSingleSIP(sip);
      result.successCount++;
      console.log(
        `[SIP Executor] ✓ Successfully executed SIP ${sip.id} (${sip.asset_name})`
      );
    } catch (error: any) {
      result.failureCount++;
      result.errors.push({
        sipId: sip.id,
        assetName: sip.asset_name,
        error: error.message || String(error),
      });
      console.error(
        `[SIP Executor] ✗ Failed to execute SIP ${sip.id} (${sip.asset_name}):`,
        error
      );
    }
  }

  console.log(
    `[SIP Executor] Execution complete: ${result.successCount}/${result.totalSIPs} successful`
  );
  return result;
}

export async function executeUserSIPs(
  userWalletAddress: string
): Promise<ExecutionResult> {
  const activeSIPs = await getUserActiveSIPsWithExecutionData(
    userWalletAddress
  );

  console.log(
    `[SIP Executor] Found ${activeSIPs.length} active SIPs for user ${userWalletAddress}`
  );

  const result: ExecutionResult = {
    totalSIPs: activeSIPs.length,
    successCount: 0,
    failureCount: 0,
    errors: [],
  };

  if (activeSIPs.length === 0) {
    return result;
  }

  // Sync builder approval for this user
  await syncBuilderApprovals(activeSIPs);

  for (const sip of activeSIPs) {
    try {
      // Validate builder approval
      if (
        !sip.builder_approved ||
        sip.builder_fee < MIN_BUILDER_FEE_THRESHOLD
      ) {
        const reason = !sip.builder_approved
          ? "Builder not approved"
          : `Builder fee ${sip.builder_fee} below minimum threshold ${MIN_BUILDER_FEE_THRESHOLD}`;

        console.log(
          `[SIP Executor] ⊘ Skipping SIP ${sip.id} (${sip.asset_name}): ${reason}`
        );
        result.failureCount++;
        result.errors.push({
          sipId: sip.id,
          assetName: sip.asset_name,
          error: reason,
        });
        continue;
      }

      await executeSingleSIP(sip);
      result.successCount++;
      console.log(
        `[SIP Executor] ✓ Successfully executed SIP ${sip.id} (${sip.asset_name})`
      );
    } catch (error: any) {
      result.failureCount++;
      result.errors.push({
        sipId: sip.id,
        assetName: sip.asset_name,
        error: error.message || String(error),
      });
      console.error(
        `[SIP Executor] ✗ Failed to execute SIP ${sip.id} (${sip.asset_name}):`,
        error
      );
    }
  }

  console.log(
    `[SIP Executor] User ${userWalletAddress} execution complete: ${result.successCount}/${result.totalSIPs} successful`
  );
  return result;
}
