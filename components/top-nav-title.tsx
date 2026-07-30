"use client";

import { usePathname } from "next/navigation";

const ROUTE_TITLES: Record<string, { title: string; subtitle?: string }> = {
  "/admin/dashboard": {
    title: "Administrator Control Panel",
    subtitle: "User management, credential verification & system operations",
  },
  "/doctor/dashboard": {
    title: "Doctor Console",
    subtitle: "Appointments, schedule & emergency agent training",
  },
  "/hospital/dashboard": {
    title: "Hospital Management",
    subtitle: "Facilities, affiliated doctors, labs & pharmacies",
  },
  "/pharmacy/dashboard": {
    title: "Pharmacy Portal",
    subtitle: "Inventory, stock levels & POS sync status",
  },
  "/lab/dashboard": {
    title: "Diagnostic Lab Console",
    subtitle: "Test catalogue, pricing & patient report uploads",
  },
  "/chatbot": {
    title: "AI Symptom Checker",
    subtitle: "Conversational triage & provider recommendations",
  },
  "/settings": {
    title: "Account Settings",
    subtitle: "Personal info, Security & Preferences",
  },
};

export function TopNavTitle() {
  const pathname = usePathname();

  const matched = ROUTE_TITLES[pathname] || {
    title: pathname
      .split("/")
      .filter(Boolean)
      .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
      .join(" / ") || "Dashboard",
  };

  return (
    <div className="flex flex-col justify-center">
      <h1 className="text-sm md:text-base font-bold tracking-tight text-text-primary">
        {matched.title}
      </h1>
      {matched.subtitle && (
        <p className="hidden sm:block text-[11px] text-text-secondary truncate">
          {matched.subtitle}
        </p>
      )}
    </div>
  );
}
