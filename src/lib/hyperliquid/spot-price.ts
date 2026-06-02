// Spot USD price resolution.
//
// Invariant: usd(token) = mid(token/quote) * usd(quote).
// USDC (token index 0) is the USD anchor. Every other quote token must
// resolve to USDC in one hop. Never assume a quote token equals $1.

const USDC_TOKEN_INDEX = 0;

interface SpotToken {
  name: string;
  index: number;
}

interface SpotPair {
  tokens: [number, number];
  index: number;
}

export interface SpotMeta {
  tokens: SpotToken[];
  universe: SpotPair[];
}

type AllMids = Record<string, string> | undefined;

function mid(pairIndex: number, allMids: AllMids): number | null {
  const raw = allMids?.[`@${pairIndex}`];
  if (!raw) return null;
  const px = parseFloat(raw);
  return px > 0 ? px : null;
}

// Find the pair trading baseTokenIndex against a specific quoteTokenIndex.
function findPair(
  baseTokenIndex: number,
  quoteTokenIndex: number,
  universe: SpotPair[],
): SpotPair | undefined {
  return universe.find(
    (u) => u.tokens[0] === baseTokenIndex && u.tokens[1] === quoteTokenIndex,
  );
}

// USD price of a quote token. USDC is the anchor (1). Anything else is
// resolved via its own /USDC pair — one hop, no recursion past USDC.
function quoteToUsd(
  quoteTokenIndex: number,
  spotMeta: SpotMeta,
  allMids: AllMids,
): number | null {
  if (quoteTokenIndex === USDC_TOKEN_INDEX) return 1;
  const pair = findPair(quoteTokenIndex, USDC_TOKEN_INDEX, spotMeta.universe);
  if (!pair) return null;
  return mid(pair.index, allMids);
}

// USD price of a token. Prefers the direct token/USDC pair (no conversion
// error); falls back to any other quote pair, converting that quote to USD.
export function getSpotPrice(
  coin: string,
  spotMeta: SpotMeta | undefined,
  allMids: AllMids,
): number | null {
  if (coin === "USDC") return 1;
  if (!spotMeta || !allMids) return null;

  const tokenInfo = spotMeta.tokens.find((t) => t.name === coin);
  if (!tokenInfo) return null;

  // Prefer the direct USDC pair.
  const usdcPair = findPair(
    tokenInfo.index,
    USDC_TOKEN_INDEX,
    spotMeta.universe,
  );
  if (usdcPair) return mid(usdcPair.index, allMids);

  // No USDC pair: use any quote pair and convert that quote to USD.
  const anyPair = spotMeta.universe.find((u) => u.tokens[0] === tokenInfo.index);
  if (!anyPair) return null;

  const priceInQuote = mid(anyPair.index, allMids);
  if (priceInQuote === null) return null;

  const quoteUsd = quoteToUsd(anyPair.tokens[1], spotMeta, allMids);
  if (quoteUsd === null) return null;

  return priceInQuote * quoteUsd;
}
