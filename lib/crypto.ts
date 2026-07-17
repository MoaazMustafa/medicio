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
    return hash === key;
  } catch {
    return false;
  }
}
