"use client";

import { Button, Card, Chip, Input } from "@heroui/react";
import {
  ArrowUpRight,
  Bot,
  Building2,
  CalendarCheck,
  CalendarDays,
  Clock,
  Download,
  FileText,
  FlaskConical,
  FolderHeart,
  MessageSquareText,
  Pill,
  RefreshCw,
  ShieldAlert,
  Stethoscope,
} from "lucide-react";
import NextLink from "next/link";
import React, { useCallback, useEffect, useState } from "react";

import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────

interface LabReport {
  id: string;
  testName: string;
  resultData: string;
  fileUrl?: string;
  labName: string;
  labId: string;
  isVerified: boolean;
  createdAt: string;
}

interface AppointmentRecord {
  id: string;
  dateTime: string;
  status: string;
  notes?: string;
  createdAt: string;
  doctorName: string;
  doctorSpecialty: string;
  consultationFee?: number;
  clinicAddress?: string;
  hospitalName?: string;
  hospitalLocation?: string;
}

interface MedicineRecord {
  id: string;
  medicineName: string;
  dosage: string;
  frequency: string;
  startDate: string;
  endDate?: string;
  createdAt: string;
}

interface AISession {
  id: string;
  conversationType: string;
  title?: string;
  symptomPrompt: string;
  severityLevel?: string;
  suggestedSpecialty?: string;
  summary?: string;
  messageCount: number;
  createdAt: string;
}

