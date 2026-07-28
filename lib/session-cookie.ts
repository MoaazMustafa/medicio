/**
 * Session cookie constants shared by the Edge runtime (middleware) and the
 * Node runtime (Route Handlers). Kept free of `next/headers` so middleware
 * can import it safely.
 */

export const SESSION_COOKIE = "medicio_session";

export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};
