"use client";

import { Button, Card, Chip } from "@heroui/react";
import {
  Activity,
  ArrowUpRight,
  CheckCircle2,
  Database,
  Globe,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
  UserCheck,
  Users,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function DashboardMetrics() {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success("Metrics and activity graphs refreshed");
    }, 600);
  };

  return (
    <div className="w-full flex flex-col gap-6 px-4 md:px-8 py-6 max-w-[1600px] mx-auto">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-custom pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-text-primary flex items-center gap-2">
            <span>Platform Overview & Analytics</span>
            <Chip variant="soft" color="accent" className="text-xs font-mono">
              Live System
            </Chip>
          </h2>
          <p className="text-xs text-text-secondary mt-1">
            Real-time telemetry, user registration trends, role distribution & system diagnostic graphs.
          </p>
        </div>

        <Button
          variant="outline"
          onPress={handleRefresh}
          isDisabled={isRefreshing}
          className="text-xs font-semibold px-4 text-text-primary flex items-center gap-2 w-fit"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
          {isRefreshing ? "Refreshing..." : "Refresh Analytics"}
        </Button>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 border border-border-custom bg-surface/50 backdrop-blur-md flex flex-col gap-3 shadow-sm hover:border-primary/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-secondary font-medium">Registered Accounts</span>
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-text-primary tracking-tight">1,248</span>
            <span className="text-xs text-emerald-400 font-semibold flex items-center">
              +14% <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
          </div>
          <p className="text-[11px] text-text-secondary">Active credentials across all 7 platform roles</p>
        </Card>

        <Card className="p-5 border border-border-custom bg-surface/50 backdrop-blur-md flex flex-col gap-3 shadow-sm hover:border-amber-500/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-secondary font-medium">Verified Practitioners</span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-text-primary tracking-tight">184</span>
            <span className="text-xs text-emerald-400 font-semibold flex items-center">
              +8% <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
          </div>
          <p className="text-[11px] text-text-secondary">Credentialed doctors & medical staff</p>
        </Card>

        <Card className="p-5 border border-border-custom bg-surface/50 backdrop-blur-md flex flex-col gap-3 shadow-sm hover:border-cyan-500/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-secondary font-medium">Scraped Directory Records</span>
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-500">
              <Globe className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-text-primary tracking-tight">4,820</span>
            <Chip variant="soft" color="accent" className="text-[10px] font-mono">
              M11 Engine
            </Chip>
          </div>
          <p className="text-[11px] text-text-secondary">Public clinics, pharmacies & diagnostic labs</p>
        </Card>

        <Card className="p-5 border border-border-custom bg-surface/50 backdrop-blur-md flex flex-col gap-3 shadow-sm hover:border-emerald-500/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-secondary font-medium">Audit Events & Telemetry</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-text-primary tracking-tight">99.98%</span>
            <Chip variant="soft" color="success" className="text-[10px] font-mono">
              Healthy
            </Chip>
          </div>
          <p className="text-[11px] text-text-secondary">RBAC verification uptime & log execution</p>
        </Card>
      </div>

      {/* Analytics Graphs & Visual Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Graph 1: Platform User Growth & Activity Trend */}
        <Card className="lg:col-span-2 p-6 border border-border-custom bg-surface/50 backdrop-blur-md flex flex-col gap-4 shadow-md">
          <div className="flex items-center justify-between border-b border-border-custom pb-3">
            <div>
              <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                <span>Monthly Registration & Active Consultation Trend</span>
              </h3>
              <p className="text-xs text-text-secondary mt-0.5">
                Aggregated patient signups and AI triage consultations over 6 months
              </p>
            </div>
            <Chip variant="soft" color="accent" className="text-[10px] font-mono">
              2026 Q3 Data
            </Chip>
          </div>

          {/* SVG Visual Area Chart */}
          <div className="w-full h-64 relative flex flex-col justify-end pt-4">
            <svg viewBox="0 0 600 200" className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="var(--primary)" />
                  <stop offset="100%" stopColor="var(--accent)" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1="0" y1="40" x2="600" y2="40" stroke="var(--border-custom)" strokeDasharray="4" opacity="0.5" />
              <line x1="0" y1="90" x2="600" y2="90" stroke="var(--border-custom)" strokeDasharray="4" opacity="0.5" />
              <line x1="0" y1="140" x2="600" y2="140" stroke="var(--border-custom)" strokeDasharray="4" opacity="0.5" />

              {/* Area Fill */}
              <path
                d="M 0 160 Q 100 120, 200 130 T 400 70 T 600 30 L 600 190 L 0 190 Z"
                fill="url(#areaGradient)"
              />

              {/* Line Path */}
              <path
                d="M 0 160 Q 100 120, 200 130 T 400 70 T 600 30"
                fill="none"
                stroke="url(#lineGradient)"
                strokeWidth="3.5"
                strokeLinecap="round"
              />

              {/* Data Points */}
              <circle cx="0" cy="160" r="5" fill="var(--primary)" className="transition-transform hover:scale-150" />
              <circle cx="120" cy="125" r="5" fill="var(--primary)" />
              <circle cx="240" cy="130" r="5" fill="var(--primary)" />
              <circle cx="360" cy="85" r="5" fill="var(--primary)" />
              <circle cx="480" cy="50" r="5" fill="var(--accent)" />
              <circle cx="600" cy="30" r="6" fill="var(--accent)" stroke="var(--surface)" strokeWidth="2" />
            </svg>

            {/* Month Labels */}
            <div className="flex items-center justify-between text-[11px] text-text-secondary font-mono pt-3 border-t border-border-custom/40">
              <span>Feb</span>
              <span>Mar</span>
              <span>Apr</span>
              <span>May</span>
              <span>Jun</span>
              <span>Jul (Current)</span>
            </div>
          </div>
        </Card>

        {/* Graph 2: Role Allocation Breakdown Chart */}
        <Card className="p-6 border border-border-custom bg-surface/50 backdrop-blur-md flex flex-col gap-4 shadow-md">
          <div className="border-b border-border-custom pb-3">
            <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-500" />
              <span>Role Distribution</span>
            </h3>
            <p className="text-xs text-text-secondary mt-0.5">
              Active account proportion by RBAC role
            </p>
          </div>

          <div className="flex flex-col gap-3 py-2">
            {[
              { role: "Patient (User)", percent: 65, count: "812", color: "bg-primary" },
              { role: "Doctor", percent: 15, count: "187", color: "bg-amber-500" },
              { role: "Hospital Admin", percent: 8, count: "100", color: "bg-cyan-500" },
              { role: "Pharmacy Admin", percent: 6, count: "75", color: "bg-emerald-500" },
              { role: "Lab Admin", percent: 4, count: "50", color: "bg-purple-500" },
              { role: "Super Admin & Admin", percent: 2, count: "24", color: "bg-rose-500" },
            ].map((item) => (
              <div key={item.role} className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-xs font-medium text-text-primary">
                  <span>{item.role}</span>
                  <span className="font-mono text-text-secondary">{item.count} ({item.percent}%)</span>
                </div>
                <div className="w-full h-2 rounded-full bg-background-custom overflow-hidden">
                  <div
                    className={`h-full rounded-full ${item.color} transition-all duration-500`}
                    style={{ width: `${item.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Bottom Row: System Audit Activity Stream & Health Indicators */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* System Activity Stream */}
        <Card className="lg:col-span-2 p-6 border border-border-custom bg-surface/50 backdrop-blur-md flex flex-col gap-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-border-custom pb-3">
            <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-400" />
              <span>Recent RBAC & System Audit Stream</span>
            </h3>
            <Chip variant="soft" color="success" className="text-[10px] font-mono">
              Live Audit Log
            </Chip>
          </div>

          <div className="space-y-3">
            {[
              { action: "ADMIN_USER_UPDATED", detail: "Role updated for user doctor.smith@medicio.com to DOCTOR", time: "2 mins ago", type: "success" },
              { action: "DOCTOR_CREDENTIAL_SUBMITTED", detail: "Dr. Sarah Jenkins uploaded license verification docs", time: "14 mins ago", type: "info" },
              { action: "SCRAPER_JOB_COMPLETED", detail: "Pharmacy inventory crawler synced 420 items from Central POS", time: "1 hour ago", type: "accent" },
              { action: "AUTH_SESSION_ISSUED", detail: "Super Admin authenticated session from IP 192.168.1.1", time: "2 hours ago", type: "success" },
            ].map((log, index) => (
              <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-background-custom/30 border border-border-custom/40">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono font-bold text-[11px] text-text-primary">{log.action}</span>
                    <span className="text-[10px] font-mono text-text-secondary">{log.time}</span>
                  </div>
                  <p className="text-xs text-text-secondary truncate mt-0.5">{log.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* System Health Card */}
        <Card className="p-6 border border-border-custom bg-surface/50 backdrop-blur-md flex flex-col gap-4 shadow-sm">
          <div className="border-b border-border-custom pb-3">
            <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              <span>Infrastructure Health</span>
            </h3>
            <p className="text-xs text-text-secondary mt-0.5">Database & LLM service status</p>
          </div>

          <div className="flex flex-col gap-3 text-xs">
            <div className="flex items-center justify-between p-3 rounded-lg bg-background-custom/40 border border-border-custom/50">
              <span className="font-medium text-text-primary">PostgreSQL Database</span>
              <Chip variant="soft" color="success" className="text-[10px] font-mono">Connected</Chip>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-background-custom/40 border border-border-custom/50">
              <span className="font-medium text-text-primary">Prisma Client ORM</span>
              <Chip variant="soft" color="success" className="text-[10px] font-mono">v6.19 Active</Chip>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-background-custom/40 border border-border-custom/50">
              <span className="font-medium text-text-primary">LLM Symptom Triage</span>
              <Chip variant="soft" color="accent" className="text-[10px] font-mono">Ready</Chip>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-background-custom/40 border border-border-custom/50">
              <span className="font-medium text-text-primary">PostHog Telemetry</span>
              <Chip variant="soft" color="success" className="text-[10px] font-mono">Tracking</Chip>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
