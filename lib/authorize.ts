import type { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";

import { writeAudit } from "@/lib/audit";
import { getSession } from "@/lib/auth";
import type { SessionPayload } from "@/lib/jwt";
import { prisma } from "@/lib/prisma";

/**
 * Route Handler authorization guard (FR-IAM-05).
 * Resolves the session, re-checks the role server-side and — for privileged
 * surfaces — confirms the account is still active in the database, so a
 * deactivated admin cannot keep operating on a still-valid cookie.
 */

export type AuthorizeResult =
  | { session: SessionPayload; response?: undefined }
  | { session?: undefined; response: NextResponse };

export async function requireRole(
  allowedRoles: readonly UserRole[],
): Promise<AuthorizeResult> {
  const session = await getSession();

  if (!session) {
    return {
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  if (!allowedRoles.includes(session.role)) {
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

  // Privileged routes re-verify liveness against the database: role changes
  // and deactivations take effect immediately, not at cookie expiry.
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

    return {
      response: NextResponse.json(
        { error: "Session is no longer valid. Please sign in again." },
        { status: 401 },
      ),
    };
  }

  return { session };
}
