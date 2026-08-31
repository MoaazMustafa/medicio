"use client";

import { Button, Chip } from "@heroui/react";
import {
  AlertOctagon,
  AlertTriangle,
  Building2,
  CheckCircle2,
  FileQuestion,
  FlaskConical,
  Info,
  Pill,
  ShieldAlert,
  ShieldCheck,
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

function SectionLabel({ children, icon: Icon }: { children: React.ReactNode; icon?: React.ElementType }) {
  return (
    <span className="flex items-center gap-1.5 text-[10px] font-mono font-bold tracking-wider text-text-secondary uppercase">
      {Icon && <Icon className="h-3 w-3 text-primary" />}
      {children}
    </span>
  );
}

interface TriageCardProps {
  triage: TriageResult;
  doctors?: RecommendedDoctor[];
  pharmacies?: RecommendedPharmacy[];
  labs?: RecommendedLab[];
}

export function TriageCard({ triage, doctors = [], pharmacies = [], labs = [] }: TriageCardProps) {
  const isEmergency = triage.severityLevel === "CRITICAL" || triage.isEmergencyAlert;

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-border-custom bg-surface shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-border-custom bg-background-custom/60 px-4 py-3">
        <span className="flex items-center gap-1.5 text-xs font-mono font-bold tracking-wider text-text-primary uppercase">
          <ShieldAlert className="h-4 w-4 text-primary" /> Certified Clinical Triage
        </span>
        <Chip
          className="font-mono text-[10px] font-bold"
          color={getSeverityColor(triage.severityLevel)}
          variant="soft"
        >
          {triage.severityLevel} severity
        </Chip>
      </div>

      <div className="flex flex-col gap-4.5 p-4 sm:p-5">
        {/* Emergency Alert Banner if Critical */}
        {isEmergency && (
          <div className="flex items-start gap-2.5 rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-red-600 dark:text-red-400">
            <AlertOctagon className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
            <div className="min-w-0 text-xs">
              <span className="font-bold">IMMEDIATE EMERGENCY ATTENTION REQUIRED:</span>
              <p className="mt-0.5 leading-relaxed text-[11px]">
                The symptoms described meet certified clinical criteria for urgent emergency care. Do not wait for an online appointment — please call emergency services (911/999/112) or go to the nearest emergency room immediately.
              </p>
            </div>
          </div>
        )}

        {/* Clinical Impression Rationale */}
        {triage.clinicalImpression && (
          <div className="flex flex-col gap-1.5 rounded-xl border border-primary/20 bg-primary/5 p-3">
            <SectionLabel icon={ShieldCheck}>Clinical Assessment Rationale</SectionLabel>
            <p className="text-xs leading-relaxed text-text-primary">
              {triage.clinicalImpression}
            </p>
          </div>
        )}

        {/* Probable conditions with ICD-11 & Guideline citations */}
        {triage.possibleConditions?.length > 0 && (
          <div className="flex flex-col gap-2">
            <SectionLabel icon={ShieldAlert}>Differential Diagnoses (ICD-11 Aligned)</SectionLabel>
            {triage.possibleConditions.map((cond, idx) => (
              <div key={idx} className="rounded-xl border border-border-custom/60 bg-background-custom/40 p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-text-primary">{cond.condition}</span>
                    {cond.icd11Code && (
                      <Chip className="font-mono text-[9px]" size="sm" variant="soft">
                        ICD-11: {cond.icd11Code}
                      </Chip>
                    )}
                  </div>
                  <Chip
                    className="shrink-0 font-mono text-[9px]"
                    color={cond.likelihood === "High" ? "warning" : "default"}
                    size="sm"
                    variant="soft"
                  >
                    {cond.likelihood} Likelihood
                  </Chip>
                </div>
                {cond.description && (
                  <p className="mt-1.5 text-[11px] leading-relaxed text-text-secondary">{cond.description}</p>
                )}
                {cond.sourceGuideline && (
                  <span className="mt-1 block font-mono text-[9px] text-primary/80">
                    Source: {cond.sourceGuideline}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Temporary relief medicines & Contraindication alerts */}
        {triage.temporaryMedicines?.length > 0 && (
          <div className="flex flex-col gap-2">
            <SectionLabel icon={Pill}>Safe First-Line Relief &amp; Contraindication Checks</SectionLabel>
            {triage.temporaryMedicines.map((med, idx) => {
              const isContraindicated = !!med.contraindicationAlert;

              return (
                <div
                  key={idx}
                  className={`rounded-xl border p-3 ${
                    isContraindicated
                      ? "border-amber-500/30 bg-amber-500/10"
                      : "border-border-custom/60 bg-background-custom/40"
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <Pill className={`mt-0.5 h-4 w-4 shrink-0 ${isContraindicated ? "text-amber-500" : "text-primary"}`} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-text-primary">{med.name}</span>
                        {isContraindicated && (
                          <Chip className="font-mono text-[9px]" color="warning" size="sm" variant="soft">
                            Contraindicated
                          </Chip>
                        )}
                      </div>
                      <span className="block text-[11px] text-text-secondary">
                        {med.dosage} — <span className="font-medium text-text-primary">{med.purpose}</span>
                      </span>

                      {med.contraindicationAlert && (
                        <div className="mt-1.5 flex items-start gap-1.5 rounded-lg border border-amber-500/20 bg-amber-500/10 p-2 text-[11px] text-amber-700 dark:text-amber-300">
                          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                          <span>{med.contraindicationAlert}</span>
                        </div>
                      )}

                      {med.warning && !isContraindicated && (
                        <span className="mt-1 block text-[10px] text-text-secondary">
                          Guideline Note: {med.warning}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Actionable Precautions */}
        {triage.precautions?.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <SectionLabel icon={CheckCircle2}>Evidence-Based Precautions &amp; Self-Care</SectionLabel>
            <ul className="flex flex-col gap-1">
              {triage.precautions.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs text-text-primary">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Red Flags To Watch For */}
        {triage.redFlagsToWatch && triage.redFlagsToWatch.length > 0 && (
          <div className="flex flex-col gap-1.5 rounded-xl border border-red-500/20 bg-red-500/5 p-3">
            <span className="flex items-center gap-1.5 text-[10px] font-mono font-bold tracking-wider text-red-600 dark:text-red-400 uppercase">
              <AlertTriangle className="h-3 w-3" /> Red-Flag Warning Signs (Seek Immediate Medical Care)
            </span>
            <ul className="flex flex-col gap-1">
              {triage.redFlagsToWatch.map((flag, idx) => (
                <li key={idx} className="flex items-start gap-1.5 text-[11px] text-text-secondary">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
                  <span>{flag}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Questions for the Doctor */}
        {triage.questionsForDoctor && triage.questionsForDoctor.length > 0 && (
          <div className="flex flex-col gap-1.5 rounded-xl border border-border-custom/60 bg-background-custom/30 p-3">
            <SectionLabel icon={FileQuestion}>Questions to Ask Your Doctor</SectionLabel>
            <ul className="flex flex-col gap-1">
              {triage.questionsForDoctor.map((q, idx) => (
                <li key={idx} className="flex items-start gap-1.5 text-[11px] text-text-primary">
                  <span className="font-mono text-primary">{idx + 1}.</span>
                  <span>{q}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Recommended Specialists */}
        {triage.recommendDoctor && doctors.length > 0 && (
          <div className="flex flex-col gap-2">
            <SectionLabel icon={Stethoscope}>
              Recommended Verified Specialists — {triage.suggestedSpecialty}
            </SectionLabel>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {doctors.slice(0, 4).map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border-custom/60 bg-background-custom/40 p-3"
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
          </div>
        )}

        {/* Nearby Pharmacies & Labs */}
        {(pharmacies.length > 0 || labs.length > 0) && (
          <div className="flex flex-col gap-1.5">
            <SectionLabel icon={Building2}>Nearby Verified Facilities</SectionLabel>
            <div className="flex flex-wrap gap-1.5">
              {pharmacies.map((p) => (
                <Chip key={p.id} className="gap-1 font-mono text-[10px]" size="sm" variant="soft">
                  <Building2 className="h-3 w-3 text-primary" /> {p.name}
                </Chip>
              ))}
              {labs.map((l) => (
                <Chip key={l.id} className="gap-1 font-mono text-[10px]" size="sm" variant="soft">
                  <FlaskConical className="h-3 w-3 text-primary" /> {l.name}
                </Chip>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Disclaimer */}
      <div className="border-t border-border-custom bg-background-custom/40 px-4 py-3">
        <p className="flex items-start gap-1.5 text-[10px] leading-relaxed text-text-secondary">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" /> {triage.disclaimer}
        </p>
      </div>
    </div>
  );
}
