import { comparePassword, hashPassword } from "../../src/utils/password.util";

describe("password.util", () => {
  it("hashes a password to something other than the plaintext", async () => {
    const hash = await hashPassword("Str0ng!Pass");
    expect(hash).not.toBe("Str0ng!Pass");
    expect(hash.length).toBeGreaterThan(20);
  });

  it("verifies a correct password against its hash", async () => {
    const hash = await hashPassword("Str0ng!Pass");
    await expect(comparePassword("Str0ng!Pass", hash)).resolves.toBe(true);
  });

  it("rejects an incorrect password against the hash", async () => {
    const hash = await hashPassword("Str0ng!Pass");
    await expect(comparePassword("WrongPass1!", hash)).resolves.toBe(false);
  });

  it("produces a different hash for the same password on each call (random salt)", async () => {
    const [a, b] = await Promise.all([hashPassword("Str0ng!Pass"), hashPassword("Str0ng!Pass")]);
    expect(a).not.toBe(b);
  });
});
