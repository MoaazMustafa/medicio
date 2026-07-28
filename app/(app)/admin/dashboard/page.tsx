import { Card, Chip } from "@heroui/react";

import { UsersManager } from "@/components/admin/users-manager";

export const metadata = {
  title: "Admin Console",
};

const UPCOMING_SECTIONS = [
  {
    code: "M4",
    name: "Credential Verification Queue",
    summary: "Review and approve doctor credential submissions.",
  },
  {
    code: "M11",
    name: "Scraper Engine",
    summary: "Configure and run per-entity scrapers. Super Admin only.",
  },
  {
    code: "M12",
    name: "Audit Logs & Analytics",
    summary: "Query the audit trail and PostHog dashboards. Super Admin only.",
  },
  {
    code: "M1",
    name: "Custom Roles",
    summary: "Define roles with configurable permission sets.",
  },
] as const;

export default function AdminDashboardPage() {
  return (
    <section className="flex flex-col gap-8 py-12 md:py-16 max-w-6xl mx-auto px-4 w-full">
      {/* Header */}
      <div className="flex flex-col items-center text-center gap-3">
        <Chip
          variant="primary"
          color="accent"
          className="px-3 py-0.5 text-xs font-mono uppercase"
        >
          Administrator Console
        </Chip>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-text-primary">
          Administrator Control Panel
        </h1>
        <p className="text-sm text-text-secondary max-w-lg">
          Manage platform accounts today — verification queues, the scraper
          engine and audit tooling ship next.
        </p>
      </div>

      {/* Live: user administration */}
      <UsersManager />

      {/* Upcoming sections */}
      <div className="flex flex-col gap-3">
        <span className="text-[10px] uppercase font-mono tracking-wider text-text-secondary">
          Coming next to this console
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {UPCOMING_SECTIONS.map((section) => (
            <Card
              key={section.name}
              className="p-4 border border-border-custom bg-surface/30 flex flex-col gap-1.5"
            >
              <span className="w-fit text-[10px] font-mono font-bold text-primary bg-primary/10 border border-primary/30 rounded px-1.5 py-0.5">
                {section.code}
              </span>
              <h3 className="text-sm font-bold text-text-primary">
                {section.name}
              </h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                {section.summary}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
