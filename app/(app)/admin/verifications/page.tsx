import { AdminVerificationsManager } from "@/components/admin/admin-verifications";
import { ShieldCheck } from "lucide-react";

export const metadata = {
  title: "Doctor Verifications — Admin",
  description: "Review practitioner credentials and medical license approvals.",
};

export default function AdminVerificationsPage() {
  return (
    <section className="w-full flex flex-col min-h-[calc(100vh-4rem)] p-4 md:p-8 max-w-[1600px] mx-auto gap-6">
      <div className="flex flex-col gap-1 border-b border-border-custom pb-4">
        <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
          <ShieldCheck className="w-7 h-7 text-amber-500" />
          <span>Doctor Credential Verification Queue (M4)</span>
        </h1>
        <p className="text-xs text-text-secondary">
          Review medical licenses, degree certificates, and specialty credentials submitted by registering practitioners.
        </p>
      </div>

      <AdminVerificationsManager />
    </section>
  );
}
