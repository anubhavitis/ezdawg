export interface SpotAsset {
  name: string;
  index: number;
  tokens: number[];
  szDecimals: number;
}

export interface SpotBalance {
  coin: string;
  hold: string;
  total: string;
  entryNtl: string;
}

export interface SpotClearinghouseState {
  balances: SpotBalance[];
}

export interface OrderResult {
  success: boolean;
  orderId?: string;
  status?: any;
  price: number;
  tokensAcquired: number;
  assetName: string;
}

export interface SpotMetadata {
  universe: SpotAsset[];
  tokens: Array<{
    name: string;
    szDecimals: number;
    weiDecimals: number;
    index: number;
    tokenId: string;
    isCanonical: boolean;
  }>;
}
