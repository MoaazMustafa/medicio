import { Card, Chip } from "@heroui/react";
import { BellRing, Globe, Mail, Megaphone, ScrollText, ShieldCheck, Sparkles, Users } from "lucide-react";
import { redirect } from "next/navigation";

import { BroadcastHistoryTable } from "@/components/admin/broadcast-history-table";
import { BroadcastNotificationForm } from "@/components/admin/broadcast-notification-form";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Admin Notification Broadcast Console",
  description: "Medicio Administrator Multi-Channel Push & Email Broadcast Console.",
};

export default async function AdminNotificationsPage() {
  const session = await getSession();

  if (!session || (session.role !== "ADMIN" && session.role !== "SUPER_ADMIN")) {
    redirect("/login?reason=forbidden");
  }

  // Fetch recent broadcast activity logs
  const rawLogs = await prisma.auditLog.findMany({
    where: {
      action: { in: ["ADMIN_NOTIFICATION_BROADCAST", "EMAIL_NOTIFICATION_DISPATCH"] },
    },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  // Batch resolve user details for sender (actorId) and recipient (entityId)
  const actorIds = Array.from(new Set(rawLogs.map((l) => l.actorId).filter(Boolean))) as string[];
  const entityIds = Array.from(new Set(rawLogs.map((l) => l.entityId).filter(Boolean))) as string[];
  const allUserIds = Array.from(new Set([...actorIds, ...entityIds]));

  const users = await prisma.user.findMany({
    where: { id: { in: allUserIds } },
    select: { id: true, name: true, email: true, role: true },
  });

  const userMap = new Map(users.map((u) => [u.id, u]));

  const logs = rawLogs.map((log) => {
    const meta = (log.metadata as Record<string, any>) || {};
    const sender = log.actorId ? userMap.get(log.actorId) : null;
    const recipient = log.entityId ? userMap.get(log.entityId) : null;

    return {
      ...log,
      createdAt: log.createdAt.toISOString(),
      senderName: meta.senderName || sender?.name || "System Admin",
      senderEmail: meta.senderEmail || sender?.email || "admin@medicio.app",
      senderRole: meta.senderRole || sender?.role || log.actorRole || "ADMIN",
      recipientName: meta.recipientName || recipient?.name || null,
      recipientEmail: meta.recipientEmail || recipient?.email || null,
      recipientRole: meta.recipientRole || recipient?.role || null,
    };
  });

  // Aggregate metrics stats for hero cards
  const totalDispatches = logs.length;
  let totalInApp = 0;
  let totalPush = 0;
  let totalEmails = 0;

  logs.forEach((log) => {
    const meta = (log.metadata as Record<string, any>) || {};
    totalInApp += meta.inAppCreated || (log.action === "ADMIN_NOTIFICATION_BROADCAST" ? meta.recipientsCount || 1 : 0);
    totalPush += meta.webPushDelivered || 0;
    totalEmails += meta.emailDispatched || (log.action === "EMAIL_NOTIFICATION_DISPATCH" ? 1 : 0);
  });

  return (
    <section className="w-full flex flex-col min-h-[calc(100vh-4rem)] p-4 md:p-8 max-w-[1600px] mx-auto gap-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-custom pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-text-primary flex items-center gap-2">
            <span>Broadcast Alerts & Multi-Channel Console</span>
            <Chip variant="soft" color="accent" className="text-xs font-mono">
              Admin Suite
            </Chip>
          </h2>
          <p className="text-xs text-text-secondary mt-1">
            Create, target, and dispatch in-app notifications, browser Web Push alerts, and emails across user roles or specific user accounts.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Chip variant="soft" color="success" className="text-xs font-mono font-bold flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 inline mr-1" />
            VAPID & SMTP Active
          </Chip>
        </div>
      </div>

      {/* Hero Overview Metrics Bento Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 border border-border-custom bg-surface/50 backdrop-blur-md flex items-center justify-between shadow-md">
          <div>
            <span className="text-xs font-mono text-text-secondary block">Total Dispatches</span>
            <span className="text-2xl font-bold text-text-primary mt-1 block">{totalDispatches}</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary">
            <Megaphone className="w-6 h-6" />
          </div>
        </Card>

        <Card className="p-5 border border-border-custom bg-surface/50 backdrop-blur-md flex items-center justify-between shadow-md">
          <div>
            <span className="text-xs font-mono text-text-secondary block">In-App Notifications</span>
            <span className="text-2xl font-bold text-primary mt-1 block">{totalInApp}</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary">
            <BellRing className="w-6 h-6" />
          </div>
        </Card>

        <Card className="p-5 border border-border-custom bg-surface/50 backdrop-blur-md flex items-center justify-between shadow-md">
          <div>
            <span className="text-xs font-mono text-text-secondary block">Web Push Delivered</span>
            <span className="text-2xl font-bold text-sky-400 mt-1 block">{totalPush}</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400">
            <Globe className="w-6 h-6" />
          </div>
        </Card>

        <Card className="p-5 border border-border-custom bg-surface/50 backdrop-blur-md flex items-center justify-between shadow-md">
          <div>
            <span className="text-xs font-mono text-text-secondary block">Email Alerts Sent</span>
            <span className="text-2xl font-bold text-amber-400 mt-1 block">{totalEmails}</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Mail className="w-6 h-6" />
          </div>
        </Card>
      </div>

      {/* Broadcast Composer Section */}
      <BroadcastNotificationForm />

      {/* History Inspector Table */}
      <div className="flex flex-col gap-4 border-t border-border-custom pt-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
              <ScrollText className="w-5 h-5 text-primary" />
              <span>Broadcast Activity & Audit History</span>
            </h3>
            <p className="text-xs text-text-secondary mt-0.5">
              Click any log record to inspect the complete payload, recipient breakdown, and channel delivery metrics.
            </p>
          </div>
        </div>

        <BroadcastHistoryTable logs={logs} />
      </div>
    </section>
  );
}
