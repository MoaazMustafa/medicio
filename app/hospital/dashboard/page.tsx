"use client";

import {
  Card,
  CardHeader,
  CardContent,
  Button,
  Chip,
} from "@heroui/react";
import React from "react";

export default function HospitalDashboardPage() {
  return (
    <section className="flex flex-col items-center justify-center gap-8 py-12 md:py-16 max-w-5xl mx-auto px-4">
      {/* Header */}
      <div className="flex flex-col items-center text-center gap-3">
        <Chip variant="primary" color="accent" className="px-3 py-0.5 text-xs font-mono uppercase">
          Clinical Center Admin
        </Chip>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-text-primary">
          Hospital Admissions Control
        </h1>
        <p className="text-sm text-text-secondary max-w-lg">
          Manage clinic rooms, emergency triage admission records, and coordinate medical personnel.
        </p>
      </div>

      {/* Stats Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 w-full mt-4">
        <Card className="p-5 border border-border-custom bg-surface/30">
          <span className="text-[10px] font-bold font-mono text-text-secondary uppercase">Available Beds</span>
          <h2 className="text-3xl font-extrabold text-success mt-1">18 / 60</h2>
        </Card>
        <Card className="p-5 border border-border-custom bg-surface/30">
          <span className="text-[10px] font-bold font-mono text-text-secondary uppercase">Emergency Cases</span>
          <h2 className="text-3xl font-extrabold text-danger mt-1">4</h2>
        </Card>
        <Card className="p-5 border border-border-custom bg-surface/30">
          <span className="text-[10px] font-bold font-mono text-text-secondary uppercase">Active Doctors</span>
          <h2 className="text-3xl font-extrabold text-primary mt-1">12</h2>
        </Card>
        <Card className="p-5 border border-border-custom bg-surface/30">
          <span className="text-[10px] font-bold font-mono text-text-secondary uppercase">Daily Admissions</span>
          <h2 className="text-3xl font-extrabold text-text-primary mt-1">45</h2>
        </Card>
      </div>

      {/* Main Panel grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
        {/* Ward Manager */}
        <Card className="p-6 border border-border-custom bg-surface/50 backdrop-blur-md shadow-lg md:col-span-2">
          <CardHeader className="p-0 pb-4 flex flex-col gap-1 items-start">
            <h3 className="text-lg font-bold text-text-primary">Clinical Bed Management</h3>
            <p className="text-xs text-text-secondary">
              Review current patient occupancy and allocate rooms dynamically.
            </p>
          </CardHeader>
          <CardContent className="p-0 pb-4 flex flex-col gap-3 text-xs text-text-secondary leading-relaxed">
            <p>
              Integrated real-time dashboard connecting your physical admissions counter with patient diagnostic records to auto-assign care nodes.
            </p>
            <div className="flex gap-3 mt-2">
              <Button variant="primary" size="sm" className="font-semibold px-4">
                Allocate Patient Bed
              </Button>
              <Button variant="outline" size="sm" className="font-semibold px-4 text-text-primary">
                View Ward Schema
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ER Queue */}
        <Card className="p-6 border border-border-custom bg-surface/50 backdrop-blur-md shadow-lg">
          <CardHeader className="p-0 pb-4 flex flex-col gap-1 items-start">
            <h3 className="text-lg font-bold text-text-primary">Active ER Intake Queue</h3>
            <p className="text-xs text-text-secondary">Triage priority checklist.</p>
          </CardHeader>
          <CardContent className="p-0 flex flex-col gap-2.5 text-xs text-text-secondary">
            <div className="flex justify-between border-b border-border-custom/30 pb-2">
              <span>Cardiology (B1)</span>
              <strong className="text-danger">Critical (Priority 1)</strong>
            </div>
            <div className="flex justify-between border-b border-border-custom/30 pb-2">
              <span>Trauma (B3)</span>
              <strong className="text-warning">Moderate (Priority 2)</strong>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
