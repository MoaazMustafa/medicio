"use client";

import React from "react";
import {
  Card,
  CardHeader,
  CardContent,
  Button,
  Chip,
} from "@heroui/react";

export default function LabDashboardPage() {
  return (
    <section className="flex flex-col items-center justify-center gap-8 py-12 md:py-16 max-w-5xl mx-auto px-4">
      {/* Header */}
      <div className="flex flex-col items-center text-center gap-3">
        <Chip variant="primary" color="accent" className="px-3 py-0.5 text-xs font-mono uppercase">
          Lab Operator Panel
        </Chip>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-text-primary">
          Lab Diagnostics Center
        </h1>
        <p className="text-sm text-text-secondary max-w-lg">
          Upload verified diagnostic reports, check patient appointment queue, and edit catalog list.
        </p>
      </div>

      {/* Stats Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 w-full mt-4">
        <Card className="p-5 border border-border-custom bg-surface/30">
          <span className="text-[10px] font-bold font-mono text-text-secondary uppercase">Active Test Types</span>
          <h2 className="text-3xl font-extrabold text-primary mt-1">12</h2>
        </Card>
        <Card className="p-5 border border-border-custom bg-surface/30">
          <span className="text-[10px] font-bold font-mono text-text-secondary uppercase">Pending Reports</span>
          <h2 className="text-3xl font-extrabold text-warning mt-1">5</h2>
        </Card>
        <Card className="p-5 border border-border-custom bg-surface/30">
          <span className="text-[10px] font-bold font-mono text-text-secondary uppercase">Reports Released</span>
          <h2 className="text-3xl font-extrabold text-success mt-1">198</h2>
        </Card>
        <Card className="p-5 border border-border-custom bg-surface/30">
          <span className="text-[10px] font-bold font-mono text-text-secondary uppercase">Daily Diagnostics</span>
          <h2 className="text-3xl font-extrabold text-text-primary mt-1">28</h2>
        </Card>
      </div>

      {/* Main Panel grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
        {/* Upload Panel */}
        <Card className="p-6 border border-border-custom bg-surface/50 backdrop-blur-md shadow-lg md:col-span-2">
          <CardHeader className="p-0 pb-4 flex flex-col gap-1 items-start">
            <h3 className="text-lg font-bold text-text-primary">Publish Diagnostic Reports</h3>
            <p className="text-xs text-text-secondary">
              Upload PDF files or fill in blood/urine values directly to patient portals.
            </p>
          </CardHeader>
          <CardContent className="p-0 pb-4 flex flex-col gap-3 text-xs text-text-secondary leading-relaxed">
            <p>
              Uploaded diagnostic reports are immediately securely processed and made available to referring medical doctors for treatment guidance.
            </p>
            <div className="flex gap-3 mt-2">
              <Button variant="primary" size="sm" className="font-semibold px-4">
                Upload New Report
              </Button>
              <Button variant="outline" size="sm" className="font-semibold px-4 text-text-primary">
                View Past Records
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Diagnostic Queue */}
        <Card className="p-6 border border-border-custom bg-surface/50 backdrop-blur-md shadow-lg">
          <CardHeader className="p-0 pb-4 flex flex-col gap-1 items-start">
            <h3 className="text-lg font-bold text-text-primary">Diagnostics Queue</h3>
            <p className="text-xs text-text-secondary">Patients booked for samples.</p>
          </CardHeader>
          <CardContent className="p-0 flex flex-col gap-2.5 text-xs text-text-secondary">
            <div className="flex justify-between border-b border-border-custom/30 pb-2">
              <span>Robert Miller</span>
              <strong className="text-text-primary">CBC Test (11:00)</strong>
            </div>
            <div className="flex justify-between border-b border-border-custom/30 pb-2">
              <span>Sarah Johnson</span>
              <strong className="text-text-primary">Lipid Profile (11:30)</strong>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
