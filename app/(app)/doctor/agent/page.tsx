import { DoctorLayoutWrapper } from "@/components/doctor/doctor-layout-wrapper";
import { DoctorAgentConfig } from "@/components/doctor/doctor-agent-config";

export const metadata = {
  title: "AI Clinical Agent Protocols — Doctor Portal | Medicio",
  description: "Configure specialty emergency red flags, intake protocols, and clinical boundaries.",
};

export default function DoctorAgentPage() {
  return (
    <DoctorLayoutWrapper>
      <DoctorAgentConfig />
    </DoctorLayoutWrapper>
  );
}
