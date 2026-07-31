import { UsersManager } from "@/components/admin/users-manager";

export const metadata = {
  title: "User Management",
  description: "Manage platform accounts, RBAC roles, avatars, and status governance.",
};

export default function AdminUsersPage() {
  return (
    <section className="w-full flex flex-col min-h-[calc(100vh-4rem)] p-4 md:p-8 max-w-[1600px] mx-auto">
      <UsersManager />
    </section>
  );
}
