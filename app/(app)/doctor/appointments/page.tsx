import { DoctorAppointmentsManager } from "@/components/doctor/doctor-appointments-manager";
import { DoctorLayoutWrapper } from "@/components/doctor/doctor-layout-wrapper";

export const metadata = {
  title: "Patient Appointments — Doctor Portal | Medicio",
  description: "Review, accept, reschedule, cancel, and complete patient bookings.",
};

export default function DoctorAppointmentsPage() {
  return (
    <DoctorLayoutWrapper>
      <DoctorAppointmentsManager />
    </DoctorLayoutWrapper>
  );
}
