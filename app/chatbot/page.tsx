import { ComingSoon } from "@/components/coming-soon";

export const metadata = {
  title: "Patient Portal",
};

export default function ChatbotPage() {
  return (
    <ComingSoon
      eyebrow="Patient Workspace"
      title="Medicio Patient Portal"
      description="Your patient workspace is being built. The AI symptom checker is not connected to a clinical model yet, so no triage advice is available."
      modules={[
        {
          code: "M2",
          name: "AI Symptom Checker",
          summary:
            "Conversational intake covering symptoms, duration, medicines tried and prior treatment, returning a severity level and next steps. Advisory only.",
        },
        {
          code: "M3",
          name: "Specialty AI Agents",
          summary:
            "Scoped assistants bound to a specific doctor, hospital or lab, or to a medical specialty.",
        },
        {
          code: "M8",
          name: "Appointment Booking",
          summary:
            "Find doctors by specialty, availability and proximity, then book against published slots.",
        },
        {
          code: "M9",
          name: "Medicine Tracker",
          summary:
            "Log current medicines with dosage and schedule; this history feeds the symptom checker.",
        },
        {
          code: "M10",
          name: "Health Records",
          summary:
            "One consolidated view of lab reports, medicine history, appointments and past consultations.",
        },
      ]}
    />
  );
}
