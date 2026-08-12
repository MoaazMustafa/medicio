import NextLink from "next/link";
import { redirect } from "next/navigation";

import { AppSidebar, MobileNav } from "@/components/app-sidebar";
import { Logo } from "@/components/icons";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { TopNavTitle } from "@/components/top-nav-title";
import { UserMenu } from "@/components/user-menu";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Authenticated app shell: role-aware sidebar + header with the user menu.
 * Session is resolved server-side; validates live account in database.
 * If user was deleted, deactivated, or role changed, immediately redirects to /login.
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/login?reason=role_changed");
  }

  // Fetch current user record from database to verify active status and matching role
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { name: true, email: true, role: true, avatarUrl: true, isActive: true },
  });

  // If user was deleted, deactivated, or role changed in DB, force immediate logout & redirect
  if (!user || !user.isActive || user.role !== session.role) {
    redirect("/login?reason=role_changed");
  }

  const name = user.name;
  const email = user.email;
  const role = user.role;
  const avatarUrl = user.avatarUrl ?? null;

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

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <NotificationBell />
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
