import { PatientChatbot } from "@/components/patient/patient-chatbot";
import { PatientProvider } from "@/components/patient/patient-context";

export const metadata = {
  title: "AI Symptom Checker & Specialty Chatbot | Medicio",
  description:
    "AI-powered clinical triage, symptom intake, and specialty medical assistant for Medicio patients.",
};

export default function ChatbotPage() {
  return (
    <PatientProvider>
      {/* App header is h-16; lock the chat to the remaining viewport */}
      <div className="h-[calc(100dvh-4rem)] overflow-hidden">
        <PatientChatbot />
      </div>
    </PatientProvider>
  );
}
