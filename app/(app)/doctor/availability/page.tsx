import { DoctorLayoutWrapper } from "@/components/doctor/doctor-layout-wrapper";
import { DoctorAvailabilityForm } from "@/components/doctor/doctor-availability-form";

export const metadata = {
  title: "Schedule & Timetable — Doctor Portal | Medicio",
  description: "Configure practitioner consultation working days, shift hours, and slot duration.",
};

export default function DoctorAvailabilityPage() {
  return (
    <DoctorLayoutWrapper>
      <DoctorAvailabilityForm />
    </DoctorLayoutWrapper>
  );
}
