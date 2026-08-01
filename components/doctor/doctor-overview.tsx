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
  TrendingUp,
  Activity,
  ShieldAlert,
} from "lucide-react";
import { useDoctorContext } from "./doctor-context";

/**
 * Custom SVG Sparkline Mini Graph matching Admin Dashboard telemetry curves
 */
function Sparkline({
  data,
  color = "blue",
}: {
  data: number[];
  color?: "blue" | "emerald" | "amber" | "rose";
}) {
  if (!data || data.length === 0) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const width = 120;
  const height = 40;

  const points = data.map((val, idx) => {
    const x = (idx / (data.length - 1)) * width;
    const y = height - ((val - min) / range) * (height - 10) - 5;
    return { x, y };
  });

  let dPath = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const curr = points[i];
    const next = points[i + 1];
    const cpX = (curr.x + next.x) / 2;
    dPath += ` C ${cpX} ${curr.y}, ${cpX} ${next.y}, ${next.x} ${next.y}`;
  }

  const areaPath = `${dPath} L ${width} ${height} L 0 ${height} Z`;

  const colorMap = {
    blue: { stroke: "#3b82f6", stop: "#3b82f6" },
    emerald: { stroke: "#10b981", stop: "#10b981" },
    amber: { stroke: "#f59e0b", stop: "#f59e0b" },
    rose: { stroke: "#f43f5e", stop: "#f43f5e" },
  };

  const selectedColor = colorMap[color] || colorMap.blue;
  const gradientId = `doc-sparkline-${color}-${Math.random().toString(36).slice(2, 7)}`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-24 h-10 overflow-visible shrink-0">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={selectedColor.stop} stopOpacity="0.3" />
          <stop offset="100%" stopColor={selectedColor.stop} stopOpacity="0.0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradientId})`} />
      <path
        d={dPath}
        fill="none"
        stroke={selectedColor.stroke}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function DoctorOverview() {
  const { doctorData, appointments, isProfileSubmitted, isVerified, isRejected, canAccessDependentTabs } =
    useDoctorContext();

  return (
    <div className="flex flex-col gap-6">
      {/* Telemetry Stat Cards Grid (Admin Dashboard Style) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Credential Status */}
        <Card className="p-4 border border-border-custom bg-surface/50 backdrop-blur-md flex flex-col justify-between gap-3 shadow-sm hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-text-secondary uppercase font-mono font-bold tracking-wider">
              Credential Status
            </span>
            <Chip
              variant="soft"
              color={isVerified ? "success" : isRejected ? "danger" : isProfileSubmitted ? "warning" : "danger"}
              className="text-[9px] font-mono px-1.5 py-0 font-bold uppercase"
            >
              {isVerified ? "Verified" : isRejected ? "Rejected" : isProfileSubmitted ? "Pending Review" : "Locked"}
            </Chip>
          </div>

          <div className="flex items-end justify-between gap-2">
            <div className="flex flex-col">
              <span className="text-xl font-extrabold text-text-primary tracking-tight">
                {isVerified
                  ? "Verified Practitioner"
                  : isRejected
                  ? "Application Rejected"
                  : isProfileSubmitted
                  ? "In Review Queue"
                  : "Unsubmitted"}
              </span>
              <span className="text-[10px] text-text-secondary font-mono mt-0.5">FR-DOC-01 / FR-DOC-02 Compliance</span>
            </div>
            <Sparkline
              data={isVerified ? [10, 25, 45, 70, 95, 100] : isProfileSubmitted ? [5, 15, 30, 40, 50] : [0, 0, 0]}
              color={isVerified ? "emerald" : isRejected ? "rose" : isProfileSubmitted ? "amber" : "rose"}
            />
          </div>
        </Card>

        {/* Card 2: Appointments Queue */}
        <Card className="p-4 border border-border-custom bg-surface/50 backdrop-blur-md flex flex-col justify-between gap-3 shadow-sm hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-text-secondary uppercase font-mono font-bold tracking-wider">
              Appointments
            </span>
            <Chip variant="soft" color="accent" className="text-[9px] font-mono px-1.5 py-0 font-bold uppercase">
              Live Queue
            </Chip>
          </div>

          <div className="flex items-end justify-between gap-2">
            <div className="flex flex-col">
              <span className="text-2xl font-extrabold text-text-primary tracking-tight">
                {appointments.length} <span className="text-xs font-normal text-text-secondary">Scheduled</span>
              </span>
              <span className="text-[10px] text-text-secondary font-mono mt-0.5">FR-DOC-09 Booking Engine</span>
            </div>
            <Sparkline data={[2, 4, 3, 7, 6, appointments.length || 8]} color="emerald" />
          </div>
        </Card>

        {/* Card 3: Hospital Affiliation */}
        <Card className="p-4 border border-border-custom bg-surface/50 backdrop-blur-md flex flex-col justify-between gap-3 shadow-sm hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-text-secondary uppercase font-mono font-bold tracking-wider">
              Hospital Affiliation
            </span>
            <Chip variant="soft" color="accent" className="text-[9px] font-mono px-1.5 py-0 font-bold uppercase">
              Network
            </Chip>
          </div>

          <div className="flex items-end justify-between gap-2">
            <div className="flex flex-col">
              <span className="text-sm font-extrabold text-text-primary tracking-tight truncate max-w-[140px]">
                {doctorData?.hospital?.name || "Standalone Clinic"}
              </span>
              <span className="text-[10px] text-text-secondary font-mono mt-0.5">FR-DOC-04 / FR-DOC-05 Protocol</span>
            </div>
            <Sparkline data={[5, 10, 15, 20, 25, 30]} color="blue" />
          </div>
        </Card>

        {/* Card 4: Specialty AI Bot */}
        <Card className="p-4 border border-border-custom bg-surface/50 backdrop-blur-md flex flex-col justify-between gap-3 shadow-sm hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-text-secondary uppercase font-mono font-bold tracking-wider">
              Specialty AI Agent
            </span>
            <Chip
              variant="soft"
              color={doctorData?.aiTrainingData ? "success" : "warning"}
              className="text-[9px] font-mono px-1.5 py-0 font-bold uppercase"
            >
              {doctorData?.aiTrainingData ? "Active" : "Untrained"}
            </Chip>
          </div>

          <div className="flex items-end justify-between gap-2">
            <div className="flex flex-col">
              <span className="text-sm font-extrabold text-primary tracking-tight flex items-center gap-1">
                <Bot className="w-4 h-4" />
                {doctorData?.aiTrainingData ? "Trained Protocol" : "Standby Mode"}
              </span>
              <span className="text-[10px] text-text-secondary font-mono mt-0.5">FR-DOC-08 Emergency Rules</span>
            </div>
            <Sparkline data={[0, 10, 30, 60, 80, doctorData?.aiTrainingData ? 100 : 20]} color="blue" />
          </div>
        </Card>
      </div>

      {/* Practitioner Clinical Profile Summary Card */}
      <Card className="p-6 border border-border-custom bg-surface/40 backdrop-blur-md flex flex-col gap-5 shadow-md">
        <div className="flex items-center justify-between border-b border-border-custom pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10 border border-primary/30 text-primary">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-text-primary tracking-tight">Practitioner Profile Summary</h2>
              <p className="text-xs text-text-secondary mt-0.5">
                Core clinical credentials, practice location, and licensing information registered in Medicio PostgreSQL database.
              </p>
            </div>
          </div>

          <NextLink href="/doctor/profile">
            <Button variant="outline" size="sm" className="text-xs font-semibold px-4 text-primary border-primary/30 hover:bg-primary/10">
              {isProfileSubmitted ? "Edit Credentials" : "Fill Verification Form"} <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </NextLink>
        </div>

        {doctorData ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-background-custom/40 border border-border-custom/80 flex flex-col gap-2.5">
              <div className="flex items-center justify-between border-b border-border-custom/50 pb-2">
                <span className="font-bold text-text-primary text-sm">Dr. {doctorData.user?.name}</span>
                <Chip variant="soft" color={isVerified ? "success" : "warning"} className="text-[10px] font-mono">
                  {isVerified ? "Verified" : "Pending Review"}
                </Chip>
              </div>
              <span className="text-text-secondary">
                <strong className="text-text-primary">Email:</strong> {doctorData.user?.email}
              </span>
              <span className="text-text-secondary">
                <strong className="text-text-primary">Medical Specialty:</strong> {doctorData.specialty || "Not set (Compulsory)"}
              </span>
              <span className="text-text-secondary">
                <strong className="text-text-primary">Education:</strong> {doctorData.education || "Not set (Compulsory)"}
              </span>
              <span className="text-text-secondary">
                <strong className="text-text-primary">Experience:</strong> {doctorData.experience || 0} Years Active Practice
              </span>
              <span className="text-text-secondary font-mono">
                <strong className="text-text-primary font-sans">License Number:</strong> {doctorData.licenseNumber || "Not set (Compulsory)"}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-background-custom/40 border border-border-custom/80 flex flex-col gap-2.5">
              <span className="font-bold text-text-primary text-sm border-b border-border-custom/50 pb-2">Practice & Consultation Details</span>
              <span className="text-text-secondary">
                <strong className="text-text-primary">Clinic Address:</strong> {doctorData.clinicAddress || "Primary Practice Address Not Set"}
              </span>
              <span className="text-text-secondary font-mono">
                <strong className="text-text-primary font-sans">Consultation Fee:</strong> ${doctorData.consultationFee || 50} / Session
              </span>
              <div className="flex items-center gap-2 mt-1">
                <strong className="text-text-primary">Affiliation Status:</strong>
                <Chip variant="soft" color="accent" className="text-[10px] font-mono">
                  {doctorData.affiliationStatus || "INDEPENDENT"}
                </Chip>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6 rounded-xl border border-dashed border-border-custom text-center text-text-secondary text-xs flex flex-col items-center gap-2">
            <ShieldAlert className="w-8 h-8 text-amber-400/60" />
            <span className="font-bold text-text-primary text-sm">No Medical Application Submitted Yet</span>
            <span className="max-w-md">Complete your Medical Credentials and License Form to register your profile and request administrator verification.</span>
            <NextLink href="/doctor/profile" className="mt-2">
              <Button variant="primary" className="text-xs font-semibold px-5">
                Fill Verification Form Now <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </NextLink>
          </div>
        )}
      </Card>

      {/* Feature Action Grid — Lock Overlay for Unverified Doctors */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            <span>Clinical Workspace Modules</span>
          </h3>
          {!canAccessDependentTabs && (
            <Chip color="danger" variant="soft" className="text-[10px] font-mono font-bold uppercase">
              Locked — Verification Required
            </Chip>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Module 1: Schedule & Timetable */}
          <NextLink href={canAccessDependentTabs ? "/doctor/availability" : "/doctor/profile"}>
            <Card
              className={`p-6 border flex flex-col justify-between gap-4 transition-all h-full relative overflow-hidden group ${
                canAccessDependentTabs
                  ? "border-border-custom bg-surface/50 hover:border-primary/50 hover:shadow-lg"
                  : "border-rose-500/30 bg-surface/30 opacity-80"
              }`}
            >
              {!canAccessDependentTabs && (
                <div className="absolute inset-0 bg-background-custom/60 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center p-4 text-center gap-2 transition-all group-hover:bg-background-custom/40">
                  <div className="p-3 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-400 shadow-md">
                    <Lock className="w-5 h-5" />
                  </div>
                  <span className="font-bold text-xs text-rose-200">Module Locked</span>
                  <span className="text-[10px] text-text-secondary max-w-[180px]">Fill verification form to unlock schedule timetable</span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-text-primary">Schedule & Timetable</h4>
                    <span className="text-[10px] text-text-secondary font-mono">FR-DOC-03 Engine</span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-text-secondary leading-relaxed">
                Configure working hours, weekly recurring slots, consultation duration, and blackout days.
              </p>

              <div className="flex items-center gap-1 text-xs font-semibold text-primary pt-2 border-t border-border-custom/40">
                <span>Configure Timetable</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Card>
          </NextLink>

          {/* Module 2: AI Clinical Agent */}
          <NextLink href={canAccessDependentTabs ? "/doctor/agent" : "/doctor/profile"}>
            <Card
              className={`p-6 border flex flex-col justify-between gap-4 transition-all h-full relative overflow-hidden group ${
                canAccessDependentTabs
                  ? "border-border-custom bg-surface/50 hover:border-primary/50 hover:shadow-lg"
                  : "border-rose-500/30 bg-surface/30 opacity-80"
              }`}
            >
              {!canAccessDependentTabs && (
                <div className="absolute inset-0 bg-background-custom/60 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center p-4 text-center gap-2 transition-all group-hover:bg-background-custom/40">
                  <div className="p-3 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-400 shadow-md">
                    <Lock className="w-5 h-5" />
                  </div>
                  <span className="font-bold text-xs text-rose-200">Module Locked</span>
                  <span className="text-[10px] text-text-secondary max-w-[180px]">Fill verification form to unlock AI clinical agent</span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-text-primary">AI Clinical Agent</h4>
                    <span className="text-[10px] text-text-secondary font-mono">FR-DOC-08 Simulator</span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-text-secondary leading-relaxed">
                Define emergency intake protocols, custom Q&A rules, and test responses in the playground.
              </p>

              <div className="flex items-center gap-1 text-xs font-semibold text-primary pt-2 border-t border-border-custom/40">
                <span>Manage AI Guardrails</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Card>
          </NextLink>

          {/* Module 3: Patient Appointments */}
          <NextLink href={canAccessDependentTabs ? "/doctor/appointments" : "/doctor/profile"}>
            <Card
              className={`p-6 border flex flex-col justify-between gap-4 transition-all h-full relative overflow-hidden group ${
                canAccessDependentTabs
                  ? "border-border-custom bg-surface/50 hover:border-primary/50 hover:shadow-lg"
                  : "border-rose-500/30 bg-surface/30 opacity-80"
              }`}
            >
              {!canAccessDependentTabs && (
                <div className="absolute inset-0 bg-background-custom/60 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center p-4 text-center gap-2 transition-all group-hover:bg-background-custom/40">
                  <div className="p-3 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-400 shadow-md">
                    <Lock className="w-5 h-5" />
                  </div>
                  <span className="font-bold text-xs text-rose-200">Module Locked</span>
                  <span className="text-[10px] text-text-secondary max-w-[180px]">Fill verification form to unlock patient bookings</span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
                    <CalendarCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-text-primary">Patient Appointments</h4>
                    <span className="text-[10px] text-text-secondary font-mono">FR-DOC-09 Manager</span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-text-secondary leading-relaxed">
                Review incoming patient bookings, accept or decline requests, and log visit clinical notes.
              </p>

              <div className="flex items-center gap-1 text-xs font-semibold text-primary pt-2 border-t border-border-custom/40">
                <span>Open Appointments</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Card>
          </NextLink>
        </div>
      </div>
    </div>
  );
}
