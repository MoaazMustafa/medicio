import { DoctorLayoutWrapper } from "@/components/doctor/doctor-layout-wrapper";
import { DoctorAffiliationsForm } from "@/components/doctor/doctor-affiliations-form";

export const metadata = {
  title: "Hospital Network & Affiliations — Doctor Portal | Medicio",
  description: "Bidirectional hospital network affiliation requests and clinic linkage.",
};

export default function DoctorAffiliationsPage() {
  return (
    <DoctorLayoutWrapper>
      <DoctorAffiliationsForm />
    </DoctorLayoutWrapper>
  );
}
