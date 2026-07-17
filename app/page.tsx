"use client";

import React, { useState } from "react";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  Button,
  Input,
  ProgressBar,
  ProgressBarTrack,
  ProgressBarFill,
  Chip,
} from "@heroui/react";

export default function Home() {
  const [symptoms, setSymptoms] = useState("");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<any>(null);

  const startAnalysis = () => {
    if (!symptoms.trim()) return;
    setLoading(true);
    setTimeout(() => {
      const isCritical = symptoms.toLowerCase().includes("chest pain") || 
                         symptoms.toLowerCase().includes("breathing") || 
                         symptoms.toLowerCase().includes("severe");
      
      setReport({
        severity: isCritical ? "Critical" : "Moderate",
        severityValue: isCritical ? 90 : 45,
        conditions: isCritical 
          ? "Acute Cardiorespiratory Distress, Angina Pectoris"
          : "Atypical Tension Headache, Mild Viral Intake",
        visitRecommended: isCritical ? "Yes (Emergency Triage)" : "Yes (Schedule standard visit within 48h)",
        precaution: isCritical 
          ? "Cease all physical exertion. Seek immediate emergency help."
          : "Maintain hydration. Take temperature readings every 4 hours.",
      });
      setLoading(false);
    }, 1200);
  };

  return (
    <section className="flex flex-col items-center justify-center gap-10 py-12 md:py-20 max-w-4xl mx-auto px-4">
      {/* Hero Header */}
      <div className="flex flex-col items-center text-center gap-4 max-w-2xl">
        <Chip
          variant="primary"
          color="accent"
          className="px-4 py-1 text-xs font-semibold tracking-wider uppercase font-mono flex items-center gap-1.5"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-current" />
          Medicio Platform Pre-Launch
        </Chip>
        
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-text-primary">
          AI-Powered Healthcare Access
        </h1>
        
        <p className="text-base text-text-secondary leading-relaxed">
          Conversational symptom checkers, custom emergency provider bots, 
          and POS-synced inventory networks. Experience the future of medical discovery.
        </p>
      </div>

      {/* Simplified Checker Card */}
      <Card className="w-full max-w-xl p-6 border border-border-custom bg-surface/50 backdrop-blur-md shadow-lg">
        <CardHeader className="p-0 pb-4 flex flex-col gap-1 items-start">
          <h3 className="text-xl font-bold text-text-primary">AI Symptom Checker Triage</h3>
          <p className="text-xs text-text-secondary">
            Enter your active symptoms for an immediate simulation analysis.
          </p>
        </CardHeader>
        
        <CardContent className="p-0 pb-4 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-3 items-end">
            <div className="flex flex-col gap-1 w-full">
              <label className="text-xs font-semibold text-text-secondary">Describe symptoms</label>
              <Input
                placeholder="e.g., headache behind the eyes, mild fever"
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                className="px-3 py-2 border border-border-custom bg-background-custom/30 rounded-lg text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-primary w-full"
              />
            </div>
            <Button 
              variant="primary" 
              isDisabled={loading || !symptoms.trim()}
              onPress={startAnalysis}
              className="w-full sm:w-auto h-10 font-semibold px-6 shadow-md"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Analyzing...
                </span>
              ) : (
                "Analyze"
              )}
            </Button>
          </div>

          {report && (
            <div className="mt-4 p-4 border border-border-custom bg-background-custom/20 rounded-lg flex flex-col gap-4 text-xs text-text-secondary">
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between font-semibold">
                  <span className="text-text-primary">Triage Severity: {report.severity}</span>
                  <span className={report.severity === "Critical" ? "text-danger" : "text-warning"}>
                    {report.severityValue}%
                  </span>
                </div>
                <ProgressBar value={report.severityValue} className="w-full">
                  <ProgressBarTrack className="h-2 w-full bg-border-custom rounded-full overflow-hidden">
                    <ProgressBarFill className={report.severity === "Critical" ? "bg-danger h-full" : "bg-warning h-full"} />
                  </ProgressBarTrack>
                </ProgressBar>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
                <div>
                  <span className="text-[10px] uppercase font-mono block text-text-secondary">Conditions</span>
                  <span className="font-semibold text-text-primary">{report.conditions}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-mono block text-text-secondary">Recommendation</span>
                  <span className="font-semibold text-text-primary">{report.visitRecommended}</span>
                </div>
              </div>

              <div className="border-t border-border-custom/50 pt-2 text-[11px] leading-relaxed">
                <strong className="text-text-primary mr-1">Precautionary Instruction:</strong>
                {report.precaution}
              </div>
            </div>
          )}
        </CardContent>

        <hr className="border-t border-border-custom my-4" />
        
        <CardFooter className="p-0 text-center flex flex-col">
          <p className="text-[10px] text-text-secondary leading-relaxed uppercase tracking-wider">
            Disclaimer: Medicio AI triage is informational and does not replace a professional clinical diagnosis.
          </p>
        </CardFooter>
      </Card>

      {/* Telemetry Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-3xl mt-4">
        <Card className="p-5 border border-border-custom bg-surface/30">
          <span className="text-[10px] font-bold font-mono text-text-secondary uppercase">Verified Doctor Nodes</span>
          <h2 className="text-3xl font-extrabold text-primary mt-1">142</h2>
          <p className="text-[10px] text-text-secondary mt-0.5">52 scraped directory listings cached.</p>
        </Card>
        <Card className="p-5 border border-border-custom bg-surface/30">
          <span className="text-[10px] font-bold font-mono text-text-secondary uppercase">POS Sync Cadence</span>
          <h2 className="text-3xl font-extrabold text-primary mt-1">99.2%</h2>
          <p className="text-[10px] text-text-secondary mt-0.5">Real-time pharmacy inventory connection rate.</p>
        </Card>
        <Card className="p-5 border border-border-custom bg-surface/30">
          <span className="text-[10px] font-bold font-mono text-text-secondary uppercase">Specialty AI Latency</span>
          <h2 className="text-3xl font-extrabold text-primary mt-1">&lt; 1.8s</h2>
          <p className="text-[10px] text-text-secondary mt-0.5">Optimized NLP triage model callback time.</p>
        </Card>
      </div>
    </section>
  );
}
