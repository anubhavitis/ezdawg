import { recoverMessageAddress } from "viem";

/**
 * Verify that a message was signed by a specific wallet address
 * @param walletAddress Expected signer address
 * @param message Original message that was signed
 * @param signature Signature to verify
 * @returns True if signature is valid, false otherwise
 */
export async function verifySignature(
  walletAddress: string,
  message: string,
  signature: string
): Promise<boolean> {
  try {
    const recoveredAddress = await recoverMessageAddress({
      message,
      signature: signature as `0x${string}`,
    });

    return recoveredAddress.toLowerCase() === walletAddress.toLowerCase();
  } catch (error) {
    console.error("Signature verification error:", error);
    return false;
  }
}
