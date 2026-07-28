import { ComingSoon } from "@/components/coming-soon";

export const metadata = {
  title: "Admin Console",
};

export default function AdminDashboardPage() {
  return (
    <ComingSoon
      eyebrow="Administrator Console"
      title="Administrator Control Panel"
      description="The administration console is being built. Verification queues, the scraper engine and audit tooling are not available yet."
      modules={[
        {
          code: "M1",
          name: "User & Role Administration",
          summary:
            "Manage accounts and define custom roles beyond the predefined set (Super Admin only).",
        },
        {
          code: "M4",
          name: "Credential Verification Queue",
          summary:
            "Review submitted doctor credentials and approve or reject registrations.",
        },
        {
          code: "M11",
          name: "Data Aggregation & Scraper Engine",
          summary:
            "Configure and run per-entity scrapers, with verified records always taking precedence over scraped ones. Super Admin only.",
        },
        {
          code: "M12",
          name: "Audit Logs & Analytics",
          summary:
            "Inspect the audit trail of user actions and product analytics dashboards. Super Admin only.",
        },
      ]}
    />
  );
}
