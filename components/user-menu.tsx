"use client";

import { Avatar, Dropdown, Label, Separator } from "@heroui/react";
import { LayoutDashboard, LogOut, Moon, Settings, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";

import { dashboardForRole } from "@/config/roles";

export interface UserMenuProps {
  user: {
    name: string;
    email: string;
    role: string;
    avatarUrl?: string | null;
  };
}

function initialsOf(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

/** Account button in the app header: avatar trigger + quick-action menu with theme switcher inside. */
export function UserMenu({ user }: UserMenuProps) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  const isDark = theme === "dark";

  const handleAction = async (key: React.Key) => {
    switch (key) {
      case "dashboard":
        router.push(dashboardForRole(user.role));
        break;
      case "settings":
        router.push("/settings");
        break;
      case "theme":
        setTheme(isDark ? "light" : "dark");
        break;
      case "logout":
        try {
          await fetch("/api/auth/logout", { method: "POST" });
        } finally {
          // Full reload clears any client state tied to the session.
          window.location.href = "/login";
        }
        break;
    }
  };

  return (
    <Dropdown>
      <Dropdown.Trigger aria-label="Account menu" className="rounded-full">
        <Avatar size="sm" className="relative overflow-hidden">
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.name}
              className="w-full h-full object-cover rounded-full"
              onError={(e) => {
                (e.currentTarget as HTMLElement).style.display = "none";
              }}
            />
          ) : (
            <Avatar.Fallback className="text-xs font-bold">
              {initialsOf(user.name) || "?"}
            </Avatar.Fallback>
          )}
        </Avatar>
      </Dropdown.Trigger>

      <Dropdown.Popover className="min-w-[230px]" placement="bottom end">
        {/* Identity header */}
        <div className="px-3 pt-3 pb-1">
          <div className="flex items-center gap-2.5">
            <Avatar size="sm" className="relative overflow-hidden">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="w-full h-full object-cover rounded-full"
                  onError={(e) => {
                    (e.currentTarget as HTMLElement).style.display = "none";
                  }}
                />
              ) : (
                <Avatar.Fallback className="text-xs font-bold">
                  {initialsOf(user.name) || "?"}
                </Avatar.Fallback>
              )}
            </Avatar>
            <div className="flex flex-col min-w-0">
              <p className="text-sm font-semibold leading-5 text-text-primary truncate">
                {user.name}
              </p>
              <p className="text-xs leading-none text-text-secondary truncate">
                {user.email}
              </p>
            </div>
          </div>
          <span className="mt-2 inline-block text-[9px] font-mono font-bold uppercase tracking-wider text-text-secondary bg-border-custom/50 px-1.5 py-0.5 rounded">
            {user.role.replace(/_/g, " ")}
          </span>
        </div>

        <Dropdown.Menu onAction={handleAction}>
          <Dropdown.Item id="dashboard" textValue="Dashboard">
            <LayoutDashboard className="w-4 h-4 shrink-0 text-text-secondary" />
            <Label>Dashboard</Label>
          </Dropdown.Item>

          <Dropdown.Item id="settings" textValue="Settings">
            <Settings className="w-4 h-4 shrink-0 text-text-secondary" />
            <Label>Settings</Label>
          </Dropdown.Item>

          {/* Theme Switcher inside User Menu */}
          <Dropdown.Item id="theme" textValue="Toggle Theme">
            {isDark ? (
              <Sun className="w-4 h-4 shrink-0 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 shrink-0 text-indigo-400" />
            )}
            <Label>{isDark ? "Light Theme" : "Dark Theme"}</Label>
          </Dropdown.Item>

          <Separator />

          <Dropdown.Item id="logout" textValue="Log out" variant="danger">
            <LogOut className="w-4 h-4 shrink-0 text-danger" />
            <Label>Log Out</Label>
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}
