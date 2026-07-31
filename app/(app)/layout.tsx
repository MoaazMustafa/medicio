import NextLink from "next/link";
import { redirect } from "next/navigation";

import { AppSidebar, MobileNav } from "@/components/app-sidebar";
import { Logo } from "@/components/icons";
import { ThemeSwitch } from "@/components/theme-switch";
import { UserMenu } from "@/components/user-menu";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TopNavTitle } from "@/components/top-nav-title";

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
    <div className="flex min-h-screen w-full bg-background-custom text-text-primary">
      <AppSidebar role={role} />

      <div className="flex flex-col flex-1 min-w-0">
        {/* Top bar header with high responsive stability */}
        <header className="sticky top-0 z-40 flex items-center justify-between gap-2 sm:gap-4 h-16 px-3 sm:px-4 md:px-6 border-b border-border-custom bg-background-custom/80 backdrop-blur-lg min-w-0">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <MobileNav role={role} />
            {/* Brand shown only when the desktop sidebar is hidden */}
            <NextLink className="flex items-center gap-1.5 md:hidden shrink-0 mr-1" href="/">
              <Logo size={26} />
              <span className="font-bold text-base tracking-tight text-primary hidden sm:inline">
                Medicio
              </span>
            </NextLink>
            <TopNavTitle />
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
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

        <main className="flex-1 w-full overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}
