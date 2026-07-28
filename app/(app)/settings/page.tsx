import { Card, Chip } from "@heroui/react";
import { redirect } from "next/navigation";

import { ThemeSwitch } from "@/components/theme-switch";
import { getSession } from "@/lib/auth";

export const metadata = {
  title: "Settings",
};

/**
 * Single settings route for every role. The account/appearance/security
 * sections are shared; the last card adapts to the signed-in role. Sections
 * whose backing features are not built yet are shown as planned.
 */

const ROLE_SECTIONS: Record<
  string,
  { title: string; items: Array<{ label: string; hint: string }> }
> = {
  PATIENT: {
    title: "Patient Preferences",
    items: [
      { label: "Search radius", hint: "Default distance for pharmacy and lab search." },
      { label: "Appointment reminders", hint: "How you are notified about bookings." },
      { label: "Medicine dose reminders", hint: "Optional reminders from your tracker." },
      { label: "Record sharing", hint: "Which professionals can view your records." },
    ],
  },
  DOCTOR: {
    title: "Practice Settings",
    items: [
      { label: "Availability schedule", hint: "Working days, hours and slot duration." },
      { label: "Hospital affiliation", hint: "Request or manage hospital affiliation." },
      { label: "AI agent training", hint: "Specialty question set for your assistant." },
      { label: "Credential documents", hint: "Licence and education verification files." },
    ],
  },
  HOSPITAL_ADMIN: {
    title: "Facility Settings",
    items: [
      { label: "Hospital profile", hint: "Facilities, services and public details." },
      { label: "Affiliation requests", hint: "Invite doctors or review incoming requests." },
      { label: "Linked labs & pharmacies", hint: "Manage facility-linked providers." },
    ],
  },
  LAB_ADMIN: {
    title: "Lab Settings",
    items: [
      { label: "Lab profile & certification", hint: "Public details and certification." },
      { label: "Test catalogue", hint: "Tests, pricing and wait times." },
      { label: "Report delivery", hint: "Defaults for publishing patient reports." },
    ],
  },
  PHARMACY_ADMIN: {
    title: "Pharmacy Settings",
    items: [
      { label: "Pharmacy profile", hint: "Location and contact details." },
      { label: "POS integration", hint: "Point-of-sale sync adapter and cadence." },
      { label: "Inventory defaults", hint: "Low-stock thresholds and units." },
    ],
  },
  ADMIN: {
    title: "Administration",
    items: [
      { label: "Verification workflow", hint: "Doctor credential review defaults." },
      { label: "Notification templates", hint: "Emails sent on approval decisions." },
    ],
  },
  SUPER_ADMIN: {
    title: "Platform Administration",
    items: [
      { label: "Verification workflow", hint: "Doctor credential review defaults." },
      { label: "Scraper configuration", hint: "Sources, schedules and dedup rules." },
      { label: "Audit log retention", hint: "How long the audit trail is kept." },
      { label: "Custom roles", hint: "Roles with configurable permission sets." },
    ],
  },
};

export default async function SettingsPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const roleSection = ROLE_SECTIONS[session.role] ?? ROLE_SECTIONS.PATIENT;

  return (
    <section className="flex flex-col gap-6 py-10 px-4 md:px-8 max-w-3xl mx-auto w-full">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-text-primary">
          Settings
        </h1>
        <p className="text-sm text-text-secondary">
          Manage your account, appearance and workspace preferences.
        </p>
      </div>

      {/* Account */}
      <Card className="p-6 border border-border-custom bg-surface/50 backdrop-blur-md flex flex-col gap-4">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-base font-bold text-text-primary">Account</h2>
          <p className="text-xs text-text-secondary">
            Your identity on the Medicio platform.
          </p>
        </div>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="flex flex-col gap-0.5">
            <dt className="text-[10px] font-mono uppercase tracking-wider text-text-secondary">
              Full name
            </dt>
            <dd className="font-semibold text-text-primary">{session.name}</dd>
          </div>
          <div className="flex flex-col gap-0.5">
            <dt className="text-[10px] font-mono uppercase tracking-wider text-text-secondary">
              Email address
            </dt>
            <dd className="font-semibold text-text-primary break-all">
              {session.email}
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="text-[10px] font-mono uppercase tracking-wider text-text-secondary">
              Role
            </dt>
            <dd>
              <Chip
                variant="primary"
                color="accent"
                className="text-[10px] font-mono uppercase px-2 py-0.5"
              >
                {session.role.replace(/_/g, " ")}
              </Chip>
            </dd>
          </div>
        </dl>
      </Card>

      {/* Appearance */}
      <Card className="p-6 border border-border-custom bg-surface/50 backdrop-blur-md flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col gap-0.5">
            <h2 className="text-base font-bold text-text-primary">Appearance</h2>
            <p className="text-xs text-text-secondary">
              Switch between light and dark mode.
            </p>
          </div>
          <ThemeSwitch />
        </div>
      </Card>

      {/* Security */}
      <Card className="p-6 border border-border-custom bg-surface/50 backdrop-blur-md flex flex-col gap-4">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-base font-bold text-text-primary">Security</h2>
          <p className="text-xs text-text-secondary">
            Password and session controls.
          </p>
        </div>
        <ul className="flex flex-col divide-y divide-border-custom/50">
          {[
            { label: "Change password", hint: "Update your sign-in password." },
            { label: "Active sessions", hint: "Review and revoke signed-in devices." },
          ].map((item) => (
            <li key={item.label} className="flex items-center justify-between gap-4 py-3">
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-semibold text-text-primary">
                  {item.label}
                </span>
                <span className="text-xs text-text-secondary">{item.hint}</span>
              </div>
              <Chip size="sm" className="text-[9px] font-mono uppercase shrink-0">
                Soon
              </Chip>
            </li>
          ))}
        </ul>
      </Card>

      {/* Role-specific */}
      <Card className="p-6 border border-border-custom bg-surface/50 backdrop-blur-md flex flex-col gap-4">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-base font-bold text-text-primary">
            {roleSection.title}
          </h2>
          <p className="text-xs text-text-secondary">
            Preferences specific to your role. These unlock as their modules ship.
          </p>
        </div>
        <ul className="flex flex-col divide-y divide-border-custom/50">
          {roleSection.items.map((item) => (
            <li key={item.label} className="flex items-center justify-between gap-4 py-3">
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-semibold text-text-primary">
                  {item.label}
                </span>
                <span className="text-xs text-text-secondary">{item.hint}</span>
              </div>
              <Chip size="sm" className="text-[9px] font-mono uppercase shrink-0">
                Soon
              </Chip>
            </li>
          ))}
        </ul>
      </Card>
    </section>
  );
}
