import { PatientMedicines } from "@/components/patient/patient-medicines";

export const metadata = {
  title: "Medicine Tracker | Medicio",
  description:
    "Log and manage your current medications. Your medicine history is automatically synced with your Medicio AI symptom checker intake.",
};

export default function MedicinesPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PatientMedicines />
    </div>
  );
}
