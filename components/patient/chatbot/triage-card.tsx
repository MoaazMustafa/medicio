"use client";


import { Button, Chip } from "@heroui/react";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  FlaskConical,
  Info,
  Pill,
  ShieldAlert,
  Stethoscope,
} from "lucide-react";
import NextLink from "next/link";

import type {
  RecommendedDoctor,
  RecommendedLab,
  RecommendedPharmacy,
  TriageResult,
} from "@/components/patient/patient-context";

export function getSeverityColor(severity?: string): "danger" | "warning" | "accent" | "success" | "default" {
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

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[10px] font-mono font-bold tracking-wider text-text-secondary uppercase">{children}</span>
  );
}

interface TriageCardProps {
  triage: TriageResult;
  doctors?: RecommendedDoctor[];
  pharmacies?: RecommendedPharmacy[];
  labs?: RecommendedLab[];
}

export function TriageCard({ triage, doctors = [], pharmacies = [], labs = [] }: TriageCardProps) {
  return (
    <div className="w-full overflow-hidden rounded-2xl border border-border-custom bg-surface shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-border-custom bg-background-custom/40 px-4 py-2.5">
        <span className="flex items-center gap-1.5 text-[11px] font-mono font-bold tracking-wider text-text-secondary uppercase">
          <ShieldAlert className="h-3.5 w-3.5 text-primary" /> Clinical triage
        </span>
        <Chip className="text-[10px] font-mono font-bold" color={getSeverityColor(triage.severityLevel)} variant="soft">
          {triage.severityLevel} severity
        </Chip>
      </div>

      <div className="flex flex-col gap-4 p-4">
        {/* Probable conditions */}
        {triage.possibleConditions?.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <SectionLabel>Probable conditions</SectionLabel>
            {triage.possibleConditions.map((cond, idx) => (
              <div key={idx} className="rounded-xl border border-border-custom/60 bg-background-custom/30 p-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-text-primary">{cond.condition}</span>
                  <Chip
                    className="shrink-0 text-[9px] font-mono"
                    color={cond.likelihood === "High" ? "warning" : "default"}
                    size="sm"
                    variant="soft"
                  >
                    {cond.likelihood}
                  </Chip>
                </div>
                {cond.description && <p className="mt-1 text-[11px] leading-relaxed text-text-secondary">{cond.description}</p>}
              </div>
            ))}
          </div>
        )}

        {/* Temporary relief medicines */}
        {triage.temporaryMedicines?.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <SectionLabel>Temporary relief</SectionLabel>
            {triage.temporaryMedicines.map((med, idx) => (
              <div key={idx} className="rounded-xl border border-border-custom/60 bg-background-custom/30 p-2.5">
                <div className="flex items-start gap-2">
                  <Pill className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                  <div className="min-w-0">
                    <span className="block text-xs font-semibold text-text-primary">{med.name}</span>
                    <span className="block text-[11px] text-text-secondary">
                      {med.dosage} — {med.purpose}
                    </span>
                    {med.warning && (
                      <span className="mt-1 flex items-start gap-1 text-[11px] text-amber-600 dark:text-amber-400">
                        <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" /> {med.warning}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Precautions */}
        {triage.precautions?.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <SectionLabel>Precautions</SectionLabel>
            <ul className="flex flex-col gap-1">
              {triage.precautions.map((item, idx) => (
                <li key={idx} className="flex items-start gap-1.5 text-xs text-text-primary">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" /> {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Recommended specialists */}
        {triage.recommendDoctor && doctors.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <SectionLabel>Recommended specialists — {triage.suggestedSpecialty}</SectionLabel>
            {doctors.slice(0, 3).map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-border-custom/60 bg-background-custom/30 p-2.5"
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
                    <Stethoscope className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="block truncate text-xs font-semibold text-text-primary">{doc.name}</span>
                    <span className="block truncate text-[11px] text-text-secondary">
                      {doc.specialty} • {doc.clinicAddress}
                    </span>
                  </div>
                </div>
                <NextLink className="shrink-0" href="/appointments">
                  <Button className="h-7 rounded-full px-3 text-[11px] font-semibold" size="sm" variant="primary">
                    Book slot
                  </Button>
                </NextLink>
              </div>
            ))}
          </div>
        )}

        {/* Nearby pharmacies & labs */}
        {(pharmacies.length > 0 || labs.length > 0) && (
          <div className="flex flex-col gap-1.5">
            <SectionLabel>Nearby pharmacies &amp; labs</SectionLabel>
            <div className="flex flex-wrap gap-1.5">
              {pharmacies.map((p) => (
                <Chip key={p.id} className="gap-1 text-[10px]" size="sm" variant="soft">
                  <Building2 className="h-3 w-3 text-primary" /> {p.name}
                </Chip>
              ))}
              {labs.map((l) => (
                <Chip key={l.id} className="gap-1 text-[10px]" size="sm" variant="soft">
                  <FlaskConical className="h-3 w-3 text-primary" /> {l.name}
                </Chip>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Disclaimer */}
      <div className="border-t border-border-custom bg-background-custom/30 px-4 py-2.5">
        <p className="flex items-start gap-1.5 text-[10px] leading-relaxed text-text-secondary">
          <Info className="mt-0.5 h-3 w-3 shrink-0" /> {triage.disclaimer}
        </p>
      </div>
    </div>
  );
}
