"use client";

import {
  Card,
  CardHeader,
  CardContent,
  Button,
  Chip,
} from "@heroui/react";
import React from "react";

export default function DoctorDashboardPage() {
  return (
    <section className="flex flex-col items-center justify-center gap-8 py-12 md:py-16 max-w-5xl mx-auto px-4">
      {/* Header */}
      <div className="flex flex-col items-center text-center gap-3">
        <Chip variant="primary" color="accent" className="px-3 py-0.5 text-xs font-mono uppercase">
          Practitioner Panel
        </Chip>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-text-primary">
          Doctor Control Portal
        </h1>
        <p className="text-sm text-text-secondary max-w-lg">
          Manage clinical consultation appointments, fine-tune your emergency response AI assistant, and upload referrals.
        </p>
      </div>

      {/* Stats Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 w-full mt-4">
        <Card className="p-5 border border-border-custom bg-surface/30">
          <span className="text-[10px] font-bold font-mono text-text-secondary uppercase">Appointments (Today)</span>
          <h2 className="text-3xl font-extrabold text-primary mt-1">8</h2>
        </Card>
        <Card className="p-5 border border-border-custom bg-surface/30">
          <span className="text-[10px] font-bold font-mono text-text-secondary uppercase">Patients In Queue</span>
          <h2 className="text-3xl font-extrabold text-warning mt-1">3</h2>
        </Card>
        <Card className="p-5 border border-border-custom bg-surface/30">
          <span className="text-[10px] font-bold font-mono text-text-secondary uppercase">Consultations Total</span>
          <h2 className="text-3xl font-extrabold text-success mt-1">384</h2>
        </Card>
        <Card className="p-5 border border-border-custom bg-surface/30">
          <span className="text-[10px] font-bold font-mono text-text-secondary uppercase">AI Bot Accuracy</span>
          <h2 className="text-3xl font-extrabold text-text-primary mt-1">98.5%</h2>
        </Card>
      </div>

      {/* Main Panel grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
        {/* Fine-Tuning Bot */}
        <Card className="p-6 border border-border-custom bg-surface/50 backdrop-blur-md shadow-lg md:col-span-2">
          <CardHeader className="p-0 pb-4 flex flex-col gap-1 items-start">
            <h3 className="text-lg font-bold text-text-primary">Clinical Assistant Fine-Tuning</h3>
            <p className="text-xs text-text-secondary">
              Update answers to clinical questions to contextualize your personalized chatbot.
            </p>
          </CardHeader>
          <CardContent className="p-0 pb-4 flex flex-col gap-3 text-xs text-text-secondary leading-relaxed">
            <p>
              Your clinical backup chatbot allows patients to perform automated symptom evaluations scoped specifically to your specialty.
            </p>
            <div className="flex gap-3 mt-2">
              <Button variant="primary" size="sm" className="font-semibold px-4">
                Configure Bot Context
              </Button>
              <Button variant="outline" size="sm" className="font-semibold px-4 text-text-primary">
                View Chat Transcripts
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Schedule */}
        <Card className="p-6 border border-border-custom bg-surface/50 backdrop-blur-md shadow-lg">
          <CardHeader className="p-0 pb-4 flex flex-col gap-1 items-start">
            <h3 className="text-lg font-bold text-text-primary">Next Appointments</h3>
            <p className="text-xs text-text-secondary">Consultation slots for this session.</p>
          </CardHeader>
          <CardContent className="p-0 flex flex-col gap-3 text-xs text-text-secondary">
            <div className="border border-border-custom/50 p-2.5 rounded bg-background-custom/10">
              <span className="font-semibold text-text-primary block">Jane Doe (10:30 - 11:00)</span>
              <span className="text-[10px] text-text-secondary">Complaint: Chronic fatigue, headaches</span>
            </div>
            <div className="border border-border-custom/50 p-2.5 rounded bg-background-custom/10">
              <span className="font-semibold text-text-primary block">John Smith (11:15 - 11:45)</span>
              <span className="text-[10px] text-text-secondary">Complaint: High temperature, back pain</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
