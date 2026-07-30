import { DashboardMetrics } from "@/components/admin/dashboard-metrics";

export const metadata = {
  title: "Admin Overview",
  description: "Medicio Administrator Analytics, User Activity Trends & Infrastructure Metrics.",
};

export default function AdminDashboardPage() {
  return (
    <section className="w-full flex flex-col min-h-[calc(100vh-4rem)]">
      <DashboardMetrics />
    </section>
  );
}
