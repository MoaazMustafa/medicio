"use client";

import {
  Button,
  Card,
  Chip,
} from "@heroui/react";
import {
  Activity,
  CheckCircle2,
  Database,
  FileSpreadsheet,
  Globe,
  Plus,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Users,
} from "lucide-react";
import { useState } from "react";

import { UsersManager } from "@/components/admin/users-manager";

type TabKey = "users" | "verifications" | "scrapers" | "audit" | "roles";

export function AdminDashboardTabs() {
  const [selectedTab, setSelectedTab] = useState<TabKey>("users");

  return (
    <div className="w-full flex flex-col gap-6 px-4 md:px-8 py-6 max-w-[1600px] mx-auto">
      {/* Metrics Banner inspired by Dashboard.svg */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <Card className="p-4 border border-border-custom bg-surface/40 backdrop-blur-md flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-secondary font-medium">Platform Accounts</span>
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-text-primary">Live</span>
            <Chip variant="soft" color="success" className="text-[10px] font-mono">
              RBAC Enabled
            </Chip>
          </div>
          <span className="text-[11px] text-text-secondary">
            User directory, authentication & role governance
          </span>
        </Card>

        {/* Metric 2 */}
        <Card className="p-4 border border-border-custom bg-surface/40 backdrop-blur-md flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-secondary font-medium">Doctor Approvals</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-text-primary">Verification</span>
            <Chip variant="soft" color="warning" className="text-[10px] font-mono">
              Queue Ready
            </Chip>
          </div>
          <span className="text-[11px] text-text-secondary">
            M4 Credential verification workflow
          </span>
        </Card>

        {/* Metric 3 */}
        <Card className="p-4 border border-border-custom bg-surface/40 backdrop-blur-md flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-secondary font-medium">Scraper Engine</span>
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-500">
              <Globe className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-text-primary">M11 Engine</span>
            <Chip variant="soft" color="accent" className="text-[10px] font-mono">
              Crawlers
            </Chip>
          </div>
          <span className="text-[11px] text-text-secondary">
            Public directory scraping & deduplication
          </span>
        </Card>

        {/* Metric 4 */}
        <Card className="p-4 border border-border-custom bg-surface/40 backdrop-blur-md flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-secondary font-medium">Audit & Analytics</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-text-primary">PostHog</span>
            <Chip variant="soft" color="success" className="text-[10px] font-mono">
              Logs Active
            </Chip>
          </div>
          <span className="text-[11px] text-text-secondary">
            M12 System audit trail & user analytics
          </span>
        </Card>
      </div>

      {/* Tabs Bar using HeroUI Button pills */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2 border-b border-border-custom pb-3 overflow-x-auto">
          <Button
            variant={selectedTab === "users" ? "primary" : "outline"}
            onPress={() => setSelectedTab("users")}
            className={`text-xs font-semibold px-4 py-2 flex items-center gap-2 shrink-0 ${
              selectedTab === "users" ? "" : "text-text-secondary"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>User Management</span>
          </Button>

          <Button
            variant={selectedTab === "verifications" ? "primary" : "outline"}
            onPress={() => setSelectedTab("verifications")}
            className={`text-xs font-semibold px-4 py-2 flex items-center gap-2 shrink-0 ${
              selectedTab === "verifications" ? "" : "text-text-secondary"
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Doctor Verifications</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
              M4
            </span>
          </Button>

          <Button
            variant={selectedTab === "scrapers" ? "primary" : "outline"}
            onPress={() => setSelectedTab("scrapers")}
            className={`text-xs font-semibold px-4 py-2 flex items-center gap-2 shrink-0 ${
              selectedTab === "scrapers" ? "" : "text-text-secondary"
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>Scraper Engine</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              M11
            </span>
          </Button>

          <Button
            variant={selectedTab === "audit" ? "primary" : "outline"}
            onPress={() => setSelectedTab("audit")}
            className={`text-xs font-semibold px-4 py-2 flex items-center gap-2 shrink-0 ${
              selectedTab === "audit" ? "" : "text-text-secondary"
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Audit Logs & Analytics</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              M12
            </span>
          </Button>

          <Button
            variant={selectedTab === "roles" ? "primary" : "outline"}
            onPress={() => setSelectedTab("roles")}
            className={`text-xs font-semibold px-4 py-2 flex items-center gap-2 shrink-0 ${
              selectedTab === "roles" ? "" : "text-text-secondary"
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Custom Roles</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
              M1
            </span>
          </Button>
        </div>

        {/* Tab 1: User Management (Active User Table) */}
        {selectedTab === "users" && (
          <div className="w-full flex flex-col gap-6 animate-in fade-in duration-300">
            <UsersManager />
          </div>
        )}

        {/* Tab 2: Doctor Verifications Queue (M4) */}
        {selectedTab === "verifications" && (
          <div className="w-full flex flex-col gap-6 animate-in fade-in duration-300">
            <Card className="p-6 border border-border-custom bg-surface/50 backdrop-blur-md flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-border-custom pb-4">
                <div>
                  <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-amber-500" />
                    Doctor Credential Verification Queue (M4)
                  </h2>
                  <p className="text-xs text-text-secondary mt-1">
                    Review licenses, degree certificates, and specialty practice documents submitted by registering practitioners.
                  </p>
                </div>
                <Button variant="primary" className="text-xs font-semibold px-4">
                  Review Pending Queue
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-4 border border-border-custom bg-background-custom/40 flex flex-col gap-2">
                  <span className="text-xs font-mono uppercase text-amber-400 font-semibold">Pending Approvals</span>
                  <span className="text-2xl font-bold text-text-primary">0 Requests</span>
                  <p className="text-xs text-text-secondary">No unverified doctor licenses awaiting manual review.</p>
                </Card>
                <Card className="p-4 border border-border-custom bg-background-custom/40 flex flex-col gap-2">
                  <span className="text-xs font-mono uppercase text-emerald-400 font-semibold">Verified Doctors</span>
                  <span className="text-2xl font-bold text-text-primary">Active</span>
                  <p className="text-xs text-text-secondary">Fully credentialed doctors active on the platform.</p>
                </Card>
                <Card className="p-4 border border-border-custom bg-background-custom/40 flex flex-col gap-2">
                  <span className="text-xs font-mono uppercase text-sky-400 font-semibold">Verification SLA</span>
                  <span className="text-2xl font-bold text-text-primary font-mono">&lt; 24h</span>
                  <p className="text-xs text-text-secondary">Target turnaround time for doctor onboarding.</p>
                </Card>
              </div>

              {/* Space for future implementation continuation */}
              <div className="mt-4 p-8 border-2 border-dashed border-border-custom rounded-xl flex flex-col items-center justify-center text-center gap-3 bg-background-custom/20">
                <Sparkles className="w-8 h-8 text-primary/60" />
                <h3 className="text-sm font-bold text-text-primary">Verification Pipeline Ready</h3>
                <p className="text-xs text-text-secondary max-w-md">
                  Upload document previewer and instant license API verification modal modules will be attached here.
                </p>
              </div>
            </Card>
          </div>
        )}

        {/* Tab 3: Scraper Engine (M11) */}
        {selectedTab === "scrapers" && (
          <div className="w-full flex flex-col gap-6 animate-in fade-in duration-300">
            <Card className="p-6 border border-border-custom bg-surface/50 backdrop-blur-md flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-border-custom pb-4">
                <div>
                  <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
                    <Globe className="w-5 h-5 text-primary" />
                    Data Aggregation & Scraper Engine (M11)
                  </h2>
                  <p className="text-xs text-text-secondary mt-1">
                    Super Admin automated crawlers for Facebook, Google Maps & public clinical directories with deduplication.
                  </p>
                </div>
                <Button variant="primary" className="text-xs font-semibold px-4 flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5" />
                  Run Scraper Job
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { name: "Doctor Scraper", target: "Public Registries", status: "Idle", badge: "Doctor" },
                  { name: "Hospital Scraper", target: "Clinical Directory", status: "Scheduled", badge: "Hospital" },
                  { name: "Pharmacy Scraper", target: "Local Outlets", status: "Idle", badge: "Pharmacy" },
                  { name: "Diagnostic Lab Scraper", target: "Lab Centers", status: "Idle", badge: "Lab" },
                ].map((item) => (
                  <Card key={item.name} className="p-4 border border-border-custom bg-background-custom/40 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-primary">{item.badge}</span>
                      <Chip variant="soft" className="text-[10px] font-mono">{item.status}</Chip>
                    </div>
                    <h4 className="text-sm font-bold text-text-primary">{item.name}</h4>
                    <p className="text-xs text-text-secondary">Source: {item.target}</p>
                  </Card>
                ))}
              </div>

              {/* Space for future implementation continuation */}
              <div className="mt-4 p-8 border-2 border-dashed border-border-custom rounded-xl flex flex-col items-center justify-center text-center gap-3 bg-background-custom/20">
                <Database className="w-8 h-8 text-cyan-400/60" />
                <h3 className="text-sm font-bold text-text-primary">Crawler Execution Control Panel</h3>
                <p className="text-xs text-text-secondary max-w-md">
                  Target URL input fields, geo-radius selector, and crawler log streaming output will expand in this space.
                </p>
              </div>
            </Card>
          </div>
        )}

        {/* Tab 4: Audit Logs & Analytics (M12) */}
        {selectedTab === "audit" && (
          <div className="w-full flex flex-col gap-6 animate-in fade-in duration-300">
            <Card className="p-6 border border-border-custom bg-surface/50 backdrop-blur-md flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-border-custom pb-4">
                <div>
                  <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
                    <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                    Audit Trails & PostHog Analytics (M12)
                  </h2>
                  <p className="text-xs text-text-secondary mt-1">
                    System action logs, RBAC authorization events, and platform analytical telemetry.
                  </p>
                </div>
                <Button variant="outline" className="text-xs font-semibold px-4 text-text-primary">
                  Export Log Dump
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-4 border border-border-custom bg-background-custom/40 flex flex-col gap-2">
                  <span className="text-xs font-mono uppercase text-emerald-400 font-semibold">Audit Logging</span>
                  <span className="text-xl font-bold text-text-primary">Active</span>
                  <p className="text-xs text-text-secondary">Writing RBAC checks & database actions to audit trail.</p>
                </Card>
                <Card className="p-4 border border-border-custom bg-background-custom/40 flex flex-col gap-2">
                  <span className="text-xs font-mono uppercase text-primary font-semibold">PostHog SDK</span>
                  <span className="text-xl font-bold text-text-primary">Connected</span>
                  <p className="text-xs text-text-secondary">Tracking product funnel & symptom triage events.</p>
                </Card>
                <Card className="p-4 border border-border-custom bg-background-custom/40 flex flex-col gap-2">
                  <span className="text-xs font-mono uppercase text-purple-400 font-semibold">Access Level</span>
                  <span className="text-xl font-bold text-text-primary">Super Admin</span>
                  <p className="text-xs text-text-secondary">Restricted audit visibility per security guidelines.</p>
                </Card>
              </div>

              {/* Space for future implementation continuation */}
              <div className="mt-4 p-8 border-2 border-dashed border-border-custom rounded-xl flex flex-col items-center justify-center text-center gap-3 bg-background-custom/20">
                <Activity className="w-8 h-8 text-emerald-400/60" />
                <h3 className="text-sm font-bold text-text-primary">Log Query Builder & Analytics Widgets</h3>
                <p className="text-xs text-text-secondary max-w-md">
                  Interactive event timeline search, IP query filter, and live PostHog charts will be integrated here.
                </p>
              </div>
            </Card>
          </div>
        )}

        {/* Tab 5: Custom Roles (M1) */}
        {selectedTab === "roles" && (
          <div className="w-full flex flex-col gap-6 animate-in fade-in duration-300">
            <Card className="p-6 border border-border-custom bg-surface/50 backdrop-blur-md flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-border-custom pb-4">
                <div>
                  <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-purple-400" />
                    Custom Roles & Permission Matrix (M1)
                  </h2>
                  <p className="text-xs text-text-secondary mt-1">
                    Super Admin role builder for configuring custom permissions across modules M1–M12.
                  </p>
                </div>
                <Button variant="primary" className="text-xs font-semibold px-4 flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5" />
                  Create New Role
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { name: "Super Admin", count: "Full Access", status: "System Predefined" },
                  { name: "Admin / Manager", count: "Oversight Access", status: "System Predefined" },
                  { name: "Doctor", count: "Provider Access", status: "System Predefined" },
                  { name: "Hospital Admin", count: "Facility Access", status: "System Predefined" },
                  { name: "Pharmacy Admin", count: "Inventory Access", status: "System Predefined" },
                  { name: "Labs Admin", count: "Diagnostic Access", status: "System Predefined" },
                ].map((role) => (
                  <Card key={role.name} className="p-4 border border-border-custom bg-background-custom/40 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono text-purple-400 font-bold">{role.status}</span>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    </div>
                    <h4 className="text-sm font-bold text-text-primary">{role.name}</h4>
                    <p className="text-xs text-text-secondary">{role.count}</p>
                  </Card>
                ))}
              </div>

              {/* Space for future implementation continuation */}
              <div className="mt-4 p-8 border-2 border-dashed border-border-custom rounded-xl flex flex-col items-center justify-center text-center gap-3 bg-background-custom/20">
                <ShieldAlert className="w-8 h-8 text-purple-400/60" />
                <h3 className="text-sm font-bold text-text-primary">Permission Matrix Matrix Configurator</h3>
                <p className="text-xs text-text-secondary max-w-md">
                  Custom role creation form with granular feature checkbox matrix will expand in this space.
                </p>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
