import { PatientDirectory } from "@/components/patient/patient-directory";

export const metadata = {
  title: "Healthcare Provider Directory & Discovery | Medicio",
  description:
    "Discover verified doctors, hospital clinical centers, licensed pharmacies, and diagnostic laboratories across the Medicio health network.",
};

export default function DirectoryPage() {
  return (
    <div className="h-[calc(100dvh-4rem)] overflow-hidden">
      <PatientDirectory />
    </div>
  );
}
