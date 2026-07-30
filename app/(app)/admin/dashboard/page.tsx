import { AdminDashboardTabs } from "@/components/admin/admin-dashboard-tabs";

export const metadata = {
  title: "Admin Console",
  description: "Medicio Administrator Control Panel for accounts, verifications, scrapers, and audit logs.",
};

export default function AdminDashboardPage() {
  return (
    <section className="w-full flex flex-col min-h-[calc(100vh-4rem)]">
      <AdminDashboardTabs />
    </section>
  );
}
