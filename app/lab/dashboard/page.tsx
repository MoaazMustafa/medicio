import { ComingSoon } from "@/components/coming-soon";

export const metadata = {
  title: "Lab Portal",
};

export default function LabDashboardPage() {
  return (
    <ComingSoon
      eyebrow="Lab Operator Panel"
      title="Lab Diagnostics Portal"
      description="Your diagnostics workspace is being built. Test catalogue management and patient report delivery are not available yet."
      modules={[
        {
          code: "M7",
          name: "Lab Profile & Certification",
          summary:
            "Publish your facility details and certification so patients and doctors can verify you.",
        },
        {
          code: "M7",
          name: "Test Catalogue",
          summary:
            "Maintain available diagnostic tests with pricing and expected wait times.",
        },
        {
          code: "M7",
          name: "Report Upload",
          summary:
            "Upload findings against a patient record so they appear directly in the Patient Portal.",
        },
        {
          code: "M3",
          name: "Entity-Scoped AI Agent",
          summary:
            "An assistant that answers questions only about your lab, its tests and turnaround times.",
        },
      ]}
    />
  );
}
