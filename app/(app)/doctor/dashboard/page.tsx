import { ComingSoon } from "@/components/coming-soon";

export const metadata = {
  title: "Doctor Portal",
};

export default function DoctorDashboardPage() {
  return (
    <ComingSoon
      eyebrow="Practitioner Panel"
      title="Doctor Control Portal"
      description="Your practitioner workspace is being built. Credential verification, availability and appointment management are not available yet."
      modules={[
        {
          code: "M4",
          name: "Profile & Credential Verification",
          summary:
            "Submit qualifications and licence details for admin review, then appear above unverified scraped listings.",
        },
        {
          code: "M4",
          name: "Availability Management",
          summary:
            "Publish your own consultation slots, including when affiliated with a hospital.",
        },
        {
          code: "M4",
          name: "Hospital Affiliation Requests",
          summary:
            "Request affiliation with a hospital, or accept requests sent to you.",
        },
        {
          code: "M8",
          name: "Appointment Management",
          summary:
            "Accept, reschedule, cancel and complete patient bookings against your published availability.",
        },
        {
          code: "M3",
          name: "Specialty AI Agent Training",
          summary:
            "Answer a specialty question set to scope a personal assistant that only speaks for your practice.",
        },
      ]}
    />
  );
}
