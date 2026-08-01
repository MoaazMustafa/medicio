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
} from "lucide-react";
import { DoctorProvider, useDoctorContext } from "./doctor-context";

function DoctorLayoutHeader() {
  const pathname = usePathname();
  const { doctorData, toastMessage, isProfileSubmitted, isVerified, fetchDoctorProfile, loading } =
    useDoctorContext();

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
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-extrabold text-text-primary flex items-center gap-2">
              <Stethoscope className="w-8 h-8 text-primary" />
              <span>Doctor Control Console</span>
            </h1>
            {isVerified ? (
              <Chip color="success" variant="soft" className="font-semibold text-xs flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 inline mr-1" />
                Verified Practitioner
              </Chip>
            ) : isProfileSubmitted ? (
              <Chip color="warning" variant="soft" className="font-semibold text-xs flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5 inline mr-1" />
                Pending Verification Review
              </Chip>
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

      {/* Notice Banner 1: Compulsory Form Unfilled (Suppressed on submission form page itself) */}
      {!isProfileSubmitted && pathname !== "/doctor/profile" && (
        <Card className="p-5 border border-rose-500/40 bg-rose-500/10 backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-start gap-3">
            <Lock className="w-6 h-6 text-rose-400 shrink-0 mt-1" />
            <div>
              <h2 className="text-sm font-bold text-rose-200">
                Compulsory Step: Submit Credentials Verification Form
              </h2>
              <p className="text-xs text-rose-300/80 mt-1">
                You must complete your medical license, specialty, and education form before dependent portal features (Availability, Appointments, AI Clinical Agent) can be unlocked.
              </p>
            </div>
          </div>
          <NextLink href="/doctor/profile">
            <Button variant="primary" className="text-xs font-semibold whitespace-nowrap bg-rose-600 hover:bg-rose-500 text-white">
              Fill Verification Form Now <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </NextLink>
        </Card>
      )}

      {/* Notice Banner 2: Submitted, awaiting admin review */}
      {isProfileSubmitted && !isVerified && (
        <Card className="p-5 border border-amber-500/40 bg-amber-500/10 backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-amber-400 shrink-0 mt-1" />
            <div>
              <h2 className="text-sm font-bold text-amber-200">
                FR-DOC-02: Credentials Submitted & Pending Administrator Verification
              </h2>
              <p className="text-xs text-amber-300/80 mt-1">
                Your medical license credentials have been received and are currently undergoing admin review. You can review or edit your submission anytime.
              </p>
            </div>
          </div>
          <NextLink href="/doctor/profile">
            <Button variant="secondary" className="text-xs font-semibold whitespace-nowrap">
              Review Submitted Form
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
      <Card className="p-8 border border-border-custom bg-surface/60 backdrop-blur-xl flex flex-col items-center justify-center text-center gap-4 my-8 max-w-2xl mx-auto shadow-md">
        <div className="p-4 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30">
          <Lock className="w-10 h-10" />
        </div>

        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-bold text-text-primary">
            Feature Locked — Compulsory Verification Required
          </h2>
          <p className="text-xs text-text-secondary max-w-md">
            As per Medicio clinical governance guidelines, doctors must complete and submit their Medical License and Qualifications Form before configuring schedule timetables, hospital affiliations, or AI triage agents.
          </p>
        </div>

        <NextLink href="/doctor/profile">
          <Button variant="primary" className="px-6 py-2 font-semibold text-xs flex items-center gap-2">
            <FileCheck className="w-4 h-4" /> Fill Verification Form Now
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
