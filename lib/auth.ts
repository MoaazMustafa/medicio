import type { UserRole } from "@prisma/client";
import { cookies } from "next/headers";

import type { SessionPayload } from "@/lib/jwt";
import { signJwt, verifyJwt } from "@/lib/jwt";
import { prisma } from "@/lib/prisma";
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

/**
 * Resolves the verified session for the current request, or null.
 * Validates JWT signature and confirms the account exists in PostgreSQL
 * and is active (isActive = true). If the account was deleted or deactivated,
 * returns NULL immediately.
 */
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) return null;

  const payload = await verifyJwt(token);
  if (!payload) return null;

  try {
    const account = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, isActive: true, role: true },
    });

    // If account was deleted or deactivated by an admin, return null immediately.
    if (!account || !account.isActive) {
      // Best-effort cookie deletion (succeeds in Route Handlers / Server Actions)
      try {
        cookieStore.delete(SESSION_COOKIE);
      } catch {
        // Ignored in read-only Server Component renders
      }
      return null;
    }
  } catch (error) {
    console.error("Session database liveness check error: ", error);
    // On DB failure, strictly reject stale session if user lookup failed
    return null;
  }

  return payload;
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

  try {
    cookieStore.delete(SESSION_COOKIE);
  } catch {
    // Read-only fallback
  }
}

/** Checks a resolved session against a list of permitted roles. */
export function hasRole(
  session: SessionPayload | null,
  allowedRoles: readonly UserRole[],
): boolean {
  return !!session && allowedRoles.includes(session.role);
}
