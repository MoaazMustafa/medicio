import { Button, Card, Chip } from "@heroui/react";
import { CheckCircle2, ShieldCheck, Sparkles, UserCheck } from "lucide-react";

export const metadata = {
  title: "Doctor Verifications",
  description: "Review practitioner credentials and medical license approvals.",
};

export default function AdminVerificationsPage() {
  return (
    <section className="w-full flex flex-col min-h-[calc(100vh-4rem)] p-4 md:p-8 max-w-[1600px] mx-auto gap-6">
      <Card className="p-6 border border-border-custom bg-surface/50 backdrop-blur-md flex flex-col gap-6 shadow-lg">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-custom pb-4">
          <div>
            <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-amber-500" />
              <span>Doctor Credential Verification Queue (M4)</span>
            </h2>
            <p className="text-xs text-text-secondary mt-1">
              Review practice licenses, medical degree certificates & specialty credentials submitted by registering practitioners.
            </p>
          </div>

          <Button variant="primary" className="text-xs font-semibold px-4 w-fit">
            Process Pending Queue
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-5 border border-border-custom bg-background-custom/40 flex flex-col gap-2">
            <span className="text-xs font-mono uppercase text-amber-400 font-semibold">Pending Approvals</span>
            <span className="text-3xl font-extrabold text-text-primary">0 Requests</span>
            <p className="text-xs text-text-secondary">No unverified doctor licenses currently awaiting manual review.</p>
          </Card>
          <Card className="p-5 border border-border-custom bg-background-custom/40 flex flex-col gap-2">
            <span className="text-xs font-mono uppercase text-emerald-400 font-semibold">Verified Practitioners</span>
            <span className="text-3xl font-extrabold text-text-primary">184 Active</span>
            <p className="text-xs text-text-secondary">Fully credentialed doctors active on the Medicio platform.</p>
          </Card>
          <Card className="p-5 border border-border-custom bg-background-custom/40 flex flex-col gap-2">
            <span className="text-xs font-mono uppercase text-sky-400 font-semibold">Verification SLA</span>
            <span className="text-3xl font-extrabold text-text-primary font-mono">&lt; 24 Hours</span>
            <p className="text-xs text-text-secondary">Target turnaround time for practitioner onboarding.</p>
          </Card>
        </div>

        {/* Roadmap & Coming Soon Bullet Points */}
        <div className="mt-4 p-6 border border-border-custom bg-background-custom/30 rounded-xl flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-border-custom/60 pb-3">
            <Sparkles className="w-5 h-5 text-primary" />
            <h3 className="text-sm font-bold text-text-primary">Upcoming Doctor Verification Features (Roadmap)</h3>
            <Chip variant="soft" color="accent" className="text-[10px] font-mono ml-auto">
              Coming Soon
            </Chip>
          </div>

          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-text-secondary">
            <li className="flex items-start gap-2 p-3 rounded-lg bg-surface/50 border border-border-custom/50">
              <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <div>
                <strong className="text-text-primary block mb-0.5">Automated Medical Council API Verification</strong>
                Direct lookup integration with national medical registration boards for real-time license validation.
              </div>
            </li>
            <li className="flex items-start gap-2 p-3 rounded-lg bg-surface/50 border border-border-custom/50">
              <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <div>
                <strong className="text-text-primary block mb-0.5">PDF Degree & Certificate Document Viewer</strong>
                Embedded inline PDF document previewer modal with zoom and digital stamp overlays.
              </div>
            </li>
            <li className="flex items-start gap-2 p-3 rounded-lg bg-surface/50 border border-border-custom/50">
              <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <div>
                <strong className="text-text-primary block mb-0.5">One-Click Practitioner Badge Issue</strong>
                Instant verification status badge issuing and automated SMS/Email notification dispatch.
              </div>
            </li>
            <li className="flex items-start gap-2 p-3 rounded-lg bg-surface/50 border border-border-custom/50">
              <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <div>
                <strong className="text-text-primary block mb-0.5">Rejection Reason Composer</strong>
                Pre-formatted rejection feedback selector for incomplete credential submissions.
              </div>
            </li>
          </ul>
        </div>
      </Card>
    </section>
  );
}
