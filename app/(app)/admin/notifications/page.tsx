import { Button, Chip } from "@heroui/react";
import { Megaphone, ScrollText, ShieldCheck } from "lucide-react";
import NextLink from "next/link";
import { redirect } from "next/navigation";

import { BroadcastNotificationForm } from "@/components/admin/broadcast-notification-form";
import { getSession } from "@/lib/auth";

export const metadata = {
  title: "Admin Notification Broadcast Console",
  description: "Medicio Administrator Multi-Channel Push & Email Broadcast Console.",
};

export default async function AdminNotificationsPage() {
  const session = await getSession();

  if (!session || (session.role !== "ADMIN" && session.role !== "SUPER_ADMIN")) {
    redirect("/login?reason=forbidden");
  }

  const isSuperAdmin = session.role === "SUPER_ADMIN";

  return (
    <section className="w-full flex flex-col min-h-[calc(100vh-4rem)] p-4 md:p-8 max-w-[1400px] mx-auto gap-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-custom pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-text-primary flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-primary" />
            <span>Broadcast Alerts & Multi-Channel Console</span>
            <Chip variant="soft" color="accent" className="text-xs font-mono">
              Admin Suite
            </Chip>
          </h2>
          <p className="text-xs text-text-secondary mt-1">
            Create, target, and dispatch in-app notifications, browser Web Push alerts, and emails across user roles or specific user accounts.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {isSuperAdmin && (
            <NextLink href="/admin/audit-logs/broadcasts">
              <Button
                variant="outline"
                size="sm"
                className="text-xs font-semibold px-3 flex items-center gap-1.5"
              >
                <ScrollText className="w-4 h-4 text-primary" />
                <span>Broadcast History (Super Admin)</span>
              </Button>
            </NextLink>
          )}

          <Chip variant="soft" color="success" className="text-xs font-mono font-bold flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 inline mr-1" />
            VAPID & SMTP Active
          </Chip>
        </div>
      </div>

      {/* Broadcast Composer Section */}
      <BroadcastNotificationForm />
    </section>
  );
}
