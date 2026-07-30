import NextLink from "next/link";
import { redirect } from "next/navigation";

import { AppSidebar, MobileNav } from "@/components/app-sidebar";
import { Logo } from "@/components/icons";
import { ThemeSwitch } from "@/components/theme-switch";
import { UserMenu } from "@/components/user-menu";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Authenticated app shell: role-aware sidebar + header with the user menu.
 * Session is resolved server-side; middleware already gates these routes,
 * this is the defense-in-depth check plus the data source for the shell.
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  // Fetch current user record from database to get live avatarUrl & user details
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { name: true, email: true, role: true, avatarUrl: true },
  });

  const name = user?.name ?? session.name;
  const email = user?.email ?? session.email;
  const role = user?.role ?? session.role;
  const avatarUrl = user?.avatarUrl ?? session.avatarUrl ?? null;

  return (
    <div className="flex min-h-screen w-full">
      <AppSidebar role={role} />

      <div className="flex flex-col flex-1 min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-40 flex items-center justify-between gap-3 h-16 px-4 md:px-6 border-b border-border-custom bg-background-custom/70 backdrop-blur-lg">
          <div className="flex items-center gap-3">
            <MobileNav role={role} />
            {/* Brand shown only when the sidebar is hidden */}
            <NextLink className="flex items-center gap-2 md:hidden" href="/">
              <Logo />
              <span className="font-bold text-lg tracking-tight text-primary">
                Medicio
              </span>
            </NextLink>
          </div>

          <div className="flex items-center gap-3">
            <ThemeSwitch />
            <UserMenu
              user={{
                name,
                email,
                role,
                avatarUrl,
              }}
            />
          </div>
        </header>

        <main className="flex-1 w-full">{children}</main>
      </div>
    </div>
  );
}
