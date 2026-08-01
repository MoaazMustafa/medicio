import { DoctorLayoutWrapper } from "@/components/doctor/doctor-layout-wrapper";
import { DoctorDirectoryView } from "@/components/doctor/doctor-directory-view";

export const metadata = {
  title: "Medical Directory — Doctor Portal | Medicio",
  description: "Browse registered and scraped practitioner listings across medical specialties.",
};

export default function DoctorDirectoryPage() {
  return (
    <DoctorLayoutWrapper>
      <DoctorDirectoryView />
    </DoctorLayoutWrapper>
  );
}
