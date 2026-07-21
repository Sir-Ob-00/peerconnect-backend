import bcrypt from "bcrypt";
import { env } from "../config/env";

/** Hashes a plaintext password for storage. Never store or log the plaintext. */
export async function hashPassword(plainText: string): Promise<string> {
  return bcrypt.hash(plainText, env.BCRYPT_SALT_ROUNDS);
}

/** Compares a plaintext password against a stored bcrypt hash. */
export async function comparePassword(plainText: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plainText, hash);
}