interface HealthRecords {
  labReports: LabReport[];
  appointments: AppointmentRecord[];
  medicines: MedicineRecord[];
  aiSessions: AISession[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(dt: string) {
  return new Date(dt).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(dt: string) {
  return new Date(dt).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isActiveMedicine(m: MedicineRecord): boolean {
  if (!m.endDate) return true;
  return new Date(m.endDate) >= new Date();
}

function getSeverityColor(severity?: string): "danger" | "warning" | "accent" | "success" | "default" {
  switch (severity) {
    case "CRITICAL": return "danger";
    case "HIGH":     return "warning";
    case "MEDIUM":   return "accent";
    case "LOW":      return "success";
    default:         return "default";
  }
}

function getStatusColor(status: string): "default" | "accent" | "success" | "danger" | "warning" {
  switch (status) {
    case "PENDING":   return "warning";
    case "CONFIRMED": return "accent";
    case "COMPLETED": return "success";
    case "CANCELLED": return "danger";
    default:          return "default";
  }
}

// ─── Sub-sections ─────────────────────────────────────────────────────────────

function LabReportsTab({ records }: { records: LabReport[] }) {
  const [query, setQuery] = useState("");

  const filtered = records.filter((r) => {
    const q = query.toLowerCase();
    const testName = (r.testName || "").toLowerCase();
    const labName = (r.labName || "").toLowerCase();
    return !q || testName.includes(q) || labName.includes(q);
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Input
          className="max-w-sm text-xs"
          placeholder="Search by test name or lab…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <span className="text-xs text-text-secondary">{filtered.length} report{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      {filtered.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-3 border border-border-custom bg-surface/30 p-10 text-center">
          <FlaskConical className="h-8 w-8 text-text-secondary" />
          <h3 className="text-sm font-bold text-text-primary">No lab reports</h3>
          <p className="max-w-xs text-xs text-text-secondary">
            {query ? "No reports match your search." : "Lab reports uploaded by your testing lab will appear here."}
          </p>
        </Card>
      ) : (
        <div className="flex flex-col gap-2.5">
          {filtered.map((report) => (
            <Card
              key={report.id}
              className="flex flex-col gap-3 border border-border-custom bg-surface/70 p-4 shadow-xs transition-all hover:border-primary/40 sm:flex-row sm:items-start"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
                <FileText className="h-4 w-4" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-bold text-text-primary">{report.testName}</h3>
                  <Chip
                    className="text-[9px] font-mono font-bold uppercase"
                    color={report.isVerified ? "success" : "default"}
                    size="sm"
                    variant="soft"
                  >
                    {report.isVerified ? "Verified Lab" : "Unregistered Lab"}
                  </Chip>
                </div>

                <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-text-secondary">
                  <span className="flex items-center gap-1">
                    <FlaskConical className="h-3 w-3 text-primary" />
                    {report.labName}
                  </span>
                  <span className="flex items-center gap-1">
                    <CalendarDays className="h-3 w-3 text-primary" />
                    {formatDate(report.createdAt)}
                  </span>
                </div>

                {report.resultData && (
                  <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-text-secondary">
                    {(() => {
                      try {
                        const parsed = JSON.parse(report.resultData);
                        return typeof parsed === "string" ? parsed : JSON.stringify(parsed);
                      } catch {
                        return report.resultData;
                      }
                    })()}
                  </p>
                )}
              </div>

              {report.fileUrl && (
                <a
                  href={report.fileUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  <Button
                    className="h-8 shrink-0 px-3 text-[11px] font-semibold"
                    size="sm"
                    variant="secondary"
                  >
                    <Download className="mr-1.5 h-3.5 w-3.5" /> Download
                  </Button>
                </a>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function AppointmentsTab({ records }: { records: AppointmentRecord[] }) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const filtered = records.filter((a) => {
    const q = query.toLowerCase();
    const docName = (a.doctorName || "").toLowerCase();
    const docSpecialty = (a.doctorSpecialty || "").toLowerCase();
    const matchSearch = !q || docName.includes(q) || docSpecialty.includes(q);
    const matchStatus = statusFilter === "ALL" || a.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input
          className="max-w-sm text-xs"
          placeholder="Search by doctor or specialty…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {["ALL", "PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"].map((s) => (
            <Button
              key={s}
              className="h-7 shrink-0 px-2.5 text-[11px] font-semibold"
              size="sm"
              variant={statusFilter === s ? "primary" : "secondary"}
              onPress={() => setStatusFilter(s)}
            >
              {s}
            </Button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-3 border border-border-custom bg-surface/30 p-10 text-center">
          <CalendarCheck className="h-8 w-8 text-text-secondary" />
          <h3 className="text-sm font-bold text-text-primary">No appointments found</h3>
          <p className="text-xs text-text-secondary">
            {query || statusFilter !== "ALL" ? "No appointments match your filter." : "Your appointment history will appear here."}
          </p>
          <NextLink href="/appointments">
            <Button className="mt-2 text-xs font-semibold" size="sm" variant="primary">
              <CalendarDays className="mr-1 h-3.5 w-3.5" /> Book Appointment
            </Button>
          </NextLink>
        </Card>
      ) : (
        <div className="flex flex-col gap-2.5">
          {filtered.map((appt) => (
            <Card
              key={appt.id}
              className="flex flex-col gap-3 border border-border-custom bg-surface/70 p-4 shadow-xs sm:flex-row sm:items-start"
            >
              <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl border border-border-custom bg-surface/80">
                <span className="font-mono text-[10px] font-bold uppercase text-text-secondary">
                  {new Date(appt.dateTime).toLocaleDateString(undefined, { month: "short" })}
                </span>
                <span className="text-xl font-bold leading-none text-text-primary">
                  {new Date(appt.dateTime).getDate()}
                </span>
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-bold text-text-primary">Dr. {appt.doctorName}</h3>
                  <Chip
                    className="text-[9px] font-mono font-bold uppercase"
                    color={getStatusColor(appt.status)}
                    size="sm"
                    variant="soft"
                  >
                    {appt.status}
                  </Chip>
                </div>

                <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-text-secondary">
                  <span className="flex items-center gap-1">
                    <Stethoscope className="h-3 w-3 text-primary" />
                    {appt.doctorSpecialty}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-primary" />
                    {formatDateTime(appt.dateTime)}
                  </span>
                  {appt.hospitalName && (
                    <span className="flex items-center gap-1">
                      <Building2 className="h-3 w-3 text-primary" />
                      {appt.hospitalName}
                    </span>
                  )}
                </div>

                {appt.notes && (
                  <p className="mt-1.5 text-xs text-text-secondary">
                    <span className="font-semibold">Notes:</span> {appt.notes}
                  </p>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function MedicinesTab({ records }: { records: MedicineRecord[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"ALL" | "ACTIVE" | "COMPLETED">("ALL");

  const filtered = records.filter((m) => {
    const q = query.toLowerCase();
    const medName = (m.medicineName || "").toLowerCase();
    const dosage = (m.dosage || "").toLowerCase();
    const matchSearch = !q || medName.includes(q) || dosage.includes(q);
    const active = isActiveMedicine(m);
    const matchFilter =
      filter === "ALL" ||
      (filter === "ACTIVE" && active) ||
      (filter === "COMPLETED" && !active);
    return matchSearch && matchFilter;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input
          className="max-w-sm text-xs"
          placeholder="Search by medicine name…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="flex items-center gap-1.5">
          {(["ALL", "ACTIVE", "COMPLETED"] as const).map((s) => (
            <Button
              key={s}
              className="h-7 shrink-0 px-2.5 text-[11px] font-semibold"
              size="sm"
              variant={filter === s ? "primary" : "secondary"}
              onPress={() => setFilter(s)}
            >
              {s}
            </Button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-3 border border-border-custom bg-surface/30 p-10 text-center">
          <Pill className="h-8 w-8 text-text-secondary" />
          <h3 className="text-sm font-bold text-text-primary">No medicines found</h3>
          <p className="text-xs text-text-secondary">
            {query || filter !== "ALL" ? "No medicines match your filter." : "Your medicine history will appear here."}
          </p>
          <NextLink href="/medicines">
            <Button className="mt-2 text-xs font-semibold" size="sm" variant="primary">
              <Pill className="mr-1 h-3.5 w-3.5" /> Medicine Tracker
            </Button>
          </NextLink>
        </Card>
      ) : (
        <div className="flex flex-col gap-2.5">
          {filtered.map((med) => {
            const active = isActiveMedicine(med);
            return (
              <Card
                key={med.id}
                className="flex flex-col gap-3 border border-border-custom bg-surface/70 p-4 shadow-xs sm:flex-row sm:items-center"
              >
                <div
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border",
                    active
                      ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-500"
                      : "border-border-custom bg-surface/80 text-text-secondary",
                  )}
                >
                  <Pill className="h-4 w-4" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-bold text-text-primary">{med.medicineName}</h3>
                    <Chip
                      className="text-[9px] font-mono font-bold uppercase"
                      color={active ? "success" : "default"}
                      size="sm"
                      variant="soft"
                    >
                      {active ? "Active" : "Completed"}
                    </Chip>
                  </div>

                  <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-text-secondary">
                    <span>{med.dosage}</span>
                    <span>·</span>
                    <span>{med.frequency}</span>
                    <span>·</span>
                    <span>
                      {formatDate(med.startDate)}
                      {med.endDate && ` → ${formatDate(med.endDate)}`}
                    </span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function AISessionsTab({ records }: { records: AISession[] }) {
  const [query, setQuery] = useState("");
  const [severityFilter, setSeverityFilter] = useState("ALL");

  const filtered = records.filter((s) => {
    const q = query.toLowerCase();
    const matchSearch =
      !q ||
      (s.title || "").toLowerCase().includes(q) ||
      s.symptomPrompt.toLowerCase().includes(q) ||
      (s.suggestedSpecialty || "").toLowerCase().includes(q);
    const matchSeverity =
      severityFilter === "ALL" || (s.severityLevel || "").toUpperCase() === severityFilter;
    return matchSearch && matchSeverity;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input
          className="max-w-sm text-xs"
          placeholder="Search by symptom or specialty…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"].map((s) => (
            <Button
              key={s}
              className="h-7 shrink-0 px-2.5 text-[11px] font-semibold"
              size="sm"
              variant={severityFilter === s ? "primary" : "secondary"}
              onPress={() => setSeverityFilter(s)}
            >
              {s}
            </Button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-3 border border-border-custom bg-surface/30 p-10 text-center">
          <Bot className="h-8 w-8 text-text-secondary" />
          <h3 className="text-sm font-bold text-text-primary">No AI sessions found</h3>
          <p className="text-xs text-text-secondary">
            {query || severityFilter !== "ALL"
              ? "No sessions match your filter."
              : "Your AI symptom checker sessions will appear here."}
          </p>
          <NextLink href="/chatbot">
            <Button className="mt-2 text-xs font-semibold" size="sm" variant="primary">
              <Bot className="mr-1 h-3.5 w-3.5" /> Start Session
            </Button>
          </NextLink>
        </Card>
      ) : (
        <div className="flex flex-col gap-2.5">
          {filtered.map((session) => (
            <NextLink key={session.id} className="group block" href={`/chatbot?session=${session.id}`}>
              <Card className="flex flex-row items-center gap-4 border border-border-custom bg-surface/70 p-4 shadow-xs transition-all hover:border-primary/40 hover:bg-surface">
                <div
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border",
                    session.severityLevel === "CRITICAL"
                      ? "border-red-500/20 bg-red-500/10 text-red-500"
                      : session.severityLevel === "HIGH"
                        ? "border-amber-500/20 bg-amber-500/10 text-amber-500"
                        : "border-primary/20 bg-primary/10 text-primary",
                  )}
                >
                  <MessageSquareText className="h-4 w-4" />
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-semibold text-text-primary">
                    {session.title || session.symptomPrompt}
                  </h3>
                  {session.summary && (
                    <p className="mt-0.5 line-clamp-1 text-xs text-text-secondary">{session.summary}</p>
                  )}
                  <div className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1">
                    {session.severityLevel && (
                      <Chip
                        className="text-[9px] font-mono font-bold uppercase"
                        color={getSeverityColor(session.severityLevel)}
                        size="sm"
                        variant="soft"
                      >
                        {session.severityLevel}
                      </Chip>
                    )}
                    {session.suggestedSpecialty && (
                      <span className="flex items-center gap-1 text-[10px] text-text-secondary">
                        <Stethoscope className="h-3 w-3 text-primary" />
                        {session.suggestedSpecialty}
                      </span>
                    )}
                    <span className="text-[10px] text-text-secondary">{session.messageCount} messages</span>
                    <span className="font-mono text-[10px] text-text-secondary">{formatDate(session.createdAt)}</span>
                  </div>
                </div>

                <ArrowUpRight className="h-4 w-4 shrink-0 text-text-secondary opacity-0 transition-opacity group-hover:opacity-100" />
              </Card>
            </NextLink>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function PatientHealthRecords() {
  const [records, setRecords] = useState<HealthRecords | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"lab-reports" | "appointments" | "medicines" | "ai-sessions">("lab-reports");

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/patient/records");
      const data = await res.json();
      if (res.ok) {
        setRecords(data);
      }
    } catch (err) {
      console.error("Failed to fetch health records:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const summary = records
    ? {
        labReports: records.labReports.length,
        appointments: records.appointments.length,
        activeMedicines: records.medicines.filter(isActiveMedicine).length,
        aiSessions: records.aiSessions.length,
        highRisk: records.aiSessions.filter(
          (s) => s.severityLevel === "HIGH" || s.severityLevel === "CRITICAL",
        ).length,
      }
    : null;

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
            <FolderHeart className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-text-primary">Health Records</h1>
            <p className="text-xs text-text-secondary">
              Your consolidated medical history — lab reports, appointments, medicines, and AI sessions.
            </p>
          </div>
        </div>

        <Button className="text-xs font-semibold" size="sm" variant="secondary" onPress={fetchRecords}>
          <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Refresh
        </Button>
      </div>

      {/* Summary strip */}
      {summary && (
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-1.5 rounded-full border border-border-custom bg-surface/60 px-3 py-1.5 text-xs">
            <FlaskConical className="h-3.5 w-3.5 text-primary" />
            <span className="font-bold text-text-primary">{summary.labReports}</span>
            <span className="text-text-secondary">lab reports</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-full border border-border-custom bg-surface/60 px-3 py-1.5 text-xs">
            <CalendarCheck className="h-3.5 w-3.5 text-primary" />
            <span className="font-bold text-text-primary">{summary.appointments}</span>
            <span className="text-text-secondary">appointments</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-full border border-border-custom bg-surface/60 px-3 py-1.5 text-xs">
            <Pill className="h-3.5 w-3.5 text-emerald-500" />
            <span className="font-bold text-text-primary">{summary.activeMedicines}</span>
            <span className="text-text-secondary">active medicines</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-full border border-border-custom bg-surface/60 px-3 py-1.5 text-xs">
            <MessageSquareText className="h-3.5 w-3.5 text-primary" />
            <span className="font-bold text-text-primary">{summary.aiSessions}</span>
            <span className="text-text-secondary">AI sessions</span>
          </div>
          {summary.highRisk > 0 && (
            <div className="flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs">
              <ShieldAlert className="h-3.5 w-3.5 text-amber-500" />
              <span className="font-bold text-amber-500">{summary.highRisk}</span>
              <span className="text-text-secondary">high-risk alerts</span>
            </div>
          )}
        </div>
      )}

      {/* Tab Bar + Content */}
      {loading ? (
        <div className="flex flex-col gap-3">
          <div className="h-10 w-72 animate-pulse rounded-2xl bg-surface/40" />
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl border border-border-custom bg-surface/40" />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Tab pills */}
          <div className="flex items-center gap-2 overflow-x-auto border-b border-border-custom pb-3">
            <Button
              className={`shrink-0 px-4 text-xs font-semibold ${activeTab === "lab-reports" ? "" : "text-text-secondary"}`}
              size="sm"
              variant={activeTab === "lab-reports" ? "primary" : "secondary"}
              onPress={() => setActiveTab("lab-reports")}
            >
              <FlaskConical className="mr-1.5 h-3.5 w-3.5" />
              Lab Reports
              {records && records.labReports.length > 0 && (
                <Chip className="ml-1.5 text-[9px]" size="sm" variant="soft">
                  {records.labReports.length}
                </Chip>
              )}
            </Button>

            <Button
              className={`shrink-0 px-4 text-xs font-semibold ${activeTab === "appointments" ? "" : "text-text-secondary"}`}
              size="sm"
              variant={activeTab === "appointments" ? "primary" : "secondary"}
              onPress={() => setActiveTab("appointments")}
            >
              <CalendarCheck className="mr-1.5 h-3.5 w-3.5" />
              Appointments
              {records && records.appointments.length > 0 && (
                <Chip className="ml-1.5 text-[9px]" size="sm" variant="soft">
                  {records.appointments.length}
                </Chip>
              )}
            </Button>

            <Button
              className={`shrink-0 px-4 text-xs font-semibold ${activeTab === "medicines" ? "" : "text-text-secondary"}`}
              size="sm"
              variant={activeTab === "medicines" ? "primary" : "secondary"}
              onPress={() => setActiveTab("medicines")}
            >
              <Pill className="mr-1.5 h-3.5 w-3.5" />
              Medicines
              {records && records.medicines.length > 0 && (
                <Chip className="ml-1.5 text-[9px]" size="sm" variant="soft">
                  {records.medicines.length}
                </Chip>
              )}
            </Button>

            <Button
              className={`shrink-0 px-4 text-xs font-semibold ${activeTab === "ai-sessions" ? "" : "text-text-secondary"}`}
              size="sm"
              variant={activeTab === "ai-sessions" ? "primary" : "secondary"}
              onPress={() => setActiveTab("ai-sessions")}
            >
              <Bot className="mr-1.5 h-3.5 w-3.5" />
              AI Sessions
              {records && records.aiSessions.length > 0 && (
                <Chip className="ml-1.5 text-[9px]" size="sm" variant="soft">
                  {records.aiSessions.length}
                </Chip>
              )}
            </Button>
          </div>

          {/* Tab Content */}
          {activeTab === "lab-reports" && <LabReportsTab records={records?.labReports ?? []} />}
          {activeTab === "appointments" && <AppointmentsTab records={records?.appointments ?? []} />}
          {activeTab === "medicines" && <MedicinesTab records={records?.medicines ?? []} />}
          {activeTab === "ai-sessions" && <AISessionsTab records={records?.aiSessions ?? []} />}
        </div>
      )}
    </div>
  );
}
