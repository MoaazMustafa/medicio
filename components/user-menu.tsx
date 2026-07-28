"use client";

import { Avatar, Dropdown, Label, Separator } from "@heroui/react";
import { LayoutDashboard, LogOut, Settings } from "lucide-react";
import { useRouter } from "next/navigation";

import { dashboardForRole } from "@/config/roles";

export interface UserMenuProps {
  user: {
    name: string;
    email: string;
    role: string;
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

/** Account button in the app header: avatar trigger + quick-action menu. */
export function UserMenu({ user }: UserMenuProps) {
  const router = useRouter();

  const handleAction = async (key: React.Key) => {
    switch (key) {
      case "dashboard":
        router.push(dashboardForRole(user.role));
        break;
      case "settings":
        router.push("/settings");
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
        <Avatar size="sm">
          <Avatar.Fallback className="text-xs font-bold">
            {initialsOf(user.name) || "?"}
          </Avatar.Fallback>
        </Avatar>
      </Dropdown.Trigger>

      <Dropdown.Popover className="min-w-[230px]" placement="bottom end">
        {/* Identity header */}
        <div className="px-3 pt-3 pb-1">
          <div className="flex items-center gap-2.5">
            <Avatar size="sm">
              <Avatar.Fallback className="text-xs font-bold">
                {initialsOf(user.name) || "?"}
              </Avatar.Fallback>
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
