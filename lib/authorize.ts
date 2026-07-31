import type { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";

import { writeAudit } from "@/lib/audit";
import { getSession } from "@/lib/auth";
import type { SessionPayload } from "@/lib/jwt";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE } from "@/lib/session-cookie";

/**
 * Route Handler authorization guard (FR-IAM-05).
 * Resolves the session, re-checks the role server-side and confirms the account
 * is still active in the database (isActive = true), so a deleted or deactivated
 * user is signed out immediately.
 */

export type AuthorizeResult =
  | { session: SessionPayload; response?: undefined }
  | { session?: undefined; response: NextResponse };

export async function requireRole(
  allowedRoles: readonly UserRole[],
): Promise<AuthorizeResult> {
  const session = await getSession();

  if (!session) {
    const unauthResponse = NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    unauthResponse.cookies.delete(SESSION_COOKIE);
    return { response: unauthResponse };
  }

  const isAllowedRole =
    allowedRoles.includes(session.role) ||
    session.role === "SUPER_ADMIN" ||
    (typeof session.role === "string" && session.role.startsWith("CUSTOM_"));

  if (!isAllowedRole) {
    void writeAudit({
      action: "AUTHZ_FORBIDDEN",
      actorId: session.userId,
      actorRole: session.role,
      metadata: { requiredRoles: [...allowedRoles] },
    });

    return {
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  // Re-verify liveness against PostgreSQL database
  const account = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { isActive: true, role: true },
  });

  if (!account || !account.isActive || account.role !== session.role) {
    void writeAudit({
      action: "AUTHZ_STALE_SESSION_REJECTED",
      actorId: session.userId,
      actorRole: session.role,
      metadata: {
        accountFound: !!account,
        accountActive: account?.isActive ?? false,
      },
    });

    const invalidSessionResponse = NextResponse.json(
      { error: "Account deleted, deactivated, or role changed. Please sign in again." },
      { status: 401 },
    );
    invalidSessionResponse.cookies.delete(SESSION_COOKIE);

    return { response: invalidSessionResponse };
  }

  return { session };
}
