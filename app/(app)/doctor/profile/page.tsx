import { DoctorLayoutWrapper } from "@/components/doctor/doctor-layout-wrapper";
import { DoctorProfileForm } from "@/components/doctor/doctor-profile-form";

export const metadata = {
  title: "Credentials & License — Doctor Portal | Medicio",
  description: "Manage medical credentials, education, license verification, and practitioner profile.",
};

export default function DoctorProfilePage() {
  return (
    <DoctorLayoutWrapper>
      <DoctorProfileForm />
    </DoctorLayoutWrapper>
  );
}
