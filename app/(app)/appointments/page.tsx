import { PatientAppointments } from "@/components/patient/patient-appointments";

export const metadata = {
  title: "My Appointments | Medicio",
  description:
    "View upcoming and past appointments with Medicio-verified doctors. Book new consultations and manage your schedule.",
};

export default function AppointmentsPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PatientAppointments />
    </div>
  );
}
