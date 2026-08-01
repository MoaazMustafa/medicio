"use client";

import React from "react";
import NextLink from "next/link";
import { Button, Card, Chip } from "@heroui/react";
import {
  ShieldCheck,
  Clock,
  Bot,
  UserCheck,
  CalendarCheck,
  Building2,
  Sparkles,
  ArrowRight,
  Stethoscope,
  Lock,
  FileCheck,
} from "lucide-react";
import { useDoctorContext } from "./doctor-context";

export function DoctorOverview() {
  const { doctorData, appointments, isProfileSubmitted, isVerified } = useDoctorContext();

  return (
    <div className="flex flex-col gap-6">
      {/* Compulsory Verification Callout Banner if Form Unfilled */}
      {!isProfileSubmitted && (
        <Card className="p-6 border border-rose-500/50 bg-rose-950/20 backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-md">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 shrink-0">
              <Lock className="w-6 h-6" />
            </div>
            <div className="flex flex-col gap-1">
              <h2 className="text-base font-bold text-rose-200 flex items-center gap-2">
                Compulsory Step: Submit Credentials & Medical License Form
              </h2>
              <p className="text-xs text-rose-300/80 max-w-2xl">
                As per clinical platform regulations, all practitioners must submit their medical license number, specialty, and education qualifications before feature access (Schedule, Appointments, AI Agent) is enabled.
              </p>
            </div>
          </div>
          <NextLink href="/doctor/profile" className="shrink-0">
            <Button variant="primary" className="px-6 font-semibold text-xs bg-rose-600 hover:bg-rose-500 text-white flex items-center gap-2">
              <FileCheck className="w-4 h-4" /> Fill Verification Form Now
            </Button>
          </NextLink>
        </Card>
      )}

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border border-border-custom bg-surface/50 flex flex-col gap-2 shadow-xs">
          <span className="text-xs text-text-secondary uppercase font-mono font-semibold">Credential Status</span>
          <div className="flex items-center gap-2 mt-1">
            {isVerified ? (
              <span className="text-lg font-bold text-emerald-400 flex items-center gap-1">
                <ShieldCheck className="w-5 h-5" /> Verified Active
              </span>
            ) : isProfileSubmitted ? (
              <span className="text-lg font-bold text-amber-400 flex items-center gap-1">
                <Clock className="w-5 h-5" /> In Review Queue
              </span>
            ) : (
              <span className="text-lg font-bold text-rose-400 flex items-center gap-1">
                <Lock className="w-5 h-5" /> Unsubmitted
              </span>
            )}
          </div>
          <span className="text-[11px] text-text-secondary">FR-DOC-01 / FR-DOC-02 Licensing</span>
        </Card>

        <Card className="p-4 border border-border-custom bg-surface/50 flex flex-col gap-2 shadow-xs">
          <span className="text-xs text-text-secondary uppercase font-mono font-semibold">Appointments</span>
          <span className="text-2xl font-bold text-text-primary mt-1">{appointments.length} Scheduled</span>
          <span className="text-[11px] text-text-secondary">FR-DOC-09 Booking Queue</span>
        </Card>

        <Card className="p-4 border border-border-custom bg-surface/50 flex flex-col gap-2 shadow-xs">
          <span className="text-xs text-text-secondary uppercase font-mono font-semibold">Hospital Affiliation</span>
          <span className="text-base font-bold text-text-primary mt-1 truncate">
            {doctorData?.hospital?.name || "Standalone / Independent Clinic"}
          </span>
          <span className="text-[11px] text-text-secondary">FR-DOC-04 / FR-DOC-05 Bidirectional</span>
        </Card>

        <Card className="p-4 border border-border-custom bg-surface/50 flex flex-col gap-2 shadow-xs">
          <span className="text-xs text-text-secondary uppercase font-mono font-semibold">Specialty AI Bot</span>
          <span className="text-base font-bold text-primary mt-1 flex items-center gap-1">
            <Bot className="w-4 h-4" />
            {doctorData?.aiTrainingData ? "Trained & Active" : "Untrained"}
          </span>
          <span className="text-[11px] text-text-secondary">FR-DOC-08 Emergency Question Set</span>
        </Card>
      </div>

      {/* Profile & Clinic Summary */}
      <Card className="p-6 border border-border-custom bg-surface/40 flex flex-col gap-4 shadow-sm">
        <h2 className="text-base font-bold text-text-primary flex items-center justify-between border-b border-border-custom pb-3">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-primary" />
            <span>Practitioner Profile Summary</span>
          </div>
          <NextLink href="/doctor/profile">
            <Button variant="ghost" size="sm" className="text-xs font-semibold text-primary">
              {isProfileSubmitted ? "Edit Credentials" : "Fill Verification Form"} <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </NextLink>
        </h2>

        {doctorData ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-background-custom/50 border border-border-custom/60 flex flex-col gap-2">
              <span className="font-bold text-text-primary text-sm">Dr. {doctorData.user?.name}</span>
              <span className="text-text-secondary">Email: {doctorData.user?.email}</span>
              <span className="text-text-secondary">Specialty: {doctorData.specialty || "Not set (Compulsory)"}</span>
              <span className="text-text-secondary">Education: {doctorData.education || "Not set (Compulsory)"}</span>
              <span className="text-text-secondary">Experience: {doctorData.experience || 0} Years</span>
              <span className="text-text-secondary font-mono">License: {doctorData.licenseNumber || "Not set (Compulsory)"}</span>
            </div>

            <div className="p-4 rounded-xl bg-background-custom/50 border border-border-custom/60 flex flex-col gap-2">
              <span className="font-bold text-text-primary">Clinic Address & Practice:</span>
              <span className="text-text-secondary">{doctorData.clinicAddress || "Primary Practice Address Not Set"}</span>
              <span className="font-bold text-text-primary mt-2">Consultation Fee:</span>
              <span className="text-text-secondary font-mono">${doctorData.consultationFee || 50} / Session</span>
              <span className="font-bold text-text-primary mt-2">Affiliation Status:</span>
              <Chip variant="soft" color="accent" className="w-fit text-[10px]">
                {doctorData.affiliationStatus || "INDEPENDENT"}
              </Chip>
            </div>
          </div>
        ) : (
          <p className="text-xs text-text-secondary">No practitioner profile submitted yet. Use the Practice & Profile tab to register.</p>
        )}
      </Card>

      {/* Quick Action Navigation Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <NextLink href={isProfileSubmitted ? "/doctor/availability" : "/doctor/profile"}>
          <Card className={`p-5 border ${isProfileSubmitted ? "border-border-custom bg-surface/50 hover:border-primary/50" : "border-rose-500/30 bg-surface/30 opacity-75"} transition-all cursor-pointer flex flex-col gap-2`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                <h3 className="text-sm font-bold text-text-primary">Schedule & Timetable</h3>
              </div>
              {!isProfileSubmitted && <Lock className="w-4 h-4 text-rose-400" />}
            </div>
            <p className="text-xs text-text-secondary">
              {isProfileSubmitted ? "Manage working hours, available days, and appointment slot duration." : "Locked — Submit verification form first."}
            </p>
          </Card>
        </NextLink>

        <NextLink href={isProfileSubmitted ? "/doctor/agent" : "/doctor/profile"}>
          <Card className={`p-5 border ${isProfileSubmitted ? "border-border-custom bg-surface/50 hover:border-primary/50" : "border-rose-500/30 bg-surface/30 opacity-75"} transition-all cursor-pointer flex flex-col gap-2`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-primary" />
                <h3 className="text-sm font-bold text-text-primary">AI Clinical Agent</h3>
              </div>
              {!isProfileSubmitted && <Lock className="w-4 h-4 text-rose-400" />}
            </div>
            <p className="text-xs text-text-secondary">
              {isProfileSubmitted ? "Configure emergency red flags, intake protocols, and test in simulator." : "Locked — Submit verification form first."}
            </p>
          </Card>
        </NextLink>

        <NextLink href={isProfileSubmitted ? "/doctor/appointments" : "/doctor/profile"}>
          <Card className={`p-5 border ${isProfileSubmitted ? "border-border-custom bg-surface/50 hover:border-primary/50" : "border-rose-500/30 bg-surface/30 opacity-75"} transition-all cursor-pointer flex flex-col gap-2`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarCheck className="w-5 h-5 text-primary" />
                <h3 className="text-sm font-bold text-text-primary">Patient Appointments</h3>
              </div>
              {!isProfileSubmitted && <Lock className="w-4 h-4 text-rose-400" />}
            </div>
            <p className="text-xs text-text-secondary">
              {isProfileSubmitted ? "Review patient bookings, accept slots, and mark visits complete." : "Locked — Submit verification form first."}
            </p>
          </Card>
        </NextLink>
      </div>
    </div>
  );
}
