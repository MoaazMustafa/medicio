import { PatientAIRecords } from "@/components/patient/patient-ai-records";

export const metadata = {
  title: "Clinical AI Triage Records | Medicio",
  description: "View and manage your historical AI symptom evaluation reports and specialist referrals.",
};

export default function AIRecordsPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PatientAIRecords />
    </div>
  );
}
