import { Suspense } from "react";

import { PatientDirectory } from "@/components/patient/patient-directory";

export const metadata = {
  title: "Healthcare Provider Directory & Discovery | Medicio",
  description:
    "Discover verified doctors, hospital clinical centers, licensed pharmacies, and diagnostic laboratories across Pakistan.",
};

export default function DirectoryPage() {
  return (
    <div className="h-[calc(100dvh-4rem)] overflow-hidden">
      <Suspense
        fallback={
          <div className="flex h-full w-full items-center justify-center p-8">
            <span className="h-8 w-8 animate-spin rounded-full border-3 border-primary border-t-transparent" />
          </div>
        }
      >
        <PatientDirectory />
      </Suspense>
    </div>
  );
}
