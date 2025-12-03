import { decryptPrivateKey } from "@/backend/lib/encryption";
import type { SIPWithExecutionData } from "./db.service";
import { getExchangeClient, getInfoClient } from "./hl.service";

const MAX_DECIMALS_SPOT = 8;
const MAX_DECIMALS_PERP = 6;

function roundToSignificantFigures(num: number, sigFigs: number = 5): number {
  if (num === 0) return 0;
  if (Number.isInteger(num)) return num;

  const digits = Math.floor(Math.log10(Math.abs(num))) + 1;
  const factor = Math.pow(10, sigFigs - digits);
  return Math.round(num * factor) / factor;
}

function formatPrice(
  price: number,
  szDecimals: number,
  isSpot: boolean = false
): number {
  if (Number.isInteger(price)) {
    return price;
  }

  const sigFigsPrice = roundToSignificantFigures(price, 5);

  const maxDecimals = isSpot ? MAX_DECIMALS_SPOT : MAX_DECIMALS_PERP;
  const allowedDecimals = maxDecimals - szDecimals;

  const formattedPrice = parseFloat(sigFigsPrice.toFixed(allowedDecimals));
  return formattedPrice;
}

export async function getFormattedPrice(
  assetIndex: number,
  assetName: string,
  szDecimals: number
): Promise<number> {
  const infoClient = getInfoClient();
  const allMids = await infoClient.allMids();
  const index = `@${assetIndex}`;
  let currentPrice = allMids[index];

  currentPrice = (Number(currentPrice) * 1.01).toString();

  if (!currentPrice) {
    throw new Error(`Price not found for ${assetName}`);
  }

  return formatPrice(parseFloat(currentPrice), szDecimals, true);
}

export function calculateOrderSize(
  usdcAmount: number,
  formattedPrice: number,
  szDecimals: number
): string {
  const orderSizeInAsset = usdcAmount / formattedPrice;
  return orderSizeInAsset.toFixed(szDecimals);
}

/**
 * Validate that an order meets the minimum value requirement
 * @throws Error if order value is below minimum
 */
export function validateOrderValue(
  orderSize: string,
  price: number,
  minValue: number = 10
): void {
  const orderNotional = parseFloat(orderSize) * price;
  if (orderNotional < minValue) {
    throw new Error(
      `Order value $${orderNotional.toFixed(2)} below $${minValue} minimum`
    );
  }
}

/**
 * Parameters for placing a spot buy order
 */
export interface PlaceSpotOrderParams {
  privateKey: `0x${string}`;
  assetIndex: number;
  formattedPrice: number;
  orderSize: string;
  builderAddress?: `0x${string}`;
  builderFee?: number;
}

/**
 * Place a spot buy order on Hyperliquid
 * Uses IoC (Immediate-or-Cancel) limit order at formatted mid price
 *
 * @param params Order parameters
 * @returns Order result from Hyperliquid
 */
export async function placeSpotBuyOrder(
  params: PlaceSpotOrderParams
): Promise<any> {
  const {
    privateKey,
    assetIndex,
    formattedPrice,
    orderSize,
    builderAddress,
    builderFee,
  } = params;

  const exchangeClient = getExchangeClient(privateKey);

  const order: any = {
    orders: [
      {
        a: 10000 + assetIndex,
        b: true, // buy
        p: formattedPrice.toString(),
        s: orderSize,
        r: false,
        t: { limit: { tif: "Ioc" as "Ioc" } },
      },
    ],
    grouping: "na" as const,
  };

  // Add builder fee if configured
  if (builderAddress && builderFee && builderFee > 0) {
    order.builder = {
      b: builderAddress,
      f: builderFee,
    };
    console.log(
      `[Order Service] Including builder fee: ${builderFee} (0.1bps) = ${(
        builderFee / 10000
      ).toFixed(2)}%`
    );
  }

  return await exchangeClient.order(order);
}

export async function executeSingleSIP(
  sip: SIPWithExecutionData
): Promise<void> {
  const infoClient = getInfoClient();

  // Fetch spot metadata
  const spotMeta = await infoClient.spotMeta();
  const assetMeta = spotMeta.tokens.find(
    (t) => t.name.toLowerCase() === sip.asset_name.toLowerCase()
  );
  if (!assetMeta) {
    throw new Error(`Asset meta not found for ${sip.asset_name}`);
  }

  const szDecimals = assetMeta.szDecimals;

  // Get formatted price (fetches from allMids and formats)
  const formattedPrice = await getFormattedPrice(
    sip.asset_index,
    sip.asset_name,
    szDecimals
  );

  // Calculate order size
  const orderAmountUsdc = sip.monthly_amount_usdc / 90;
  const orderSize = calculateOrderSize(
    orderAmountUsdc,
    formattedPrice,
    szDecimals
  );

  // Validate order meets minimum value
  validateOrderValue(orderSize, formattedPrice, 10);

  console.log(
    `[Order Service] Placing order for ${sip.asset_name} at price: ${formattedPrice}`
  );

  // Place order
  await placeSpotBuyOrder({
    privateKey: decryptPrivateKey(sip.encrypted_private_key),
    assetIndex: sip.asset_index,
    formattedPrice,
    orderSize,
    builderAddress: process.env.NEXT_PUBLIC_BUILDER_ADDRESS as `0x${string}`,
    builderFee: sip.builder_fee,
  });
}
