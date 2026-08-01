"use client";

import React from "react";
import NextLink from "next/link";
import { usePathname } from "next/navigation";
import { Button, Card, Chip, Skeleton } from "@heroui/react";
import {
  ShieldCheck,
  ShieldAlert,
  Stethoscope,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Lock,
  FileCheck,
  ArrowRight,
  XCircle,
} from "lucide-react";
import { DoctorProvider, useDoctorContext } from "./doctor-context";

function DoctorLayoutHeader() {
  const pathname = usePathname();
  const {
    doctorData,
    toastMessage,
    isProfileSubmitted,
    isVerified,
    isRejected,
    rejectionReason,
    fetchDoctorProfile,
    loading,
  } = useDoctorContext();

  if (loading) {
    return (
      <div className="flex flex-col gap-4 border-b border-border-custom pb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="w-8 h-8 rounded-full" />
            <Skeleton className="h-8 w-64 rounded-lg" />
          </div>
          <Skeleton className="h-9 w-36 rounded-lg" />
        </div>
        <Skeleton className="h-4 w-96 rounded" />
      </div>
    );
  }

  return (
    <>
      {/* Toast notification */}
      {toastMessage && (
        <div
          className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-lg shadow-xl border text-sm font-semibold flex items-center gap-2 transition-all ${
            toastMessage.type === "success"
              ? "bg-emerald-950/90 border-emerald-500 text-emerald-200"
              : "bg-rose-950/90 border-rose-500 text-rose-200"
          }`}
        >
          {toastMessage.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-400" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-custom pb-6">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl md:text-3xl font-extrabold text-text-primary flex items-center gap-2">
              <Stethoscope className="w-8 h-8 text-primary" />
              <span>Doctor Control Console</span>
            </h1>
            {isVerified ? (
              <Chip color="success" variant="soft" className="font-semibold text-xs flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 inline mr-1" />
                Verified Practitioner
              </Chip>
            ) : isRejected ? (
              <div className="flex items-center gap-2">
                <Chip color="danger" variant="soft" className="font-semibold text-xs flex items-center gap-1">
                  <XCircle className="w-3.5 h-3.5 inline mr-1" />
                  Application Rejected
                </Chip>
                <Chip color="danger" variant="soft" className="font-semibold text-xs flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 inline mr-1" />
                  Features Locked
                </Chip>
              </div>
            ) : isProfileSubmitted ? (
              <div className="flex items-center gap-2">
                <Chip color="warning" variant="soft" className="font-semibold text-xs flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5 inline mr-1" />
                  Pending Verification Review
                </Chip>
                <Chip color="danger" variant="soft" className="font-semibold text-xs flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 inline mr-1" />
                  Features Locked
                </Chip>
              </div>
            ) : (
              <Chip color="danger" variant="soft" className="font-semibold text-xs flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 inline mr-1" />
                Compulsory Verification Required
              </Chip>
            )}
          </div>
          <p className="text-xs text-text-secondary mt-1">
            Professional clinical portal for credential verification, schedule timetable, hospital affiliations, AI training & patient appointments.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" className="text-xs font-semibold" onPress={fetchDoctorProfile}>
            <RefreshCw className="w-4 h-4 mr-1" />
            Refresh Portal Data
          </Button>
        </div>
      </div>

      {/* Notice Banner 0: Application Rejected Banner */}
      {isRejected && pathname !== "/doctor/profile" && (
        <Card className="p-6 border border-rose-500/50 bg-gradient-to-r from-rose-950/60 via-surface/90 to-rose-950/40 backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-5 shadow-lg rounded-2xl">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-400 shrink-0">
              <XCircle className="w-6 h-6" />
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-text-primary tracking-tight">
                  Application Rejected — License Resubmission Required
                </h2>
                <Chip variant="soft" color="danger" className="text-[10px] uppercase font-mono font-semibold">
                  Action Required
                </Chip>
              </div>
              <p className="text-xs text-text-secondary leading-relaxed max-w-3xl">
                Your medical license credentials application was reviewed and rejected by a platform administrator.
              </p>
              <div className="p-2.5 rounded-xl bg-rose-950/50 border border-rose-500/30 text-xs text-rose-200 font-mono flex items-start gap-2 mt-1">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-rose-300 font-sans">Rejection Reason:</strong>{" "}
                  {rejectionReason || "Credentials audit failed. Please review your license number, specialty, and education."}
                </span>
              </div>
            </div>
          </div>
          <NextLink href="/doctor/profile" className="shrink-0">
            <Button variant="primary" className="px-6 py-2.5 font-semibold text-xs whitespace-nowrap bg-rose-600 hover:bg-rose-500 text-white rounded-xl shadow-md flex items-center gap-2">
              Update & Resubmit Application <ArrowRight className="w-4 h-4" />
            </Button>
          </NextLink>
        </Card>
      )}

      {/* Notice Banner 1: Compulsory Form Unfilled (Suppressed on submission form page itself) */}
      {!isProfileSubmitted && !isRejected && pathname !== "/doctor/profile" && (
        <Card className="p-6 border border-rose-500/30 bg-gradient-to-r from-rose-950/40 via-surface/80 to-rose-950/20 backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-5 shadow-lg rounded-2xl">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 shrink-0">
              <Lock className="w-6 h-6" />
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-text-primary tracking-tight">
                  Compulsory Action Required: Submit Credentials Verification Form
                </h2>
                <Chip variant="soft" color="danger" className="text-[10px] uppercase font-mono font-semibold">
                  Required
                </Chip>
              </div>
              <p className="text-xs text-text-secondary leading-relaxed max-w-3xl">
                As per clinical platform compliance guidelines, practitioners must complete and submit their Medical License, Specialty, and Education credentials before dependent features (Timetable Availability, Patient Appointments, AI Clinical Agent) can be unlocked.
              </p>
            </div>
          </div>
          <NextLink href="/doctor/profile" className="shrink-0">
            <Button variant="primary" className="px-6 py-2.5 font-semibold text-xs whitespace-nowrap bg-rose-600 hover:bg-rose-500 text-white rounded-xl shadow-md flex items-center gap-2">
              Fill Verification Form Now <ArrowRight className="w-4 h-4" />
            </Button>
          </NextLink>
        </Card>
      )}

      {/* Notice Banner 2: Submitted, awaiting admin review */}
      {isProfileSubmitted && !isVerified && !isRejected && (
        <Card className="p-6 border border-amber-500/30 bg-gradient-to-r from-amber-950/40 via-surface/80 to-amber-950/20 backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-5 shadow-lg rounded-2xl">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 shrink-0">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-text-primary tracking-tight">
                  Credentials Submitted — Administrator Verification Pending
                </h2>
                <Chip variant="soft" color="warning" className="text-[10px] uppercase font-mono font-semibold">
                  Under Review
                </Chip>
              </div>
              <p className="text-xs text-text-secondary leading-relaxed max-w-3xl">
                Your medical license application has been received and is currently undergoing administrative review. You may review or update your submitted details anytime.
              </p>
            </div>
          </div>
          <NextLink href="/doctor/profile" className="shrink-0">
            <Button variant="secondary" className="px-5 py-2.5 font-semibold text-xs whitespace-nowrap rounded-xl">
              Review Submitted Details
            </Button>
          </NextLink>
        </Card>
      )}
    </>
  );
}

function DoctorLayoutBody({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isProfileSubmitted, canAccessDependentTabs, loading } = useDoctorContext();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
        </div>
        <Skeleton className="h-64 rounded-2xl w-full" />
      </div>
    );
  }

  // Allow access to overview (/doctor/dashboard) and credentials form (/doctor/profile)
  const isFormRoute = pathname === "/doctor/profile" || pathname === "/doctor/dashboard";

  if (!canAccessDependentTabs && !isFormRoute) {
    return (
      <Card className="p-8 border border-border-custom bg-surface/60 backdrop-blur-xl flex flex-col items-center justify-center text-center gap-4 my-8 max-w-2xl mx-auto shadow-md rounded-2xl">
        <div className={`p-4 rounded-full border ${isProfileSubmitted ? "bg-amber-500/15 text-amber-400 border-amber-500/30" : "bg-rose-500/15 text-rose-400 border-rose-500/30"}`}>
          <Lock className="w-10 h-10" />
        </div>

        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-bold text-text-primary">
            {isProfileSubmitted
              ? "Feature Locked — Pending Administrator Verification"
              : "Feature Locked — Compulsory Verification Required"}
          </h2>
          <p className="text-xs text-text-secondary max-w-md leading-relaxed">
            {isProfileSubmitted
              ? "Your medical license credentials have been submitted and are undergoing admin review. Features (Timetable, Appointments, AI Clinical Agent) will unlock automatically once an administrator approves your verification."
              : "As per Medicio clinical governance guidelines, doctors must complete and submit their Medical License and Qualifications Form before configuring schedule timetables, hospital affiliations, or AI triage agents."}
          </p>
        </div>

        <NextLink href="/doctor/profile">
          <Button variant={isProfileSubmitted ? "secondary" : "primary"} className="px-6 py-2.5 font-semibold text-xs flex items-center gap-2 rounded-xl">
            <FileCheck className="w-4 h-4" /> {isProfileSubmitted ? "Review Submitted Form" : "Fill Verification Form Now"}
          </Button>
        </NextLink>
      </Card>
    );
  }

  return <>{children}</>;
}

export function DoctorLayoutWrapper({ children }: { children: React.ReactNode }) {
  return (
    <DoctorProvider>
      <div className="w-full min-h-[calc(100vh-4rem)] p-4 md:p-8 max-w-[1600px] mx-auto flex flex-col gap-6">
        <DoctorLayoutHeader />
        <DoctorLayoutBody>{children}</DoctorLayoutBody>
      </div>
    </DoctorProvider>
  );
}
