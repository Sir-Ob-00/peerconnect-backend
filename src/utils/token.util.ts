import crypto from "crypto";

/**
 * Used for refresh-token identifiers and password-reset tokens: generate a
 * random plaintext value to hand to the client, but only ever persist its
 * SHA-256 hash. Even a full database leak doesn't expose usable tokens.
 */
export function generateSecureToken(byteLength: number): { plainText: string; hash: string } {
  const plainText = crypto.randomBytes(byteLength).toString("hex");
  const hash = hashToken(plainText);
  return { plainText, hash };
}

export function hashToken(plainText: string): string {
  return crypto.createHash("sha256").update(plainText).digest("hex");
}
