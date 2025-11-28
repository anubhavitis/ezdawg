/**
 * Server-side utilities for Hyperliquid operations
 * These functions can be used in API routes and server components
 */

// @ts-ignore - Hyperliquid is exported but types may not be fully defined
import { Hyperliquid } from "@nktkas/hyperliquid";
import { SPOT_ASSET_ID_OFFSET, DEFAULT_SLIPPAGE_TOLERANCE } from "../constants";

// Singleton info client for server-side use
let serverInfoClient: Hyperliquid | null = null;

function getServerInfoClient(): Hyperliquid {
  if (!serverInfoClient) {
    serverInfoClient = new Hyperliquid();
  }
  return serverInfoClient;
}

function createServerExchangeClient(privateKey: string): Hyperliquid {
  return new Hyperliquid({ privateKey });
}

/**
 * Fetch spot metadata from Hyperliquid (server-side)
 */
export async function getSpotMetadata() {
  const client = getServerInfoClient();
  return await client.info.spot.getSpotMeta();
}

/**
 * Fetch all mid prices (server-side)
 */
export async function getAllMids() {
  const client = getServerInfoClient();
  return await client.info.getAllMids();
}

/**
 * Fetch user's spot balances (server-side)
 */
export async function getUserSpotBalances(userAddress: string) {
  const client = getServerInfoClient();
  return await client.info.spot.getSpotClearinghouseState(userAddress);
}

/**
 * Get spot asset by index (server-side)
 */
export async function getSpotAssetByIndex(assetIndex: number) {
  const spotMeta = await getSpotMetadata();
  return spotMeta.universe.find((u: any) => u.index === assetIndex) || null;
}

/**
 * Get spot asset by name (server-side)
 */
export async function getSpotAssetByName(assetName: string) {
  const spotMeta = await getSpotMetadata();
  return (
    spotMeta.universe.find(
      (u: any) => u.name.toUpperCase() === assetName.toUpperCase()
    ) || null
  );
}

/**
 * Get current price for an asset (server-side)
 */
export async function getAssetPrice(assetName: string) {
  const allMids = await getAllMids();
  return allMids[assetName] || null;
}

/**
 * Get user's balance for a specific asset (server-side)
 */
export async function getAssetBalance(
  userAddress: string,
  assetName: string
): Promise<number> {
  try {
    const balances = await getUserSpotBalances(userAddress);
    const assetBalance = balances.balances.find(
      (b: any) => b.coin.toUpperCase() === assetName.toUpperCase()
    );
    return assetBalance ? parseFloat(assetBalance.hold) : 0;
  } catch (error: any) {
    console.error("Error fetching asset balance:", error);
    return 0;
  }
}

/**
 * Check if user has sufficient balance (server-side)
 */
export async function hasSufficientBalance(
  userAddress: string,
  amountUsdc: number
): Promise<boolean> {
  try {
    const usdcBalance = await getAssetBalance(userAddress, "USDC");
    return usdcBalance >= amountUsdc;
  } catch (error) {
    console.error("Error checking balance:", error);
    return false;
  }
}

/**
 * Execute a spot buy order (server-side)
 */
export async function executeSpotBuy(
  privateKey: string,
  assetIndex: number,
  amountUsdc: number,
  slippageTolerance: number = DEFAULT_SLIPPAGE_TOLERANCE
) {
  try {
    // Get asset metadata
    const asset = await getSpotAssetByIndex(assetIndex);
    if (!asset) {
      throw new Error(`Asset with index ${assetIndex} not found`);
    }

    // Get current price
    const priceStr = await getAssetPrice(asset.name);
    if (!priceStr) {
      throw new Error(`Price for asset ${asset.name} not available`);
    }

    const price = parseFloat(priceStr);

    // Calculate token amount with slippage
    const slippagePrice = price * (1 + slippageTolerance);
    const tokenAmount = amountUsdc / slippagePrice;

    // Create exchange client with private key
    const exchangeClient = createServerExchangeClient(privateKey);

    // Create IOC (Immediate or Cancel) limit order
    const order = {
      coin: asset.name,
      is_buy: true,
      sz: tokenAmount,
      limit_px: slippagePrice,
      order_type: { limit: { tif: "Ioc" as const } },
      reduce_only: false,
    };

    console.log(`Executing spot buy for ${asset.name}:`, {
      assetIndex,
      amountUsdc,
      price,
      slippagePrice,
      tokenAmount,
    });

    // Execute the order
    const result = await exchangeClient.exchange.placeOrder(order);

    return {
      success: true,
      orderId: result?.response?.data?.statuses?.[0]?.resting?.oid,
      status: result?.response?.data?.statuses?.[0],
      price: price,
      tokensAcquired: tokenAmount,
      assetName: asset.name,
    };
  } catch (error: any) {
    console.error("Error executing spot buy:", error);
    throw new Error(`Failed to execute spot buy: ${error.message}`);
  }
}
