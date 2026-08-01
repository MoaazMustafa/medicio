"use client";

import { usePathname } from "next/navigation";

const ROUTE_TITLES: Record<string, { title: string; subtitle?: string }> = {
  "/admin/dashboard": {
    title: "Administrator Overview",
    subtitle: "Platform metrics, activity trends & system health graphs",
  },
  "/admin/users": {
    title: "User Management & RBAC Roles",
    subtitle: "Manage accounts, user avatars, auth methods & custom roles",
  },
  "/admin/verifications": {
    title: "Doctor Credential Verifications",
    subtitle: "Review practitioner credentials & medical license queue",
  },
  "/admin/scrapers": {
    title: "Scraper & Aggregation Engine",
    subtitle: "Public directory crawlers & record deduplication",
  },
  "/admin/logs": {
    title: "System Audit Logs",
    subtitle: "System security audit trails, RBAC mutations & client telemetry",
  },
  "/admin/logs/email": {
    title: "Email Dispatch Logs",
    subtitle: "Transactional email delivery history, SMTP headers & dispatch status",
  },
  "/doctor/dashboard": {
    title: "Doctor Overview & Metrics",
    subtitle: "Practitioner overview, credential status & booking summary",
  },
  "/doctor/profile": {
    title: "Credentials & License",
    subtitle: "Medical license verification, specialty & practitioner bio",
  },
  "/doctor/profile/affiliations": {
    title: "Clinic & Hospital Network",
    subtitle: "Standalone clinic address & hospital affiliation requests",
  },
  "/doctor/availability": {
    title: "Schedule & Timetable",
    subtitle: "Working days, shift hours & appointment slot duration",
  },
  "/doctor/appointments": {
    title: "Patient Appointments",
    subtitle: "Review, accept, or update patient appointment statuses",
  },
  "/doctor/agent": {
    title: "AI Agent Protocols",
    subtitle: "Specialty triage rules, emergency red flags & clinical boundaries",
  },
  "/doctor/agent/playground": {
    title: "AI Agent Simulator",
    subtitle: "Interactive prompt sandbox & live triage preview",
  },
  "/doctor/directory": {
    title: "Medical Directory",
    subtitle: "Scraped practitioner directory & verified provider listings",
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
    <div className="flex flex-col justify-center min-w-0 flex-1">
      <h1 className="text-xs sm:text-sm md:text-base font-bold tracking-tight text-text-primary truncate max-w-[200px] xs:max-w-[280px] sm:max-w-none">
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
