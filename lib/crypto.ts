import crypto from "crypto";

/**
 * Hashes a password securely using Node's native scrypt algorithm.
 * Returns the hash prepended with its salt.
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

/**
 * Verifies a password against a stored salted hash.
 */
export function verifyPassword(password: string, storedValue: string): boolean {
  try {
    const [salt, key] = storedValue.split(":");
    if (!salt || !key) return false;
    const hash = crypto.scryptSync(password, salt, 64).toString("hex");
    const buffer1 = Buffer.from(hash, "hex");
    const buffer2 = Buffer.from(key, "hex");
    if (buffer1.length !== buffer2.length) return false;
    return crypto.timingSafeEqual(
      new Uint8Array(buffer1),
      new Uint8Array(buffer2)
    );
  } catch {
    return false;
  }
}

/** Minutes a one-time verification code stays valid. */
export const OTP_TTL_MINUTES = 15;

/**
 * Creates a cryptographically secure 6-digit one-time code and its expiry.
 * `Math.random()` is never used here — it is predictable and unsuitable for
 * account verification or password reset codes.
 */
export function createOtp(): { otp: string; expiresAt: Date } {
  return {
    otp: crypto.randomInt(0, 1_000_000).toString().padStart(6, "0"),
    expiresAt: new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000),
  };
}

/** Generates a URL-safe random token (used for OAuth state / placeholders). */
export function randomToken(bytes: number = 32): string {
  return crypto.randomBytes(bytes).toString("hex");
}
