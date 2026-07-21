import { generateSecureToken, hashToken } from "../../src/utils/token.util";

describe("token.util", () => {
  it("generates a plaintext token whose hash matches hashToken(plainText)", () => {
    const { plainText, hash } = generateSecureToken(32);
    expect(hash).toBe(hashToken(plainText));
  });

  it("produces a hex string of the expected length for the given byte count", () => {
    const { plainText } = generateSecureToken(32);
    expect(plainText).toMatch(/^[0-9a-f]+$/);
    expect(plainText).toHaveLength(64); // 32 bytes -> 64 hex chars
  });

  it("produces different tokens on each call", () => {
    const a = generateSecureToken(32);
    const b = generateSecureToken(32);
    expect(a.plainText).not.toBe(b.plainText);
    expect(a.hash).not.toBe(b.hash);
  });

  it("hashToken is deterministic for the same input", () => {
    expect(hashToken("abc")).toBe(hashToken("abc"));
  });
});
