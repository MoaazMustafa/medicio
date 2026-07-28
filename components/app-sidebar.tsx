"use client";

import { Button, Chip, Dropdown, Label } from "@heroui/react";
import type { LucideIcon } from "lucide-react";
import {
  Bot,
  Building2,
  CalendarCheck,
  FileText,
  FlaskConical,
  FolderHeart,
  Globe,
  LayoutDashboard,
  Menu as MenuIcon,
  MessageSquareText,
  Pill,
  ScrollText,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";
import NextLink from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { Logo } from "@/components/icons";

/**
 * Single source of truth for in-app navigation (SRS §6 RBAC matrix).
 * Items without a live route yet are flagged `soon` and rendered disabled,
 * so the sidebar doubles as an honest roadmap per role.
 */

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  soon?: boolean;
}

const ROLE_NAV: Record<string, NavItem[]> = {
  PATIENT: [
    { label: "Symptom Checker", href: "/chatbot", icon: MessageSquareText },
    { label: "Appointments", href: "/appointments", icon: CalendarCheck, soon: true },
    { label: "Medicine Tracker", href: "/medicines", icon: Pill, soon: true },
    { label: "Health Records", href: "/records", icon: FolderHeart, soon: true },
  ],
  DOCTOR: [
    { label: "Dashboard", href: "/doctor/dashboard", icon: LayoutDashboard },
    { label: "Appointments", href: "/doctor/appointments", icon: CalendarCheck, soon: true },
    { label: "AI Agent Training", href: "/doctor/agent", icon: Bot, soon: true },
  ],
  HOSPITAL_ADMIN: [
    { label: "Dashboard", href: "/hospital/dashboard", icon: LayoutDashboard },
    { label: "Affiliated Providers", href: "/hospital/providers", icon: Building2, soon: true },
  ],
  LAB_ADMIN: [
    { label: "Dashboard", href: "/lab/dashboard", icon: LayoutDashboard },
    { label: "Test Catalogue", href: "/lab/catalogue", icon: FlaskConical, soon: true },
    { label: "Reports", href: "/lab/reports", icon: FileText, soon: true },
  ],
  PHARMACY_ADMIN: [
    { label: "Dashboard", href: "/pharmacy/dashboard", icon: LayoutDashboard },
    { label: "Inventory", href: "/pharmacy/inventory", icon: Pill, soon: true },
  ],
  ADMIN: [
    { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { label: "User Administration", href: "/admin/dashboard", icon: Users },
    { label: "Verification Queue", href: "/admin/verifications", icon: ShieldCheck, soon: true },
  ],
  SUPER_ADMIN: [
    { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { label: "Verification Queue", href: "/admin/verifications", icon: ShieldCheck, soon: true },
    { label: "Scraper Engine", href: "/admin/scraper", icon: Globe, soon: true },
    { label: "Audit Logs", href: "/admin/logs", icon: ScrollText, soon: true },
  ],
};

function navForRole(role: string): NavItem[] {
  return ROLE_NAV[role] ?? ROLE_NAV.PATIENT;
}

/** Desktop sidebar rail — hidden below md. */
export function AppSidebar({ role }: { role: string }) {
  const pathname = usePathname();
  const items = navForRole(role);

  return (
    <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-border-custom bg-surface/40 backdrop-blur-lg sticky top-0 h-screen">
      {/* Brand */}
      <div className="flex items-center gap-2 h-16 px-5 border-b border-border-custom">
        <NextLink className="flex items-center gap-2" href="/">
          <Logo />
          <span className="font-bold text-lg tracking-tight text-primary">
            Medicio
          </span>
        </NextLink>
      </div>

      {/* Role nav */}
      <nav aria-label="Main navigation" className="flex-1 overflow-y-auto px-3 py-4">
        <span className="block px-2 pb-2 text-[10px] font-mono font-bold uppercase tracking-wider text-text-secondary">
          Workspace
        </span>
        <ul className="flex flex-col gap-1">
          {items.map((item) => {
            const isActive = !item.soon && pathname.startsWith(item.href);

            return (
              <li key={item.label}>
                {item.soon ? (
                  <span
                    aria-disabled
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-text-secondary/60 cursor-not-allowed select-none"
                  >
                    <item.icon className="w-4 h-4 shrink-0" />
                    <span className="flex-1 truncate">{item.label}</span>
                    <Chip
                      size="sm"
                      className="text-[9px] font-mono uppercase px-1.5 py-0 h-4"
                    >
                      Soon
                    </Chip>
                  </span>
                ) : (
                  <NextLink
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-primary/10 text-primary border border-primary/30"
                        : "text-text-secondary hover:text-text-primary hover:bg-border-custom/30"
                    }`}
                    href={item.href}
                  >
                    <item.icon className="w-4 h-4 shrink-0" />
                    <span className="flex-1 truncate">{item.label}</span>
                  </NextLink>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom: settings */}
      <div className="px-3 py-4 border-t border-border-custom">
        <NextLink
          className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
            pathname.startsWith("/settings")
              ? "bg-primary/10 text-primary border border-primary/30"
              : "text-text-secondary hover:text-text-primary hover:bg-border-custom/30"
          }`}
          href="/settings"
        >
          <Settings className="w-4 h-4 shrink-0" />
          Settings
        </NextLink>
      </div>
    </aside>
  );
}

/** Mobile nav — same role map, rendered as a native HeroUI Dropdown. */
export function MobileNav({ role }: { role: string }) {
  const router = useRouter();
  const items = navForRole(role);
  const disabledKeys = items.filter((item) => item.soon).map((item) => item.href);

  return (
    <div className="md:hidden">
      <Dropdown>
        <Button isIconOnly aria-label="Open navigation" variant="ghost">
          <MenuIcon className="w-5 h-5 text-text-primary" />
        </Button>
        <Dropdown.Popover className="min-w-[220px]">
          <Dropdown.Menu
            disabledKeys={disabledKeys}
            onAction={(key) => router.push(String(key))}
          >
            {items.map((item) => (
              <Dropdown.Item key={item.label} id={item.href} textValue={item.label}>
                <item.icon className="w-4 h-4 shrink-0 text-text-secondary" />
                <Label>
                  {item.label}
                  {item.soon ? " (soon)" : ""}
                </Label>
              </Dropdown.Item>
            ))}
            <Dropdown.Item id="/settings" textValue="Settings">
              <Settings className="w-4 h-4 shrink-0 text-text-secondary" />
              <Label>Settings</Label>
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown.Popover>
      </Dropdown>
    </div>
  );
}
