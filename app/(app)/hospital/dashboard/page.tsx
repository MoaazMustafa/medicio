import { ComingSoon } from "@/components/coming-soon";

export const metadata = {
  title: "Hospital Portal",
};

export default function HospitalDashboardPage() {
  return (
    <ComingSoon
      eyebrow="Clinical Center Admin"
      title="Hospital Management Portal"
      description="Your facility workspace is being built. Hospital profile setup and affiliated provider management are not available yet."
      modules={[
        {
          code: "M5",
          name: "Hospital Profile",
          summary:
            "Configure facility details, services and search parameters used by patient discovery.",
        },
        {
          code: "M5",
          name: "Affiliated Providers",
          summary:
            "Manage linked doctors, labs and pharmacies as sections of your hospital record.",
        },
        {
          code: "M4",
          name: "Affiliation Requests",
          summary:
            "Send affiliation invitations to doctors and review incoming requests.",
        },
        {
          code: "M11",
          name: "Scraped Record Reconciliation",
          summary:
            "Claim a public listing for your facility so the verified record takes precedence.",
        },
      ]}
    />
  );
}
