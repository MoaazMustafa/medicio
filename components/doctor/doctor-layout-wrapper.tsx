"use client";

import React from "react";
import NextLink from "next/link";
import { usePathname } from "next/navigation";
import { Button, Card, Chip } from "@heroui/react";
import {
  ShieldCheck,
  ShieldAlert,
  Stethoscope,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { DoctorProvider, useDoctorContext } from "./doctor-context";

function DoctorLayoutHeader() {
  const pathname = usePathname();
  const { doctorData, toastMessage, showToast, fetchDoctorProfile } = useDoctorContext();

  const isVerified = doctorData?.isVerified ?? false;

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
            ) : (
              <Chip color="warning" variant="soft" className="font-semibold text-xs flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5 inline mr-1" />
                Pending Verification Review
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

      {/* Verification Notice Banner if unverified */}
      {!isVerified && (
        <Card className="p-5 border border-amber-500/40 bg-amber-500/10 backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-amber-400 shrink-0 mt-1" />
            <div>
              <h2 className="text-sm font-bold text-amber-200">
                FR-DOC-02: Credential Verification Pending Admin Review
              </h2>
              <p className="text-xs text-amber-300/80 mt-1">
                Your medical license and education credentials have been submitted and are currently in the review queue.
              </p>
            </div>
          </div>
          <NextLink href="/doctor/profile">
            <Button variant="primary" className="text-xs font-semibold whitespace-nowrap">
              Review Submitted Credentials
            </Button>
          </NextLink>
        </Card>
      )}
    </>
  );
}

export function DoctorLayoutWrapper({ children }: { children: React.ReactNode }) {
  return (
    <DoctorProvider>
      <div className="w-full min-h-[calc(100vh-4rem)] p-4 md:p-8 max-w-[1600px] mx-auto flex flex-col gap-6">
        <DoctorLayoutHeader />
        {children}
      </div>
    </DoctorProvider>
  );
}
