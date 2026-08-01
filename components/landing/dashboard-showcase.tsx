"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  Bot,
  CalendarCheck,
  FlaskConical,
  LayoutDashboard,
  Search,
  Send,
  ShieldCheck,
  TrendingUp,
  Users,
} from "lucide-react";
import type { ComponentType } from "react";
import { useState } from "react";

import { EASE, FadeUp } from "@/components/landing/motion";
import { Container, SectionHeading } from "@/components/landing/primitives";

type Tab = "overview" | "patients" | "assistant";

const TABS: { id: Tab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "patients", label: "Patients", icon: Users },
  { id: "assistant", label: "AI Assistant", icon: Bot },
];

const STATS = [
  { label: "Appointments today", value: "24", trend: "+4 vs yesterday" },
  { label: "New patients", value: "132", trend: "+18% this week" },
  { label: "AI triages handled", value: "1,208", trend: "97% resolved" },
] as const;

const PATIENTS = [
  { name: "Nadia Hossain", concern: "Migraine follow-up", severity: "Moderate", time: "09:40", tint: "bg-amber-400" },
  { name: "Rafiq Ahmed", concern: "Hypertension check", severity: "Routine", time: "10:15", tint: "bg-emerald-400" },
  { name: "Sara Iqbal", concern: "Chest discomfort", severity: "Urgent", time: "10:40", tint: "bg-rose-400" },
  { name: "Tanvir Khan", concern: "Lab results review", severity: "Routine", time: "11:20", tint: "bg-emerald-400" },
  { name: "Maya Chowdhury", concern: "Skin rash — AI triaged", severity: "Moderate", time: "11:55", tint: "bg-amber-400" },
] as const;

const APPOINTMENTS = [
  { time: "12:30", label: "Telehealth · Anika R.", icon: CalendarCheck },
  { time: "14:00", label: "Lab review · Helix", icon: FlaskConical },
  { time: "15:30", label: "New patient · walk-in", icon: Users },
] as const;

/* -------------------------------- Widgets --------------------------------- */

function StatCards() {
  return (
    <div className="grid grid-cols-3 gap-3">
      {STATS.map((stat) => (
        <div key={stat.label} className="rounded-xl border border-white/10 bg-white/5 p-3.5">
          <p className="truncate text-[10px] font-medium text-slate-400">{stat.label}</p>
          <p className="mt-1 text-xl font-bold text-white">{stat.value}</p>
          <p className="mt-0.5 flex items-center gap-1 truncate text-[10px] font-medium text-teal-300">
            <TrendingUp className="h-3 w-3 shrink-0" />
            {stat.trend}
          </p>
        </div>
      ))}
    </div>
  );
}

function TriageChart() {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold text-slate-300">Patient flow · this week</p>
        <span className="rounded-full bg-teal-400/10 px-2 py-0.5 text-[10px] font-semibold text-teal-300">
          +23%
        </span>
      </div>
      <svg aria-hidden className="mt-3 h-28 w-full" preserveAspectRatio="none" viewBox="0 0 400 110">
        <defs>
          <linearGradient id="chart-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#2DD4BF" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#2DD4BF" stopOpacity="0" />
          </linearGradient>
        </defs>
        <motion.path
          d="M0 88 C40 82, 60 60, 95 62 C130 64, 150 40, 190 44 C230 48, 250 26, 290 30 C330 34, 355 18, 400 12"
          fill="none"
          initial={{ pathLength: 0 }}
          stroke="#2DD4BF"
          strokeLinecap="round"
          strokeWidth="2.5"
          transition={{ duration: 1.6, ease: EASE }}
          viewport={{ once: true }}
          whileInView={{ pathLength: 1 }}
        />
        <path
          d="M0 88 C40 82, 60 60, 95 62 C130 64, 150 40, 190 44 C230 48, 250 26, 290 30 C330 34, 355 18, 400 12 L400 110 L0 110 Z"
          fill="url(#chart-fill)"
        />
      </svg>
      <div className="mt-1 flex justify-between text-[9px] font-medium uppercase tracking-wide text-slate-500">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
    </div>
  );
}

