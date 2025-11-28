// Hyperliquid API Configuration
export const HYPERLIQUID_API_URL =
  process.env.NEXT_PUBLIC_HYPERLIQUID_API_URL || 'https://api.hyperliquid.xyz';

// Spot asset ID calculation
export const SPOT_ASSET_ID_OFFSET = 10000;

// SIP Configuration
export const SIP_INTERVALS = {
  '8h': 8 * 60 * 60 * 1000, // 8 hours in milliseconds
  '12h': 12 * 60 * 60 * 1000, // 12 hours in milliseconds
  '24h': 24 * 60 * 60 * 1000, // 24 hours in milliseconds
} as const;

export type SIPInterval = keyof typeof SIP_INTERVALS;

// Trading Configuration
export const DEFAULT_SLIPPAGE_TOLERANCE = 0.02; // 2%
export const MIN_SIP_AMOUNT_USDC = 1; // Minimum $1 USD

// Arbitrum Chain ID
export const ARBITRUM_CHAIN_ID = 42161;
