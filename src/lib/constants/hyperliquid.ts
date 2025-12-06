export const HYPERLIQUID_BRIDGE = {
  mainnet: "0x2df1c51e09aecf9cacb7bc98cb1742757f163df7" as `0x${string}`,
  testnet: "0x08cfc1B6b2dCF36A1480b99353A354AA8AC56f89" as `0x${string}`,
} as const;

export const USDC_ADDRESS = {
  arbitrum: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831" as `0x${string}`,
} as const;

export const USDC_DECIMALS = 6;
export const MIN_DEPOSIT = 5; // 5 USDC minimum

// ERC-20 ABI for USDC interactions
export const ERC20_ABI = [
  {
    name: "transfer",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "allowance",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;
