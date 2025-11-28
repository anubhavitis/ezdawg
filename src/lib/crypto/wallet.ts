import { Wallet } from 'ethers';

/**
 * Generates a new random Ethereum wallet
 * @returns Object containing wallet address and private key
 */
export function generateAgentWallet() {
  const wallet = Wallet.createRandom();

  return {
    address: wallet.address,
    privateKey: wallet.privateKey,
  };
}

/**
 * Validates an Ethereum address format
 * @param address - Address to validate
 * @returns true if valid, false otherwise
 */
export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Validates a private key format
 * @param privateKey - Private key to validate
 * @returns true if valid, false otherwise
 */
export function isValidPrivateKey(privateKey: string): boolean {
  return /^0x[a-fA-F0-9]{64}$/.test(privateKey);
}