function AppointmentsList() {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <p className="text-[11px] font-semibold text-slate-300">Up next</p>
      <div className="mt-3 flex flex-col gap-2.5">
        {APPOINTMENTS.map((a) => (
          <div key={a.label} className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-teal-400/10">
              <a.icon className="h-3.5 w-3.5 text-teal-300" />
            </span>
            <p className="min-w-0 flex-1 truncate text-[11px] text-slate-300">{a.label}</p>
            <span className="shrink-0 text-[10px] font-semibold text-slate-500">{a.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function OverviewPanel() {
  return (
    <div className="flex flex-col gap-3">
      <StatCards />
      <div className="grid gap-3 md:grid-cols-[1.6fr_1fr]">
        <TriageChart />
        <AppointmentsList />
      </div>
    </div>
  );
}

function PatientsPanel() {
  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-white/5">
      <div className="grid grid-cols-[1.4fr_1.6fr_auto_auto] gap-3 border-b border-white/10 px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
        <span>Patient</span>
        <span className="hidden sm:block">Concern</span>
        <span>Severity</span>
        <span>Time</span>
      </div>
      {PATIENTS.map((p) => (
        <div
          key={p.name}
          className="grid grid-cols-[1.4fr_1.6fr_auto_auto] items-center gap-3 border-b border-white/5 px-4 py-3 transition-colors last:border-0 hover:bg-white/5"
        >
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-teal-400/30 to-cyan-400/30 text-[10px] font-bold text-teal-200">
              {p.name.split(" ").map((n) => n[0]).join("")}
            </span>
            <span className="truncate text-[11px] font-semibold text-white">{p.name}</span>
          </div>
          <span className="hidden truncate text-[11px] text-slate-400 sm:block">{p.concern}</span>
          <span className="flex items-center gap-1.5 text-[10px] font-medium text-slate-300">
            <span className={`h-1.5 w-1.5 rounded-full ${p.tint}`} />
            {p.severity}
          </span>
          <span className="text-[10px] font-semibold text-slate-500">{p.time}</span>
        </div>
      ))}
    </div>
  );
}

function AssistantPanel() {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-start gap-2.5">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal-400/15">
          <Bot className="h-3.5 w-3.5 text-teal-300" />
        </span>
        <div className="rounded-2xl rounded-tl-sm border border-white/10 bg-white/5 px-3.5 py-2.5 text-[11px] leading-relaxed text-slate-300">
          Good morning, Dr. Karim. You have 24 appointments today. Sara Iqbal&apos;s
          intake flags chest discomfort — I&apos;ve marked her urgent and moved
          her to 10:40.
        </div>
      </div>
      <div className="flex justify-end">
        <div className="rounded-2xl rounded-tr-sm bg-teal-400 px-3.5 py-2.5 text-[11px] font-medium text-slate-950">
          Summarize her history before the visit.
        </div>
      </div>
      <div className="flex items-start gap-2.5">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal-400/15">
          <Bot className="h-3.5 w-3.5 text-teal-300" />
        </span>
        <div className="rounded-2xl rounded-tl-sm border border-white/10 bg-white/5 px-3.5 py-2.5 text-[11px] leading-relaxed text-slate-300">
          Done — 34-year-old, non-smoker, normal ECG in March. Two AI triages in
          6 months, both stress-related. Full summary is on her chart.
        </div>
      </div>
      <div className="mt-1 flex items-center gap-2 rounded-full border border-white/10 bg-white/5 py-1.5 pl-4 pr-1.5">
        <span className="flex-1 text-[11px] text-slate-500">Ask about a patient, slot or report…</span>
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-teal-400 text-slate-950">
          <Send className="h-3 w-3" />
        </span>
      </div>
    </div>
  );
}

const PANELS: Record<Tab, ComponentType> = {
  overview: OverviewPanel,
  patients: PatientsPanel,
  assistant: AssistantPanel,
};

/* --------------------------------- Section -------------------------------- */

export function DashboardShowcase() {
  const [tab, setTab] = useState<Tab>("overview");
  const Panel = PANELS[tab];

  return (
    <section className="relative overflow-hidden bg-[#05080d] py-20 md:py-28">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="glow-spot left-[15%] top-[-10%] h-96 w-96 bg-teal-500/15" />
        <div className="glow-spot bottom-[-20%] right-[10%] h-96 w-96 bg-cyan-500/10" />
      </div>

      <Container className="relative">
        <SectionHeading
          description="A live command center for every role — doctors, hospitals, labs and pharmacies each get a workspace shaped around their day."
          eyebrow="Provider workspace"
          title="Run your practice from one calm dashboard"
          tone="dark"
        />

        <FadeUp className="relative mt-12 lg:mt-16" delay={0.1}>
          {/* Floating notification */}
          <div aria-hidden className="pointer-events-none absolute -top-6 right-4 z-20 hidden md:block">
            <div className="float-medium">
              <div className="flex items-center gap-2.5 rounded-2xl border border-white/10 bg-[#0d141d]/90 px-4 py-3 shadow-2xl backdrop-blur-md">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-400/15">
                  <Bell className="h-3.5 w-3.5 text-teal-300" />
                </span>
                <div>
                  <p className="text-[11px] font-semibold text-white">New lab report received</p>
                  <p className="text-[10px] text-slate-400">Tanvir Khan · CBC · just now</p>
                </div>
              </div>
            </div>
          </div>

          {/* Dashboard frame */}
          <div className="relative rounded-3xl border border-white/10 bg-white/[0.03] p-2 shadow-[0_40px_120px_-40px_rgba(45,212,191,0.25)]">
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0a0f16]">
              {/* Topbar */}
              <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
                <span className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-400/60" />
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-400/60" />
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/60" />
                </span>
                <div className="ml-2 hidden flex-1 items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 sm:flex sm:max-w-xs">
                  <Search className="h-3 w-3 text-slate-500" />
                  <span className="text-[10px] text-slate-500">Search patients, reports…</span>
                </div>
                <div className="ml-auto flex items-center gap-3">
                  <span className="relative">
                    <Bell className="h-4 w-4 text-slate-400" />
                    <span className="pulse-dot absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-teal-300" />
                  </span>
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 text-[10px] font-bold text-slate-950">
                    SK
                  </span>
                </div>
              </div>

              <div className="grid md:grid-cols-[200px_1fr]">
                {/* Sidebar */}
                <nav
                  aria-label="Dashboard sections"
                  className="flex gap-1 border-b border-white/10 p-2 md:flex-col md:border-b-0 md:border-r md:p-3"
                >
                  {TABS.map((t) => {
                    const activeTab = t.id === tab;

                    return (
                      <button
                        key={t.id}
                        aria-pressed={activeTab}
                        className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-[11px] font-semibold transition-all duration-200 md:flex-none md:justify-start ${
                          activeTab
                            ? "bg-teal-400/15 text-teal-200"
                            : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                        }`}
                        type="button"
                        onClick={() => setTab(t.id)}
                      >
                        <t.icon className="h-3.5 w-3.5" />
                        {t.label}
                      </button>
                    );
                  })}
                  <div className="mt-auto hidden items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 md:flex">
                    <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-teal-300" />
                    <span className="text-[10px] leading-tight text-slate-400">
                      Role-guarded · encrypted
                    </span>
                  </div>
                </nav>

                {/* Main panel */}
                <div className="min-h-[340px] p-4 sm:p-5">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={tab}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      initial={{ opacity: 0, y: 14 }}
                      transition={{ duration: 0.3, ease: EASE }}
                    >
                      <Panel />
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
        </FadeUp>
      </Container>
    </section>
  );
}
