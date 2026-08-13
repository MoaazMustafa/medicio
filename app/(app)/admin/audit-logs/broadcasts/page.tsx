import { Card, Chip } from "@heroui/react";
import { BellRing, Globe, Mail, Megaphone, ScrollText, ShieldAlert, ShieldCheck } from "lucide-react";
import { redirect } from "next/navigation";

import { BroadcastHistoryTable } from "@/components/admin/broadcast-history-table";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Broadcast Audit Logs | Medicio Super Admin",
  description: "Super Admin Broadcast & Email Dispatch Audit History Console.",
};

export default async function BroadcastAuditLogsPage() {
  const session = await getSession();

  // Strictly restricted to SUPER_ADMIN only
  if (!session || session.role !== "SUPER_ADMIN") {
    redirect("/admin/notifications?reason=forbidden_super_admin_only");
  }

  // Fetch recent broadcast activity audit logs
  const rawLogs = await prisma.auditLog.findMany({
    where: {
      action: { in: ["ADMIN_NOTIFICATION_BROADCAST", "EMAIL_NOTIFICATION_DISPATCH"] },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
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
            <ScrollText className="w-6 h-6 text-primary" />
            <span>Broadcast Audit Logs & Inspection</span>
            <Chip variant="soft" color="danger" className="text-xs font-mono font-bold">
              SUPER ADMIN ONLY
            </Chip>
          </h2>
          <p className="text-xs text-text-secondary mt-1">
            Complete audit trail of all administrative broadcast notifications, Web Push fanouts, and bulk email dispatches.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Chip variant="soft" color="success" className="text-xs font-mono font-bold flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 inline mr-1" />
            RBAC Guarded
          </Chip>
        </div>
      </div>

      {/* Hero Overview Metrics Bento Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 border border-border-custom bg-surface/50 backdrop-blur-md flex items-center justify-between shadow-md">
          <div>
            <span className="text-xs font-mono text-text-secondary block">Total Dispatches Logged</span>
            <span className="text-2xl font-bold text-text-primary mt-1 block">{totalDispatches}</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary">
            <Megaphone className="w-6 h-6" />
          </div>
        </Card>

        <Card className="p-5 border border-border-custom bg-surface/50 backdrop-blur-md flex items-center justify-between shadow-md">
          <div>
            <span className="text-xs font-mono text-text-secondary block">In-App Created</span>
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
            <span className="text-xs font-mono text-text-secondary block">Bulk Emails Sent</span>
            <span className="text-2xl font-bold text-amber-400 mt-1 block">{totalEmails}</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Mail className="w-6 h-6" />
          </div>
        </Card>
      </div>

      {/* Broadcast History Table & Inspector */}
      <BroadcastHistoryTable logs={logs} />
    </section>
  );
}
