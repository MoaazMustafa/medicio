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
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileSpreadsheet,
  FileText,
  FlaskConical,
  FolderHeart,
  Globe,
  LayoutDashboard,
  Mail,
  Menu as MenuIcon,
  MessageSquareText,
  Pill,
  ScrollText,
  Settings,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  User,
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
  children?: NavItem[];
}

export const ROLE_NAV: Record<string, NavItem[]> = {
  PATIENT: [
    { label: "Symptom Checker", href: "/chatbot", icon: MessageSquareText },
    { label: "Appointments", href: "/appointments", icon: CalendarCheck, soon: true },
    { label: "Medicine Tracker", href: "/medicines", icon: Pill, soon: true },
    { label: "Health Records", href: "/records", icon: FolderHeart, soon: true },
  ],
  DOCTOR: [
    { label: "Dashboard Overview", href: "/doctor/dashboard", icon: LayoutDashboard },
    {
      label: "Practice & Profile",
      href: "/doctor/profile",
      icon: ShieldCheck,
      children: [
        { label: "Credentials & License", href: "/doctor/profile", icon: ShieldCheck },
        { label: "Clinic & Affiliations", href: "/doctor/profile/affiliations", icon: Building2 },
      ],
    },
    { label: "Schedule & Timetable", href: "/doctor/availability", icon: Clock },
    { label: "Appointments", href: "/doctor/appointments", icon: CalendarCheck },
    {
      label: "AI Clinical Agent",
      href: "/doctor/agent",
      icon: Bot,
      children: [
        { label: "Protocols & Guardrails", href: "/doctor/agent", icon: Bot },
        { label: "Agent Simulator", href: "/doctor/agent/playground", icon: Sparkles },
      ],
    },
    { label: "Medical Directory", href: "/doctor/directory", icon: Users },
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
    { label: "User Management", href: "/admin/users", icon: Users },
    { label: "Verification Queue", href: "/admin/verifications", icon: ShieldCheck },
    {
      label: "Audit Logs",
      href: "/admin/logs",
      icon: ScrollText,
      children: [
        { label: "System Audit Logs", href: "/admin/logs", icon: FileSpreadsheet },
        { label: "Email Dispatch Logs", href: "/admin/logs/email", icon: Mail },
      ],
    },
    { label: "Patient Portal", href: "/chatbot", icon: User },
    { label: "Doctor Console", href: "/doctor/dashboard", icon: Stethoscope },
    { label: "Hospital Portal", href: "/hospital/dashboard", icon: Building2 },
    { label: "Diagnostic Lab", href: "/lab/dashboard", icon: FlaskConical },
    { label: "Pharmacy Portal", href: "/pharmacy/dashboard", icon: Pill },
  ],
  SUPER_ADMIN: [
    { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { label: "User Management", href: "/admin/users", icon: Users },
    { label: "Verification Queue", href: "/admin/verifications", icon: ShieldCheck },
    { label: "Scraper Engine", href: "/admin/scrapers", icon: Globe },
    {
      label: "Audit Logs",
      href: "/admin/logs",
      icon: ScrollText,
      children: [
        { label: "System Audit Logs", href: "/admin/logs", icon: FileSpreadsheet },
        { label: "Email Dispatch Logs", href: "/admin/logs/email", icon: Mail },
      ],
    },
    { label: "Patient Portal", href: "/chatbot", icon: User },
    { label: "Doctor Console", href: "/doctor/dashboard", icon: Stethoscope },
    { label: "Hospital Portal", href: "/hospital/dashboard", icon: Building2 },
    { label: "Diagnostic Lab", href: "/lab/dashboard", icon: FlaskConical },
    { label: "Pharmacy Portal", href: "/pharmacy/dashboard", icon: Pill },
  ],
};

export function navForRole(role: string): NavItem[] {
  return ROLE_NAV[role] ?? ROLE_NAV.PATIENT;
}

function isRouteActive(href: string, pathname: string): boolean {
  if (href === "/admin/logs") return pathname === "/admin/logs";
  if (href === "/admin/dashboard") return pathname === "/admin/dashboard";
  if (href === "/doctor/dashboard") return pathname === "/doctor/dashboard";
  if (href === "/doctor/profile") return pathname === "/doctor/profile";
  if (href === "/doctor/agent") return pathname === "/doctor/agent";
  if (href === "/doctor/availability") return pathname === "/doctor/availability";
  if (href === "/doctor/appointments") return pathname === "/doctor/appointments";
  if (href === "/doctor/directory") return pathname === "/doctor/directory";
  if (href === "/hospital/dashboard") return pathname === "/hospital/dashboard";
  if (href === "/lab/dashboard") return pathname === "/lab/dashboard";
  if (href === "/pharmacy/dashboard") return pathname === "/pharmacy/dashboard";
  if (href === "/chatbot") return pathname === "/chatbot";
  return pathname.startsWith(href);
}

/**
 * Desktop Sidebar Rail with hierarchical parent/subtab navigation.
 */
export function AppSidebar({ role }: { role: string }) {
  const pathname = usePathname();
  const items = navForRole(role);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({
    "Audit Logs": true,
    "Practice & Profile": true,
    "AI Clinical Agent": true,
  });

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

  // Ensure active parent submenu is expanded when navigating to child route
  useEffect(() => {
    items.forEach((item) => {
      if (item.children) {
        const isChildActive = item.children.some(
          (child) => !child.soon && isRouteActive(child.href, pathname)
        );
        if (isChildActive) {
          setOpenSubmenus((prev) => ({ ...prev, [item.label]: true }));
        }
      }
    });
  }, [pathname, items]);

  const toggleSubmenu = (label: string) => {
    setOpenSubmenus((prev) => ({ ...prev, [label]: !prev[label] }));
  };

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
                Workspace Navigation
              </span>
            </div>
          )}

          <nav aria-label="Role Navigation" className="space-y-1">
            {items.map((item) => {
              // Check if hierarchical menu item has children
              if (item.children && item.children.length > 0) {
                const isParentActive = item.children.some(
                  (child) => !child.soon && isRouteActive(child.href, pathname)
                );
                const isExpanded = openSubmenus[item.label] ?? isParentActive;

                if (isCollapsed) {
                  return (
                    <Tooltip key={item.label} delay={100}>
                      <Tooltip.Trigger className="w-full flex justify-center">
                        <div
                          className={`flex items-center justify-center rounded-xl p-2.5 text-sm font-medium transition-all ${isParentActive
                              ? "bg-primary/15 text-primary border border-primary/30"
                              : "text-text-secondary hover:text-text-primary hover:bg-border-custom/40"
                            }`}
                        >
                          <item.icon className="w-5 h-5 shrink-0" />
                        </div>
                      </Tooltip.Trigger>
                      <Tooltip.Content placement="right" className="p-2 min-w-[170px]">
                        <div className="flex flex-col gap-1.5">
                          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-text-secondary pb-1 border-b border-border-custom/40">
                            {item.label}
                          </span>
                          {item.children.map((child) => {
                            const isChildActive = !child.soon && isRouteActive(child.href, pathname);

                            if (child.soon) {
                              return (
                                <div
                                  key={child.label}
                                  className="flex items-center gap-2 text-xs text-text-secondary/50 py-0.5 px-1 select-none"
                                >
                                  <child.icon className="w-3.5 h-3.5" />
                                  <span className="flex-1 truncate">{child.label}</span>
                                  <Chip size="sm" className="text-[8px] font-mono uppercase px-1 py-0 h-3">
                                    Soon
                                  </Chip>
                                </div>
                              );
                            }

                            return (
                              <NextLink
                                key={child.href}
                                href={child.href}
                                className={`flex items-center gap-2 text-xs font-semibold py-1 px-1.5 rounded transition-colors ${isChildActive ? "text-primary font-bold bg-primary/10" : "text-text-primary hover:text-primary"
                                  }`}
                              >
                                <child.icon className="w-3.5 h-3.5" />
                                <span>{child.label}</span>
                              </NextLink>
                            );
                          })}
                        </div>
                      </Tooltip.Content>
                    </Tooltip>
                  );
                }

                return (
                  <div key={item.label} className="space-y-1">
                    <button
                      onClick={() => toggleSubmenu(item.label)}
                      className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${isParentActive
                          ? "bg-primary/10 text-primary border border-primary/20 font-semibold"
                          : "text-text-secondary hover:text-text-primary hover:bg-border-custom/40"
                        }`}
                    >
                      <item.icon
                        className={`w-5 h-5 shrink-0 ${isParentActive ? "text-primary" : "text-text-secondary"
                          }`}
                      />
                      <span className="flex-1 text-left truncate">{item.label}</span>
                      <ChevronDown
                        className={`w-4 h-4 shrink-0 transition-transform duration-200 ${isExpanded ? "rotate-180 text-primary" : "text-text-secondary"
                          }`}
                      />
                    </button>

                    {isExpanded && (
                      <div className="pl-4 ml-4 border-l border-border-custom/60 space-y-1 my-1">
                        {item.children.map((child) => {
                          const isChildActive = !child.soon && isRouteActive(child.href, pathname);

                          if (child.soon) {
                            return (
                              <div
                                key={child.label}
                                aria-disabled
                                className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs text-text-secondary/50 cursor-not-allowed select-none"
                              >
                                <child.icon className="w-4 h-4 shrink-0" />
                                <span className="flex-1 truncate">{child.label}</span>
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
                            <NextLink
                              key={child.href}
                              href={child.href}
                              className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium transition-all ${isChildActive
                                  ? "bg-primary/15 text-primary border border-primary/30 font-semibold shadow-xs"
                                  : "text-text-secondary hover:text-text-primary hover:bg-border-custom/40"
                                }`}
                            >
                              <child.icon
                                className={`w-4 h-4 shrink-0 ${isChildActive ? "text-primary" : "text-text-secondary"
                                  }`}
                              />
                              <span className="flex-1 truncate">{child.label}</span>
                            </NextLink>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

              // Standard flat item
              const isActive = !item.soon && isRouteActive(item.href, pathname);

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
 * Mobile Navigation Drawer.
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
              <Drawer.Header className="flex flex-row items-center justify-between p-4 border-b border-border-custom">
                <NextLink
                  className="flex items-center gap-2"
                  href="/"
                  onClick={() => setIsOpen(false)}
                >
                  <Logo />
                  <span className="font-bold text-lg tracking-tight text-primary">
                    Medicio
                  </span>
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
              <Drawer.Body className="flex-1 overflow-y-auto p-4 space-y-4">
                <div className="px-1">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-text-secondary">
                    Navigation Menu
                  </span>
                </div>

                <nav aria-label="Mobile Navigation" className="space-y-3">
                  {items.map((item) => {
                    if (item.children && item.children.length > 0) {
                      return (
                        <div key={item.label} className="space-y-1 pt-1">
                          <div className="flex items-center gap-2 px-2 text-xs font-mono font-bold text-primary uppercase tracking-wider">
                            <item.icon className="w-4 h-4 shrink-0" />
                            <span>{item.label}</span>
                          </div>
                          <div className="pl-3 space-y-1">
                            {item.children.map((child) => {
                              const isChildActive = !child.soon && isRouteActive(child.href, pathname);

                              if (child.soon) {
                                return (
                                  <div
                                    key={child.label}
                                    aria-disabled
                                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs text-text-secondary/50 cursor-not-allowed select-none"
                                  >
                                    <child.icon className="w-4 h-4 shrink-0" />
                                    <span className="flex-1 truncate">{child.label}</span>
                                    <Chip
                                      size="sm"
                                      className="text-[8px] font-mono uppercase px-1 py-0 h-3"
                                    >
                                      Soon
                                    </Chip>
                                  </div>
                                );
                              }

                              return (
                                <Button
                                  key={child.href}
                                  variant="ghost"
                                  onPress={() => handleNavigate(child.href)}
                                  className={`w-full flex items-center justify-start gap-3 rounded-xl px-3 py-2.5 text-xs font-medium h-auto ${isChildActive
                                      ? "bg-primary/15 text-primary border border-primary/30 font-semibold"
                                      : "text-text-secondary hover:text-text-primary"
                                    }`}
                                >
                                  <child.icon className="w-4 h-4 shrink-0" />
                                  <span className="flex-1 truncate text-left">{child.label}</span>
                                </Button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    }

                    const isActive = !item.soon && isRouteActive(item.href, pathname);

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
              <div className="p-4">
                <Button
                  variant="ghost"
                  onPress={() => handleNavigate("/settings")}
                  className={`w-full flex items-center justify-start gap-3 rounded-xl px-3 py-3 text-sm font-medium h-auto ${pathname.startsWith("/settings")
                      ? "bg-primary/15 text-primary border border-primary/30 font-semibold"
                      : "text-text-secondary hover:text-text-primary"
                    }`}
                >
                  <Settings className="w-5 h-5 shrink-0 text-text-secondary" />
                  <span className="flex-1 truncate text-left">Settings</span>
                </Button>
              </div>
            </Drawer.Dialog>
          </Drawer.Content>
        </Drawer.Backdrop>
      </Drawer.Root>
    </div>
  );
}
