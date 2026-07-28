import type { NextRequest } from "next/server";

// Keep rate limits in memory.
// NOTE: this is per-instance only. A shared store (e.g. Redis) is required
// once the app runs on more than one serverless instance.
const rateLimitMap = new Map<string, Array<number>>();

const SWEEP_INTERVAL_MS = 60 * 1000;
const MAX_ENTRY_AGE_MS = 60 * 60 * 1000;

let lastSweepAt = Date.now();

/** Drops stale keys so the in-memory map cannot grow without bound. */
function sweep(now: number): void {
  if (now - lastSweepAt < SWEEP_INTERVAL_MS) return;

  lastSweepAt = now;

  rateLimitMap.forEach((timestamps, key) => {
    const newest = timestamps[timestamps.length - 1];

    if (newest === undefined || now - newest > MAX_ENTRY_AGE_MS) {
      rateLimitMap.delete(key);
    }
  });
}

export interface RateLimitOptions {
  limit: number;      // Maximum requests allowed in the window
  windowMs: number;   // Time window in milliseconds
}

/**
 * Returns true if request key exceeds limit within windowMs.
 */
export function rateLimit(key: string, options: RateLimitOptions): boolean {
  const now = Date.now();

  sweep(now);

  const timestamps = rateLimitMap.get(key) || [];

  // Filter out timestamps outside the active time window
  const activeTimestamps = timestamps.filter((time) => now - time < options.windowMs);

  if (activeTimestamps.length >= options.limit) {
    rateLimitMap.set(key, activeTimestamps);

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
