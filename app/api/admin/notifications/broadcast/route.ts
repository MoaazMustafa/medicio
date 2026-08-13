import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { sendBulkBroadcastEmail } from "@/lib/email";
import { NOTIFICATION_TYPES, sendPushToUser } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "ADMIN" && session.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Forbidden. Admin access required." }, { status: 403 });
    }

    const body = await request.json();
    const {
      targetType, // "ALL" | "ROLE" | "USER"
      targetValue, // UserRole string (e.g. "PATIENT") or userId/email
      type = "SYSTEM",
      title,
      body: messageBody,
      href,
      channels = { inApp: true, webPush: true, email: false },
    } = body;

    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json({ error: "Notification title is required." }, { status: 400 });
    }

    if (!messageBody || typeof messageBody !== "string" || !messageBody.trim()) {
      return NextResponse.json({ error: "Notification body is required." }, { status: 400 });
    }

    // Resolve targeted users
    let whereClause: any = { isActive: true };

    if (targetType === "ROLE") {
      if (!targetValue) {
        return NextResponse.json({ error: "Target role is required when targeting by role." }, { status: 400 });
      }
      whereClause.role = targetValue;
    } else if (targetType === "USER") {
      if (!targetValue || (Array.isArray(targetValue) && targetValue.length === 0)) {
        return NextResponse.json({ error: "Target user ID(s) or email(s) required." }, { status: 400 });
      }

      if (Array.isArray(targetValue)) {
        const stringValues = targetValue.filter((v): v is string => typeof v === "string" && Boolean(v.trim()));
        const lowerValues = stringValues.map((v) => v.toLowerCase());
        whereClause.OR = [
          { id: { in: stringValues } },
          { email: { in: lowerValues } },
        ];
      } else {
        whereClause.OR = [
          { id: targetValue },
          { email: String(targetValue).toLowerCase() },
        ];
      }
    }

    const recipients = await prisma.user.findMany({
      where: whereClause,
      select: { id: true, email: true, name: true, role: true },
    });

    if (recipients.length === 0) {
      return NextResponse.json({ error: "No matching active users found for this target." }, { status: 404 });
    }

    let inAppCreated = 0;
    let webPushDelivered = 0;
    let emailDispatched = 0;

    // 1. Bulk create In-App notifications if enabled
    if (channels.inApp) {
      const recordsData = recipients.map((user) => ({
        userId: user.id,
        type: NOTIFICATION_TYPES.includes(type) ? type : "SYSTEM",
        title: title.trim(),
        body: messageBody.trim(),
        href: href?.trim() || null,
        metadata: {
          broadcastBy: session.userId,
          broadcastRole: session.role,
          targetType,
          targetValue: targetValue || "ALL",
        },
      }));

      const result = await prisma.notification.createMany({
        data: recordsData,
      });
      inAppCreated = result.count;
    }

    // 2. Fanout Web Push notifications if enabled
    if (channels.webPush) {
      const pushPayload = {
        title: title.trim(),
        body: messageBody.trim(),
        href: href?.trim() || undefined,
        type,
      };

      const pushResults = await Promise.all(
        recipients.map((user) => sendPushToUser(user.id, pushPayload))
      );
      webPushDelivered = pushResults.reduce((acc, curr) => acc + curr, 0);
    }

    const adminUser = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { name: true, email: true, role: true },
    });

    // 3. Single Bulk Email Dispatch via BCC if enabled
    if (channels.email) {
      const recipientEmails = Array.from(
        new Set(recipients.map((r) => r.email).filter(Boolean))
      );

      if (recipientEmails.length > 0) {
        const sent = await sendBulkBroadcastEmail({
          recipientEmails,
          title: title.trim(),
          bodyContent: messageBody.trim(),
          href: href?.trim() || undefined,
          category: type,
        }).catch(() => false);

        if (sent) {
          emailDispatched = recipientEmails.length;
        }
      }
    }

    // Log admin activity audit record with detailed execution summary
    await prisma.auditLog.create({
      data: {
        actorId: session.userId,
        actorRole: session.role,
        action: "ADMIN_NOTIFICATION_BROADCAST",
        entityType: "NOTIFICATION_BROADCAST",
        metadata: {
          senderName: adminUser?.name || "System Admin",
          senderEmail: adminUser?.email || "admin@medicio.app",
          senderRole: session.role,
          targetType,
          targetValue: targetValue || "ALL",
          recipientsCount: recipients.length,
          recipients: recipients.map((r) => ({ id: r.id, name: r.name, email: r.email, role: r.role })),
          title: title.trim(),
          body: messageBody.trim(),
          href: href?.trim() || null,
          type,
          channels,
          inAppCreated,
          webPushDelivered,
          emailDispatched,
          dispatchedAt: new Date().toISOString(),
        },
      },
    }).catch(() => undefined);

    return NextResponse.json({
      success: true,
      targetCount: recipients.length,
      inAppCreated,
      webPushDelivered,
      emailDispatched,
    });
  } catch (error: any) {
    console.error("[ADMIN BROADCAST ERROR]", error);
    return NextResponse.json({ error: error.message || "Failed to broadcast notification" }, { status: 500 });
  }
}
