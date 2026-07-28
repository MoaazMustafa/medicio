import { ComingSoon } from "@/components/coming-soon";

export const metadata = {
  title: "Pharmacy Portal",
};

export default function PharmacyDashboardPage() {
  return (
    <ComingSoon
      eyebrow="Pharmacy Portal"
      title="Pharmacy Management Portal"
      description="Your pharmacy workspace is being built. Inventory management and point-of-sale synchronisation are not available yet."
      modules={[
        {
          code: "M6",
          name: "Pharmacy Profile",
          summary:
            "Publish location and contact details so patients can find you within their search radius.",
        },
        {
          code: "M6",
          name: "Manual Inventory",
          summary:
            "Add and update medicine names, prices and stock levels directly from the dashboard.",
        },
        {
          code: "M6",
          name: "POS Synchronisation",
          summary:
            "Connect your point-of-sale system through a vendor adapter for scheduled stock syncing.",
        },
      ]}
    />
  );
}
