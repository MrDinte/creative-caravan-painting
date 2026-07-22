import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt) as (
  password: string,
  salt: string,
  keylen: number
) => Promise<Buffer>;

const KEY_LEN = 64;

/**
 * Password hashing on Node's built-in scrypt — no native dependency, which
 * keeps the Vercel build simple. Format: "<saltHex>:<hashHex>".
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derived = await scryptAsync(password, salt, KEY_LEN);
  return `${salt}:${derived.toString("hex")}`;
}

export async function verifyPassword(
  password: string,
  stored: string
): Promise<boolean> {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;

  const derived = await scryptAsync(password, salt, KEY_LEN);
  const expected = Buffer.from(hash, "hex");
  // Length check first: timingSafeEqual throws on a mismatch.
  if (expected.length !== derived.length) return false;
  return timingSafeEqual(expected, derived);
}

export function passwordProblem(password: string): string | null {
  if (password.length < 8) return "Password must be at least 8 characters.";
  return null;
}
