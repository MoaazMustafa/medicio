import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { writeAudit } from "@/lib/audit";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import {
  pushSubscriptionSchema,
  removePushSubscriptionSchema,
} from "@/lib/validations/notifications";

/**
 * Web Push subscription registry for the signed-in user.
 * POST   — register/refresh this browser's subscription
 * DELETE — remove a subscription (browser opted out)
 */

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (
      rateLimit(`rate_push_subscribe_${session.userId}`, {
        limit: 10,
        windowMs: 60 * 1000,
      })
    ) {
      return NextResponse.json(
        { error: "Too many subscription attempts. Please try again shortly." },
        { status: 429 },
      );
    }

    const parsed = pushSubscriptionSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid subscription payload" }, { status: 400 });
    }

    const { subscription } = parsed.data;
    const userAgent = request.headers.get("user-agent")?.slice(0, 255) ?? null;

    // Upsert on the endpoint: a browser endpoint is unique, and if another
    // account signs in on the same browser the subscription follows it.
    await prisma.pushSubscription.upsert({
      where: { endpoint: subscription.endpoint },
      create: {
        userId: session.userId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        userAgent,
      },
      update: {
        userId: session.userId,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        userAgent,
      },
    });

    await writeAudit({
      action: "NOTIFICATION_PUSH_SUBSCRIBED",
      actorId: session.userId,
      actorRole: session.role,
      entityType: "USER",
      entityId: session.userId,
      ip: getClientIp(request),
      metadata: { userAgent },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to register push subscription" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parsed = removePushSubscriptionSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const result = await prisma.pushSubscription.deleteMany({
      where: { endpoint: parsed.data.endpoint, userId: session.userId },
    });

    if (result.count > 0) {
      await writeAudit({
        action: "NOTIFICATION_PUSH_UNSUBSCRIBED",
        actorId: session.userId,
        actorRole: session.role,
        entityType: "USER",
        entityId: session.userId,
        ip: getClientIp(request),
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to remove push subscription" },
      { status: 500 },
    );
  }
}
