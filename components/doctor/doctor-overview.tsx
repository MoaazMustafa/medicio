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
} from "lucide-react";
import { useDoctorContext } from "./doctor-context";

export function DoctorOverview() {
  const { doctorData, appointments } = useDoctorContext();

  const isVerified = doctorData?.isVerified ?? false;

  return (
    <div className="flex flex-col gap-6">
      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border border-border-custom bg-surface/50 flex flex-col gap-2 shadow-xs">
          <span className="text-xs text-text-secondary uppercase font-mono font-semibold">Credential Status</span>
          <div className="flex items-center gap-2 mt-1">
            {isVerified ? (
              <span className="text-lg font-bold text-emerald-400 flex items-center gap-1">
                <ShieldCheck className="w-5 h-5" /> Verified Active
              </span>
            ) : (
              <span className="text-lg font-bold text-amber-400 flex items-center gap-1">
                <Clock className="w-5 h-5" /> In Review Queue
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
              Edit Credentials <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </NextLink>
        </h2>

        {doctorData ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-background-custom/50 border border-border-custom/60 flex flex-col gap-2">
              <span className="font-bold text-text-primary text-sm">Dr. {doctorData.user?.name}</span>
              <span className="text-text-secondary">Email: {doctorData.user?.email}</span>
              <span className="text-text-secondary">Specialty: {doctorData.specialty || "Not set"}</span>
              <span className="text-text-secondary">Education: {doctorData.education || "Not set"}</span>
              <span className="text-text-secondary">Experience: {doctorData.experience || 0} Years</span>
              <span className="text-text-secondary font-mono">License: {doctorData.licenseNumber || "Not set"}</span>
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
        <NextLink href="/doctor/availability">
          <Card className="p-5 border border-border-custom bg-surface/50 hover:border-primary/50 transition-all cursor-pointer flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              <h3 className="text-sm font-bold text-text-primary">Schedule & Timetable</h3>
            </div>
            <p className="text-xs text-text-secondary">Manage working hours, available days, and appointment slot duration.</p>
          </Card>
        </NextLink>

        <NextLink href="/doctor/agent">
          <Card className="p-5 border border-border-custom bg-surface/50 hover:border-primary/50 transition-all cursor-pointer flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-primary" />
              <h3 className="text-sm font-bold text-text-primary">AI Clinical Agent</h3>
            </div>
            <p className="text-xs text-text-secondary">Configure emergency red flags, intake protocols, and test in simulator.</p>
          </Card>
        </NextLink>

        <NextLink href="/doctor/appointments">
          <Card className="p-5 border border-border-custom bg-surface/50 hover:border-primary/50 transition-all cursor-pointer flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <CalendarCheck className="w-5 h-5 text-primary" />
              <h3 className="text-sm font-bold text-text-primary">Patient Appointments</h3>
            </div>
            <p className="text-xs text-text-secondary">Review patient bookings, accept slots, and mark visits complete.</p>
          </Card>
        </NextLink>
      </div>
    </div>
  );
}
