import { PatientHealthRecords } from "@/components/patient/patient-health-records";

export const metadata = {
  title: "Health Records | Medicio",
  description:
    "Your complete Medicio health records — lab reports, appointment history, medicine log, and AI clinical triage sessions in one place.",
};

export default function HealthRecordsPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PatientHealthRecords />
    </div>
  );
}
