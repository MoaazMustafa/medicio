import type { UserRole } from "@prisma/client";
import { cookies } from "next/headers";

import type { SessionPayload } from "@/lib/jwt";
import { signJwt, verifyJwt } from "@/lib/jwt";
import {
  SESSION_COOKIE,
  SESSION_COOKIE_OPTIONS,
  SESSION_MAX_AGE_SECONDS,
} from "@/lib/session-cookie";

/**
 * The single place session cookies are issued, read and cleared.
 * Every protected surface resolves identity through here so no module
 * implements a parallel authorization path (Architecture.md §1, FR-IAM-05).
 */

export { SESSION_COOKIE };

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatarUrl?: string | null;
}

/** Resolves the verified session for the current request, or null. */
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) return null;

  return verifyJwt(token);
}

/** Issues a signed session cookie for the given user. */
export async function createSessionCookie(user: SessionUser): Promise<void> {
  const token = await signJwt({
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    avatarUrl: user.avatarUrl,
  });

  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE, token, {
    ...SESSION_COOKIE_OPTIONS,
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

/**
 * Returns a signed JWT for the given user without touching `cookies()`.
 * Route Handlers must set this token on the returned `NextResponse` themselves
 * because `cookies().set()` does not reliably propagate to the response on
 * Vercel's serverless runtime.
 */
export async function signSessionToken(user: SessionUser): Promise<string> {
  return signJwt({
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    avatarUrl: user.avatarUrl,
  });
}

/** Clears the session cookie. */
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.delete(SESSION_COOKIE);
}

/** Checks a resolved session against a list of permitted roles. */
export function hasRole(
  session: SessionPayload | null,
  allowedRoles: readonly UserRole[],
): boolean {
  return !!session && allowedRoles.includes(session.role);
}
