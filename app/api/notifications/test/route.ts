import { NextResponse } from "next/server";

import { dashboardForRole } from "@/config/roles";
import { getSession } from "@/lib/auth";
import { isPushConfigured, notify } from "@/lib/notifications";
import { rateLimit } from "@/lib/rate-limit";

/**
 * Sends the caller a sample notification (in-app + push) so they can verify
 * their setup end-to-end. Self-targeted only, lightly rate limited.
 */

export async function POST() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (
      rateLimit(`rate_notification_test_${session.userId}`, {
        limit: 5,
        windowMs: 60 * 1000,
      })
    ) {
      return NextResponse.json(
        { error: "Too many test notifications. Please wait a minute." },
        { status: 429 },
      );
    }

    const pushConfigured = isPushConfigured();

    const notification = await notify({
      userId: session.userId,
      type: "SYSTEM",
      title: "Test notification",
      body: pushConfigured
        ? "Notifications are working. If browser notifications are enabled, this also arrived as a push message — even with the tab closed."
        : "In-app notifications are working. Configure VAPID keys to enable browser push delivery as well.",
      href: dashboardForRole(session.role),
      metadata: { test: true, requestedAt: new Date().toISOString() },
    });

    return NextResponse.json({
      success: Boolean(notification),
      pushConfigured,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to send test notification" },
      { status: 500 },
    );
  }
}
