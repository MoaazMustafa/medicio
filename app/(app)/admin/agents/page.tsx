import { AgentsManager } from "@/components/admin/agents-manager";

export const metadata = {
  title: "AI Specialist Models",
  description: "Train specialty AI models, manage suggested questions, and attach doctor agents.",
};

export default function AdminAgentsPage() {
  return (
    <section className="w-full flex flex-col min-h-[calc(100vh-4rem)] p-4 md:p-8 max-w-[1600px] mx-auto">
      <AgentsManager />
    </section>
  );
}
