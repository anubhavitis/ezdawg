import * as hl from "@nktkas/hyperliquid";
import { privateKeyToAccount } from "viem/accounts";

/**
 * Create an HttpTransport with proper configuration
 * Fixes keepalive compatibility issues in Node.js runtime
 */
function createHttpTransport(isTestnet: boolean = false): hl.HttpTransport {
  return new hl.HttpTransport({
    isTestnet,
    onRequest: async (request) => {
      return new Request(request.url, {
        method: request.method,
        headers: request.headers,
        body: request.body,
        duplex: "half",
      } as any);
    },
  });
}

/**
 * Get an InfoClient for fetching market data
 * @param isTestnet Whether to use testnet (default: false)
 * @returns Configured InfoClient instance
 */
export function getInfoClient(isTestnet: boolean = false): hl.InfoClient {
  const transport = createHttpTransport(isTestnet);
  return new hl.InfoClient({ transport });
}

/**
 * Get an ExchangeClient for placing orders
 * @param wallet Viem wallet (from privateKeyToAccount)
 * @param isTestnet Whether to use testnet (default: false)
 * @returns Configured ExchangeClient instance
 */
export function getExchangeClient(
  privateKey: `0x${string}`,
  isTestnet: boolean = false
): hl.ExchangeClient {
  const transport = createHttpTransport(isTestnet);
  return new hl.ExchangeClient({
    transport,
    wallet: privateKeyToAccount(privateKey),
  });
}

/**
 * Get both InfoClient and ExchangeClient
 * @param wallet Viem wallet (from privateKeyToAccount)
 * @param isTestnet Whether to use testnet (default: false)
 * @returns Object with both clients
 */
export function getHyperliquidClients(
  privateKey: `0x${string}`,
  isTestnet: boolean = false
): { infoClient: hl.InfoClient; exchangeClient: hl.ExchangeClient } {
  const transport = createHttpTransport(isTestnet);
  return {
    infoClient: new hl.InfoClient({ transport }),
    exchangeClient: new hl.ExchangeClient({
      transport,
      wallet: privateKeyToAccount(privateKey),
    }),
  };
}
