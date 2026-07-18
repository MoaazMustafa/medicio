import { NextRequest } from "next/server";

// Keep rate limits in memory
const rateLimitMap = new Map<string, Array<number>>();

export interface RateLimitOptions {
  limit: number;      // Maximum requests allowed in the window
  windowMs: number;   // Time window in milliseconds
}

/**
 * Returns true if request key exceeds limit within windowMs.
 */
export function rateLimit(key: string, options: RateLimitOptions): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(key) || [];

  // Filter out timestamps outside the active time window
  const activeTimestamps = timestamps.filter((time) => now - time < options.windowMs);

  if (activeTimestamps.length >= options.limit) {
    return true;
  }

  activeTimestamps.push(now);
  rateLimitMap.set(key, activeTimestamps);
  return false;
}

/**
 * Extracts a client IP from request headers.
 */
export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return "127.0.0.1";
}
