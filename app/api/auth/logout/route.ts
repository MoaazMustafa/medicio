import { NextResponse } from "next/server";

import { writeAudit } from "@/lib/audit";
import { clearSessionCookie, getSession } from "@/lib/auth";
import { logAuthEvent } from "@/lib/logger";
import { SESSION_COOKIE } from "@/lib/session-cookie";

export async function POST() {
  try {
    const session = await getSession();

    if (session) {
      await writeAudit({
        action: "USER_LOGOUT_SUCCESS",
        actorId: session.userId,
        actorRole: session.role,
        entityType: "USER",
        entityId: session.userId,
        metadata: { email: session.email, name: session.name, role: session.role, reason: "MANUAL_LOGOUT" },
      });
    }

    await clearSessionCookie();

    const response = NextResponse.json({
      success: true,
      message: "Session cleared successfully.",
    });

    response.cookies.delete(SESSION_COOKIE);

    return response;
  } catch (error: any) {
    logAuthEvent("USER_LOGOUT_EXCEPTION", { error: error.message || error });
    console.error("Logout Error: ", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during logout." },
      { status: 500 }
    );
  }
}
