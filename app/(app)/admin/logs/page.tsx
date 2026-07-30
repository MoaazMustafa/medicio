import { Button, Card, Chip } from "@heroui/react";
import { CheckCircle2, FileSpreadsheet, Sparkles } from "lucide-react";

export const metadata = {
  title: "Audit Logs & Telemetry",
  description: "View system audit trails, RBAC action logs, and PostHog analytics.",
};

export default function AdminLogsPage() {
  return (
    <section className="w-full flex flex-col min-h-[calc(100vh-4rem)] p-4 md:p-8 max-w-[1600px] mx-auto gap-6">
      <Card className="p-6 border border-border-custom bg-surface/50 backdrop-blur-md flex flex-col gap-6 shadow-lg">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-custom pb-4">
          <div>
            <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
              <FileSpreadsheet className="w-6 h-6 text-emerald-400" />
              <span>Audit Trails & PostHog Analytics (M12)</span>
            </h2>
            <p className="text-xs text-text-secondary mt-1">
              Super Admin auditable logging of platform actions, database modifications, RBAC permissions & PostHog telemetry.
            </p>
          </div>

          <Button variant="outline" className="text-xs font-semibold px-4 text-text-primary w-fit">
            Export Log Archive
          </Button>
        </div>

        {/* Status Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-5 border border-border-custom bg-background-custom/40 flex flex-col gap-2">
            <span className="text-xs font-mono uppercase text-emerald-400 font-semibold">Audit Store Status</span>
            <span className="text-2xl font-bold text-text-primary">Writing Audit Trail</span>
            <p className="text-xs text-text-secondary">Logging every user modification with IP, actor role & before/after delta.</p>
          </Card>
          <Card className="p-5 border border-border-custom bg-background-custom/40 flex flex-col gap-2">
            <span className="text-xs font-mono uppercase text-primary font-semibold">PostHog Analytics</span>
            <span className="text-2xl font-bold text-text-primary">Connected</span>
            <p className="text-xs text-text-secondary">Tracking product conversion funnels, triage logs & appointment events.</p>
          </Card>
          <Card className="p-5 border border-border-custom bg-background-custom/40 flex flex-col gap-2">
            <span className="text-xs font-mono uppercase text-purple-400 font-semibold">Security Access</span>
            <span className="text-2xl font-bold text-text-primary">Super Admin Only</span>
            <p className="text-xs text-text-secondary">Strictly restricted access enforcing HIPAA & GDPR compliance.</p>
          </Card>
        </div>

        {/* Roadmap & Coming Soon Bullet Points */}
        <div className="mt-4 p-6 border border-border-custom bg-background-custom/30 rounded-xl flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-border-custom/60 pb-3">
            <Sparkles className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-bold text-text-primary">Upcoming Audit Logging & Telemetry Features (Roadmap)</h3>
            <Chip variant="soft" color="success" className="text-[10px] font-mono ml-auto">
              Coming Soon
            </Chip>
          </div>

          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-text-secondary">
            <li className="flex items-start gap-2 p-3 rounded-lg bg-surface/50 border border-border-custom/50">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-text-primary block mb-0.5">Full-Text Audit Search & IP Filter</strong>
                Query interface to filter audit events by acting user ID, target entity, action type, or client IP.
              </div>
            </li>
            <li className="flex items-start gap-2 p-3 rounded-lg bg-surface/50 border border-border-custom/50">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-text-primary block mb-0.5">Embedded PostHog Dashboard Widgets</strong>
                Live product metrics, conversational intake conversion charts & active user session dashboards.
              </div>
            </li>
            <li className="flex items-start gap-2 p-3 rounded-lg bg-surface/50 border border-border-custom/50">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-text-primary block mb-0.5">Security Anomaly Detection Alerts</strong>
                Automated notification triggers for multi-failed login attempts or unauthorized RBAC privilege escalation.
              </div>
            </li>
            <li className="flex items-start gap-2 p-3 rounded-lg bg-surface/50 border border-border-custom/50">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-text-primary block mb-0.5">CSV & JSON Audit Export Builder</strong>
                One-click export tool generating signed compliance audit reports for external healthcare auditors.
              </div>
            </li>
          </ul>
        </div>
      </Card>
    </section>
  );
}
