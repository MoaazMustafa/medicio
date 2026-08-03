"use client";

import { Button, Card, Chip, Input } from "@heroui/react";
import {
  ArrowUpRight,
  Bot,
  FileText,
  MessageSquareText,
  RefreshCw,
  Search,
  ShieldAlert,
  Stethoscope,
} from "lucide-react";
import NextLink from "next/link";
import React, { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

export interface TriageRecordItem {
  id: string;
  conversationType: string;
  createdAt: string;
  title: string;
  symptomPrompt: string;
  severityLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  suggestedSpecialty: string;
  summary: string;
  recommendDoctor: boolean;
  messageCount: number;
}

const SEVERITY_FILTERS = ["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"] as const;
const GROUP_LABELS = ["Today", "Yesterday", "Previous 7 days", "Older"] as const;

function getSeverityColor(severity: string): "danger" | "warning" | "accent" | "success" | "default" {
  switch (severity) {
    case "CRITICAL":
      return "danger";
    case "HIGH":
      return "warning";
    case "MEDIUM":
      return "accent";
    case "LOW":
      return "success";
    default:
      return "default";
  }
}

function getSeverityIconClasses(severity: string): string {
  switch (severity) {
    case "CRITICAL":
      return "border-red-500/20 bg-red-500/10 text-red-500";
    case "HIGH":
      return "border-amber-500/20 bg-amber-500/10 text-amber-500";
    case "MEDIUM":
      return "border-primary/20 bg-primary/10 text-primary";
    default:
      return "border-emerald-500/20 bg-emerald-500/10 text-emerald-500";
  }
}

function formatRelativeTime(dateIso: string): string {
  const diffMs = Date.now() - new Date(dateIso).getTime();
  const mins = Math.floor(diffMs / 60000);

  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;

  const hours = Math.floor(mins / 60);

  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);

  if (days < 7) return `${days}d ago`;

  return new Date(dateIso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function getGroupLabel(dateIso: string): (typeof GROUP_LABELS)[number] {
  const date = new Date(dateIso);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday);

  startOfYesterday.setDate(startOfYesterday.getDate() - 1);
  const startOfWeek = new Date(startOfToday);

  startOfWeek.setDate(startOfWeek.getDate() - 7);

  if (date >= startOfToday) return "Today";
  if (date >= startOfYesterday) return "Yesterday";
  if (date >= startOfWeek) return "Previous 7 days";

  return "Older";
}

export function PatientAIRecords() {
  const [records, setRecords] = useState<TriageRecordItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [severityFilter, setSeverityFilter] = useState<string>("ALL");

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/symptom-checker/history");
      const data = await res.json();
      if (res.ok && data.success) {
        setRecords(data.history || []);
      }
    } catch (err) {
      console.error("Failed to fetch triage records: ", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const filteredRecords = records.filter((rec) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      (rec.title || "").toLowerCase().includes(q) ||
      rec.symptomPrompt.toLowerCase().includes(q) ||
      rec.suggestedSpecialty.toLowerCase().includes(q) ||
      rec.summary.toLowerCase().includes(q);

    const matchesSeverity =
      severityFilter === "ALL" || rec.severityLevel.toUpperCase() === severityFilter.toUpperCase();

    return matchesSearch && matchesSeverity;
  });

  const totalReports = records.length;
  const highRiskCount = records.filter((r) => r.severityLevel === "HIGH" || r.severityLevel === "CRITICAL").length;
  const doctorReferralCount = records.filter((r) => r.recommendDoctor).length;

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-text-primary">AI Triage History</h1>
            <p className="text-xs text-text-secondary">
              Past symptom conversations and risk assessments — open any session to continue the chat.
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button className="text-xs font-semibold" size="sm" variant="secondary" onPress={fetchRecords}>
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Refresh
          </Button>
          <NextLink href="/chatbot">
            <Button className="text-xs font-semibold" size="sm" variant="primary">
              <Bot className="mr-1.5 h-3.5 w-3.5" /> New session
            </Button>
          </NextLink>
        </div>
      </div>

      {/* Stats strip */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5 rounded-full border border-border-custom bg-surface/60 px-3 py-1.5 text-xs">
          <MessageSquareText className="h-3.5 w-3.5 text-primary" />
          <span className="font-bold text-text-primary">{totalReports}</span>
          <span className="text-text-secondary">sessions</span>
        </div>
        <div className="flex items-center gap-1.5 rounded-full border border-border-custom bg-surface/60 px-3 py-1.5 text-xs">
          <ShieldAlert className="h-3.5 w-3.5 text-amber-500" />
          <span className="font-bold text-text-primary">{highRiskCount}</span>
          <span className="text-text-secondary">high risk</span>
        </div>
        <div className="flex items-center gap-1.5 rounded-full border border-border-custom bg-surface/60 px-3 py-1.5 text-xs">
          <Stethoscope className="h-3.5 w-3.5 text-emerald-500" />
          <span className="font-bold text-text-primary">{doctorReferralCount}</span>
          <span className="text-text-secondary">doctor referrals</span>
        </div>
      </div>

      {/* Search & severity filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="w-full sm:max-w-sm">
          <Input
            className="w-full text-xs"
            placeholder="Search by title, symptom, or specialty…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
          {SEVERITY_FILTERS.map((sev) => {
            const isActive = severityFilter === sev;

            return (
              <Button
                key={sev}
                className="h-7 shrink-0 px-3 text-[11px] font-semibold"
                size="sm"
                variant={isActive ? "primary" : "secondary"}
                onPress={() => setSeverityFilter(sev)}
              >
                {sev}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Session list */}
      {loading ? (
        <div className="flex flex-col gap-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl border border-border-custom bg-surface/40" />
          ))}
        </div>
      ) : filteredRecords.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-3 border border-border-custom bg-surface/30 p-12 text-center">
          <div className="rounded-2xl border border-border-custom bg-surface/80 p-4 text-text-secondary">
            <Search className="h-8 w-8" />
          </div>
          <h3 className="text-sm font-bold text-text-primary">No triage sessions found</h3>
          <p className="max-w-sm text-xs text-text-secondary">
            {searchQuery || severityFilter !== "ALL"
              ? "No sessions match your search or severity filter."
              : "You have not started any AI symptom conversations yet."}
          </p>
          <NextLink href="/chatbot">
            <Button className="mt-2 text-xs font-semibold" size="sm" variant="primary">
              <Bot className="mr-1 h-3.5 w-3.5" /> Start new triage
            </Button>
          </NextLink>
        </Card>
      ) : (
        <div className="space-y-6">
          {GROUP_LABELS.map((label) => {
            const items = filteredRecords.filter((rec) => getGroupLabel(rec.createdAt) === label);

            if (items.length === 0) return null;

            return (
              <section key={label} className="space-y-2">
                <h2 className="px-1 font-mono text-[11px] font-bold tracking-wider text-text-secondary uppercase">
                  {label}
                </h2>

                <div className="flex flex-col gap-2">
                  {items.map((rec) => (
                    <NextLink key={rec.id} className="group block" href={`/chatbot?session=${rec.id}`}>
                      <Card className="flex flex-row items-center gap-4 border border-border-custom bg-surface/70 p-4 shadow-xs transition-all hover:border-primary/40 hover:bg-surface">
                        <div
                          className={cn(
                            "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border",
                            getSeverityIconClasses(rec.severityLevel),
                          )}
                        >
                          <MessageSquareText className="h-4 w-4" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <h3 className="truncate text-sm font-semibold text-text-primary">
                            {rec.title || rec.symptomPrompt}
                          </h3>
                          <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-text-secondary">
                            {rec.summary}
                          </p>

                          <div className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1">
                            <Chip
                              className="text-[9px] font-mono font-bold uppercase"
                              color={getSeverityColor(rec.severityLevel)}
                              size="sm"
                              variant="soft"
                            >
                              {rec.severityLevel}
                            </Chip>
                            <span className="flex items-center gap-1 text-[10px] text-text-secondary">
                              <Stethoscope className="h-3 w-3 text-primary" /> {rec.suggestedSpecialty}
                            </span>
                            <span className="text-[10px] text-text-secondary">{rec.messageCount} messages</span>
                            <span className="font-mono text-[10px] text-text-secondary">
                              {formatRelativeTime(rec.createdAt)}
                            </span>
                          </div>
                        </div>

                        <ArrowUpRight className="h-4 w-4 shrink-0 text-text-secondary opacity-0 transition-opacity group-hover:opacity-100" />
                      </Card>
                    </NextLink>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
