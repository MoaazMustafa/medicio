import { DoctorLayoutWrapper } from "@/components/doctor/doctor-layout-wrapper";
import { DoctorAgentPlayground } from "@/components/doctor/doctor-agent-playground";

export const metadata = {
  title: "AI Agent Simulator & Testing Sandbox — Doctor Portal | Medicio",
  description: "Test live symptom triage responses and emergency protocol detection.",
};

export default function DoctorAgentPlaygroundPage() {
  return (
    <DoctorLayoutWrapper>
      <DoctorAgentPlayground />
    </DoctorLayoutWrapper>
  );
}
