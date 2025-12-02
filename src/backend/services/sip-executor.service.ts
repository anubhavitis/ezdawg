import * as hl from "@nktkas/hyperliquid";
import { privateKeyToAccount } from "viem/accounts";
import { decryptPrivateKey } from "@/backend/lib/encryption";
import { getAllActiveSIPs, type SIP } from "./db.service";

interface ExecutionResult {
  totalSIPs: number;
  successCount: number;
  failureCount: number;
  errors: Array<{ sipId: string; assetName: string; error: string }>;
}

interface SIPWithKey extends SIP {
  encrypted_private_key: string;
}

export async function executeAllSIPs(): Promise<ExecutionResult> {
  const activeSIPs = await getAllActiveSIPs();
  console.log(
    `[SIP Executor] Found ${activeSIPs.length} active SIPs to execute`
  );

  const result: ExecutionResult = {
    totalSIPs: activeSIPs.length,
    successCount: 0,
    failureCount: 0,
    errors: [],
  };

  for (const sip of activeSIPs) {
    try {
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

async function executeSingleSIP(sip: SIPWithKey): Promise<void> {
  const decryptedKey = decryptPrivateKey(sip.encrypted_private_key);

  const wallet = privateKeyToAccount(decryptedKey as `0x${string}`);

  const transport = new hl.HttpTransport({
    isTestnet: false,
    onRequest: async (request) => {
      return new Request(request.url, {
        method: request.method,
        headers: request.headers,
        body: request.body,
        duplex: "half",
      } as any);
    },
  });
  const infoClient = new hl.InfoClient({ transport });
  const exchangeClient = new hl.ExchangeClient({ transport, wallet });

  const [allMids, spotMeta] = await Promise.all([
    infoClient.allMids(),
    infoClient.spotMeta(),
  ]);

  const index = `@${sip.asset_index}`;
  let currentPrice = allMids[index];
  if (!currentPrice) {
    throw new Error(`Price not found for ${sip.asset_name}`);
  }

  const assetMeta = spotMeta.tokens.find(
    (t) => t.name.toLowerCase() === sip.asset_name.toLowerCase()
  );
  if (!assetMeta) {
    throw new Error(`Asset meta not found for ${sip.asset_name}`);
  }

  const szDecimals = assetMeta.szDecimals;
  const orderAmountUsdc = sip.monthly_amount_usdc / 90;

  const orderSizeInAsset = orderAmountUsdc / parseFloat(currentPrice);

  const formattedSize = orderSizeInAsset.toFixed(szDecimals);

  const orderNotional = parseFloat(formattedSize) * parseFloat(currentPrice);
  if (orderNotional < 10) {
    throw new Error(
      `Order value $${orderNotional.toFixed(2)} below $10 minimum`
    );
  }

  console.log(
    `[SIP ${sip.id}] Placing market order: ${formattedSize} ${
      sip.asset_name
    } (~$${orderNotional.toFixed(2)})`
  );

  const builderAddress = process.env
    .NEXT_PUBLIC_BUILDER_ADDRESS as `0x${string}`;
  console.log("🚀 ~ executeSingleSIP ~ builderAddress:", builderAddress);
  let builderFee = parseInt(process.env.NEXT_PUBLIC_BUILDER_FEE || "0");
  console.log("🚀 ~ executeSingleSIP ~ builderFee:", builderFee);

  builderFee = builderFee / 10;

  const order: any = {
    orders: [
      {
        a: 10000 + sip.asset_index,
        b: true,
        p: parseFloat(currentPrice).toFixed(0),
        s: formattedSize.toString(),
        r: false,
        t: { limit: { tif: "Ioc" as "Ioc" } },
      },
    ],
    grouping: "na" as const,
  };

  if (builderAddress && builderFee) {
    order.builder = {
      b: builderAddress,
      f: builderFee,
    };
    console.log(
      `[SIP ${sip.id}] Including builder fee: ${builderFee} (0.1bps)`
    );
  }

  console.log("🚀 ~ executeSingleSIP ~ order:", order);
  const result = await exchangeClient.order(order);

  console.log(`[SIP ${sip.id}] Order result:`, JSON.stringify(result, null, 2));
}
