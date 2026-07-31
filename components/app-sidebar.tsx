"use client";

import {
  Button,
  Chip,
  Drawer,
  ScrollShadow,
  Separator,
  Surface,
  Tooltip,
} from "@heroui/react";
import type { LucideIcon } from "lucide-react";
import {
  Bot,
  Building2,
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
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
  X,
} from "lucide-react";
import NextLink from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

import { Logo } from "@/components/icons";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  soon?: boolean;
}

export const ROLE_NAV: Record<string, NavItem[]> = {
  PATIENT: [
    { label: "Symptom Checker", href: "/chatbot", icon: MessageSquareText },
    { label: "Appointments", href: "/appointments", icon: CalendarCheck, soon: true },
    { label: "Medicine Tracker", href: "/medicines", icon: Pill, soon: true },
    { label: "Health Records", href: "/records", icon: FolderHeart, soon: true },
  ],
  DOCTOR: [
    { label: "Dashboard", href: "/doctor/dashboard", icon: LayoutDashboard, soon: true },
    { label: "Appointments", href: "/doctor/appointments", icon: CalendarCheck, soon: true },
    { label: "AI Agent Training", href: "/doctor/agent", icon: Bot, soon: true },
  ],
  HOSPITAL_ADMIN: [
    { label: "Dashboard", href: "/hospital/dashboard", icon: LayoutDashboard, soon: true },
    { label: "Affiliated Providers", href: "/hospital/providers", icon: Building2, soon: true },
  ],
  LAB_ADMIN: [
    { label: "Dashboard", href: "/lab/dashboard", icon: LayoutDashboard, soon: true },
    { label: "Test Catalogue", href: "/lab/catalogue", icon: FlaskConical, soon: true },
    { label: "Reports", href: "/lab/reports", icon: FileText, soon: true },
  ],
  PHARMACY_ADMIN: [
    { label: "Dashboard", href: "/pharmacy/dashboard", icon: LayoutDashboard, soon: true },
    { label: "Inventory", href: "/pharmacy/inventory", icon: Pill, soon: true },
  ],
  ADMIN: [
    { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { label: "User Management", href: "/admin/users", icon: Users },
    { label: "Verification Queue", href: "/admin/verifications", icon: ShieldCheck },
    { label: "Audit Logs", href: "/admin/logs", icon: ScrollText },
  ],
  SUPER_ADMIN: [
    { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { label: "User Management", href: "/admin/users", icon: Users },
    { label: "Verification Queue", href: "/admin/verifications", icon: ShieldCheck },
    { label: "Scraper Engine", href: "/admin/scrapers", icon: Globe },
    { label: "Audit Logs", href: "/admin/logs", icon: ScrollText },
  ],
};

export function navForRole(role: string): NavItem[] {
  return ROLE_NAV[role] ?? ROLE_NAV.PATIENT;
}

/**
 * Desktop Sidebar Rail — Built with HeroUI Surface, ScrollShadow, Tooltip, Button & Chip.
 * Supports expand/collapse state with interactive mini-rail tooltips.
 * Auto-collapses on tablet viewport sizes (768px - 1023px) to maximize workspace area.
 */
export function AppSidebar({ role }: { role: string }) {
  const pathname = usePathname();
  const items = navForRole(role);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Auto-collapse sidebar on tablet screen widths to preserve main workspace space
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768 && window.innerWidth < 1024) {
        setIsCollapsed(true);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <aside
      aria-label="Main sidebar"
      className={`hidden md:flex flex-col sticky top-0 h-screen border-r border-border-custom bg-surface/60 backdrop-blur-xl transition-all duration-300 z-30 shrink-0 ${isCollapsed ? "w-18" : "w-60"
        }`}
    >
      <Surface className="flex flex-col h-full bg-transparent">
        {/* Brand Header */}
        <div
          className={`flex items-center h-16 border-b border-border-custom shrink-0 transition-all ${isCollapsed ? "justify-center px-2" : "justify-between px-4"
            }`}
        >
          {isCollapsed ? (
            <Button
              isIconOnly
              size="sm"
              variant="ghost"
              aria-label="Expand sidebar"
              onPress={() => setIsCollapsed(false)}
              className="text-text-secondary hover:text-text-primary rounded-lg shrink-0"
            >
              <ChevronRight className="w-5 h-5 text-primary" />
            </Button>
          ) : (
            <>
              <NextLink
                className="flex items-center gap-2.5 overflow-hidden focus:outline-none"
                href="/"
              >
                <Logo size={32} className="shrink-0 text-primary" />
                <span className="font-bold text-lg tracking-tight text-primary truncate">
                  Medicio
                </span>
              </NextLink>

              <Button
                isIconOnly
                size="sm"
                variant="ghost"
                aria-label="Collapse sidebar"
                onPress={() => setIsCollapsed(true)}
                className="text-text-secondary hover:text-text-primary rounded-lg shrink-0"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>

        {/* Scrollable Navigation */}
        <ScrollShadow className="flex-1 px-3 py-4 space-y-4 overflow-x-hidden">
          {!isCollapsed && (
            <div className="px-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-text-secondary">
                Workspace
              </span>
            </div>
          )}

          <nav aria-label="Role Navigation" className="space-y-1">
            {items.map((item) => {
              const isActive = !item.soon && pathname.startsWith(item.href);

              const navContent = item.soon ? (
                <div
                  aria-disabled
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-text-secondary/50 cursor-not-allowed select-none transition-colors ${isCollapsed ? "justify-center px-0 w-full" : ""
                    }`}
                >
                  <item.icon className="w-5 h-5 shrink-0" />
                  {!isCollapsed && (
                    <>
                      <span className="flex-1 truncate">{item.label}</span>
                      <Chip
                        size="sm"
                        className="text-[9px] font-mono uppercase px-1.5 py-0 h-4"
                      >
                        Soon
                      </Chip>
                    </>
                  )}
                </div>
              ) : (
                <NextLink
                  href={item.href}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${isCollapsed ? "justify-center px-0 w-full" : ""
                    } ${isActive
                      ? "bg-primary/15 text-primary border border-primary/30 font-semibold shadow-sm"
                      : "text-text-secondary hover:text-text-primary hover:bg-border-custom/40"
                    }`}
                >
                  <item.icon
                    className={`w-5 h-5 shrink-0 ${isActive ? "text-primary" : "text-text-secondary"
                      }`}
                  />
                  {!isCollapsed && <span className="flex-1 truncate">{item.label}</span>}
                </NextLink>
              );

              if (isCollapsed) {
                return (
                  <Tooltip key={item.label} delay={100}>
                    <Tooltip.Trigger className="w-full flex justify-center">
                      {navContent}
                    </Tooltip.Trigger>
                    <Tooltip.Content placement="right" className="text-xs font-semibold px-2.5 py-1">
                      {item.label} {item.soon ? "(Soon)" : ""}
                    </Tooltip.Content>
                  </Tooltip>
                );
              }

              return <React.Fragment key={item.label}>{navContent}</React.Fragment>;
            })}
          </nav>
        </ScrollShadow>

        <Separator className="bg-border-custom/60" />

        {/* Footer: Settings Link */}
        <div className="p-3 shrink-0">
          {isCollapsed ? (
            <Tooltip delay={100}>
              <Tooltip.Trigger className="w-full flex justify-center">
                <NextLink
                  href="/settings"
                  className={`flex items-center justify-center rounded-xl p-2.5 text-sm font-medium transition-all ${pathname.startsWith("/settings")
                    ? "bg-primary/15 text-primary border border-primary/30"
                    : "text-text-secondary hover:text-text-primary hover:bg-border-custom/40"
                    }`}
                >
                  <Settings className="w-5 h-5 shrink-0 text-text-secondary" />
                </NextLink>
              </Tooltip.Trigger>
              <Tooltip.Content placement="right" className="text-xs font-semibold px-2.5 py-1">
                Settings
              </Tooltip.Content>
            </Tooltip>
          ) : (
            <NextLink
              href="/settings"
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${pathname.startsWith("/settings")
                ? "bg-primary/15 text-primary border border-primary/30 font-semibold shadow-sm"
                : "text-text-secondary hover:text-text-primary hover:bg-border-custom/40"
                }`}
            >
              <Settings className="w-5 h-5 shrink-0 text-text-secondary" />
              <span className="flex-1 truncate">Settings</span>
            </NextLink>
          )}
        </div>
      </Surface>
    </aside>
  );
}

/**
 * Mobile Navigation — Replaced with HeroUI Drawer component end-to-end.
 * Uses controlled isOpen state to prevent Drawer.CloseTrigger absolute positioning bugs.
 */
export function MobileNav({ role }: { role: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const items = navForRole(role);
  const [isOpen, setIsOpen] = useState(false);

  const handleNavigate = (href: string) => {
    setIsOpen(false);
    router.push(href);
  };

  return (
    <div className="md:hidden">
      <Drawer.Root isOpen={isOpen} onOpenChange={setIsOpen}>
        <Drawer.Trigger>
          <Button isIconOnly aria-label="Open Navigation Menu" variant="ghost">
            <MenuIcon className="w-5 h-5 text-text-primary" />
          </Button>
        </Drawer.Trigger>

        <Drawer.Backdrop isDismissable>
          <Drawer.Content placement="left" className="w-[280px] sm:w-[320px] max-w-[85vw] h-full bg-surface border-r border-border-custom">
            <Drawer.Dialog className="flex flex-col h-full outline-none">
              {/* Header */}
              <Drawer.Header className="flex flex-row items-center justify-between border-b border-border-custom">
                <NextLink
                  className="flex items-center gap-2"
                  href="/"
                  onClick={() => setIsOpen(false)}
                >
                  <Logo />
                </NextLink>
                <Button
                  isIconOnly
                  size="sm"
                  variant="ghost"
                  aria-label="Close navigation"
                  onPress={() => setIsOpen(false)}
                  className="p-1 rounded-lg text-text-secondary hover:text-text-primary focus:outline-none"
                >
                  <X className="w-5 h-5" />
                </Button>
              </Drawer.Header>

              {/* Body / Nav List */}
              <Drawer.Body className="flex-1 overflow-y-auto space-y-4">
                <div className="px-1">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-text-secondary">
                    Navigation Menu
                  </span>
                </div>

                <nav aria-label="Mobile Navigation" className="space-y-1">
                  {items.map((item) => {
                    const isActive = !item.soon && pathname.startsWith(item.href);

                    if (item.soon) {
                      return (
                        <div
                          key={item.label}
                          aria-disabled
                          className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-text-secondary/50 cursor-not-allowed select-none"
                        >
                          <item.icon className="w-5 h-5 shrink-0" />
                          <span className="flex-1 truncate">{item.label}</span>
                          <Chip
                            size="sm"
                            className="text-[9px] font-mono uppercase px-1.5 py-0 h-4"
                          >
                            Soon
                          </Chip>
                        </div>
                      );
                    }

                    return (
                      <Button
                        key={item.label}
                        variant="ghost"
                        onPress={() => handleNavigate(item.href)}
                        className={`w-full flex items-center justify-start gap-3 rounded-xl px-3 py-3 text-sm font-medium h-auto ${isActive
                          ? "bg-primary/15 text-primary border border-primary/30 font-semibold"
                          : "text-text-secondary hover:text-text-primary"
                          }`}
                      >
                        <item.icon className="w-5 h-5 shrink-0" />
                        <span className="flex-1 truncate text-left">{item.label}</span>
                      </Button>
                    );
                  })}
                </nav>
              </Drawer.Body>

              <Separator className="bg-border-custom/60" />

              {/* Footer / Settings */}
              <Drawer.Footer className="pt-4">
                <Button
                  variant="ghost"
                  onPress={() => handleNavigate("/settings")}
                  className={`w-full flex items-center justify-start gap-3 rounded-xl px-3 py-3 text-sm font-medium h-auto ${pathname.startsWith("/settings")
                    ? "bg-primary/15 text-primary border border-primary/30 font-semibold"
                    : "text-text-secondary hover:text-text-primary"
                    }`}
                >
                  <Settings className="w-5 h-5 shrink-0" />
                  <span className="flex-1 truncate text-left">Settings</span>
                </Button>
              </Drawer.Footer>
            </Drawer.Dialog>
          </Drawer.Content>
        </Drawer.Backdrop>
      </Drawer.Root>
    </div>
  );
}
