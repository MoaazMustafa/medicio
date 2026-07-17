"use client";

import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  Button,
  Input,
  TextField,
  Label,
  RadioGroup,
  Radio,
  ProgressBar,
  ProgressBarTrack,
  ProgressBarFill,
  Chip,
} from "@heroui/react";
import React, { useState } from "react";

interface Provider {
  name: string;
  specialty: string;
  distance: string;
  status: string;
}

interface SimulatedReport {
  severity: string;
  severityValue: number;
  conditions: string[];
  visitRecommended: string;
  precaution: string;
  remedy: string;
  providers: Provider[];
}

export default function Home() {
  const [step, setStep] = useState(1);
  const [symptoms, setSymptoms] = useState("");
  const [duration, setDuration] = useState("");
  const [conditions, setConditions] = useState("");
  const [treatment, setTreatment] = useState("allopathic");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<SimulatedReport | null>(null);

  const startAnalysis = () => {
    setLoading(true);
    setTimeout(() => {
      // Generate a mock clinical triage response based on inputs
      const isCritical = symptoms.toLowerCase().includes("chest pain") || 
                         symptoms.toLowerCase().includes("breathing") || 
                         symptoms.toLowerCase().includes("severe");
      
      setReport({
        severity: isCritical ? "Critical" : "Moderate",
        severityValue: isCritical ? 90 : 45,
        conditions: isCritical 
          ? ["Acute Cardiorespiratory Distress", "Angina Pectoris", "Bronchospasm"]
          : ["Atypical Tension Headache", "Seasonal Rhinitis", "Mild Viral Intake"],
        visitRecommended: isCritical ? "Yes (Emergency Triage)" : "Yes (Schedule standard visit within 48h)",
        precaution: isCritical 
          ? "Cease all physical exertion. Rest upright. If symptom worsens or spreads, seek immediate emergency help."
          : "Maintain hydration. Avoid bright screen exposure. Take temperature readings every 4 hours.",
        remedy: isCritical ? "N/A - Direct Clinical Intervention Required" : "Paracetamol 500mg (as directed by physician)",
        providers: [
          { name: "Dr. Aisha Rahman", specialty: "Cardiologist", distance: "1.2 km", status: "Verified" },
          { name: "City General Hospital", specialty: "Emergency Care", distance: "3.4 km", status: "Verified" },
          { name: "Al-Shifa Pharmacy", specialty: "POS Inventory Synced", distance: "0.8 km", status: "Scraped" }
        ]
      });
      setLoading(false);
      setStep(3);
    }, 1500);
  };

  const resetForm = () => {
    setSymptoms("");
    setDuration("");
    setConditions("");
    setTreatment("allopathic");
    setReport(null);
    setStep(1);
  };

  return (
    <section className="flex flex-col items-center justify-center gap-12 py-12 md:py-20 max-w-5xl mx-auto px-4">
      {/* Hero Header */}
      <div className="flex flex-col items-center text-center gap-6 max-w-3xl">
        <Chip
          variant="primary"
          color="accent"
          className="px-4 py-1 text-xs font-semibold tracking-wider uppercase font-mono flex items-center gap-1.5"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-current" />
          Medicio Platform Pre-Launch
        </Chip>
        
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-text-primary leading-tight">
          AI-Powered<br />
          <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            Healthcare Access Portal
          </span>
        </h1>
        
        <p className="text-lg text-text-secondary max-w-2xl leading-relaxed">
          Conversational AI symptom checkers, custom-trained emergency provider bots, 
          and POS-synced inventory networks. Experience the future of medical discovery.
        </p>
      </div>

      {/* Interactive AI Symptom Checker Simulator */}
      <Card className="w-full max-w-2xl p-6 border border-border-custom bg-surface/50 backdrop-blur-md shadow-xl">
        <CardHeader className="flex flex-col gap-1 items-start">
          <div className="flex justify-between w-full items-center">
            <h3 className="text-2xl font-bold text-text-primary">M2 AI Symptom Checker</h3>
            <Chip size="sm" variant="secondary" color="default">
              Simulation Session
            </Chip>
          </div>
          <p className="text-sm text-text-secondary">
            Provide details to test our triage resolution models.
          </p>
        </CardHeader>
        <hr className="border-t border-border-custom my-4" />
        <CardContent className="min-h-[220px]">
          {step === 1 && (
            <div className="flex flex-col gap-4">
              <TextField className="flex flex-col gap-1.5 w-full">
                <Label className="text-xs font-semibold text-text-secondary">Describe your active symptoms</Label>
                <Input
                  placeholder="e.g. Dull headache behind the eyes, mild fever"
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  className="px-3 py-2 border border-border-custom bg-background-custom/30 rounded-lg text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-primary w-full"
                />
              </TextField>
              <TextField className="flex flex-col gap-1.5 w-full">
                <Label className="text-xs font-semibold text-text-secondary">Duration of symptoms</Label>
                <Input
                  placeholder="e.g. 3 days, since yesterday morning"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="px-3 py-2 border border-border-custom bg-background-custom/30 rounded-lg text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-primary w-full"
                />
              </TextField>
              <div className="flex justify-end mt-4">
                <Button 
                  variant="primary" 
                  isDisabled={!symptoms || !duration}
                  onPress={() => setStep(2)}
                >
                  Continue to Intake
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-4">
              <TextField className="flex flex-col gap-1.5 w-full">
                <Label className="text-xs font-semibold text-text-secondary">Known pre-existing conditions (Optional)</Label>
                <Input
                  placeholder="e.g. Diabetes Type 2, Hypertension"
                  value={conditions}
                  onChange={(e) => setConditions(e.target.value)}
                  className="px-3 py-2 border border-border-custom bg-background-custom/30 rounded-lg text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-primary w-full"
                />
              </TextField>
              <RadioGroup
                value={treatment}
                onChange={setTreatment}
                orientation="horizontal"
                className="mt-2 flex flex-col gap-1.5"
              >
                <Label className="text-xs font-semibold text-text-secondary">Intended Treatment Focus</Label>
                <div className="flex gap-4">
                  <Radio value="allopathic">Allopathic</Radio>
                  <Radio value="homeopathic">Homeopathic</Radio>
                  <Radio value="tibb">Tibb (Unani)</Radio>
                </div>
              </RadioGroup>
              <div className="flex justify-between items-center mt-6">
                <Button variant="secondary" onPress={() => setStep(1)}>
                  Back
                </Button>
                <Button 
                  variant="primary" 
                  isDisabled={loading}
                  onPress={startAnalysis}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Analyzing...
                    </span>
                  ) : (
                    "Analyze Symptoms"
                  )}
                </Button>
              </div>
            </div>
          )}

          {step === 3 && report && (
            <div className="flex flex-col gap-6">
              {/* Severity Triage */}
              <div className="flex flex-col gap-2">
                <ProgressBar value={report.severityValue} className="w-full">
                  <div className="flex justify-between text-sm font-semibold">
                    <span className="text-text-primary">Triage Severity: {report.severity}</span>
                    <span className={report.severity === "Critical" ? "text-danger" : "text-warning"}>
                      {report.severityValue}%
                    </span>
                  </div>
                  <ProgressBarTrack className="h-2 w-full bg-border-custom rounded-full overflow-hidden mt-1">
                    <ProgressBarFill className={report.severity === "Critical" ? "bg-danger h-full transition-all duration-300" : "bg-warning h-full transition-all duration-300"} />
                  </ProgressBarTrack>
                </ProgressBar>
              </div>

              {/* Conditions List */}
              <div>
                <h4 className="text-sm font-semibold text-text-primary mb-2">Ranked Possible Diagnoses</h4>
                <div className="flex flex-wrap gap-2">
                  {report.conditions.map((c: string, i: number) => (
                    <Chip key={i} variant="secondary" color="default" size="sm">
                      {c}
                    </Chip>
                  ))}
                </div>
              </div>

              {/* Recommendations */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border border-border-custom p-4 rounded-lg bg-background-custom/30">
                <div>
                  <span className="text-xs text-text-secondary block font-mono">VISIT RECOMMENDED</span>
                  <span className="text-sm font-bold text-text-primary">{report.visitRecommended}</span>
                </div>
                <div>
                  <span className="text-xs text-text-secondary block font-mono">TEMPORARY STABILIZATION</span>
                  <span className="text-sm font-bold text-text-primary">{report.remedy}</span>
                </div>
              </div>

              {/* Precautions */}
              <div className="p-3 border-l-4 border-primary bg-primary/5 rounded-r text-xs text-text-secondary leading-relaxed">
                <strong className="text-text-primary block font-sans mb-0.5">Clinical Precaution Note:</strong>
                {report.precaution}
              </div>

              {/* Providers */}
              <div>
                <h4 className="text-sm font-semibold text-text-primary mb-2">Closest Recommended Care Points</h4>
                <div className="flex flex-col gap-2">
                  {report.providers.map((p: Provider, i: number) => (
                    <div key={i} className="flex justify-between items-center p-2 rounded border border-border-custom bg-surface text-xs">
                      <div>
                        <span className="font-bold text-text-primary mr-2">{p.name}</span>
                        <span className="text-text-secondary">({p.specialty})</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-text-secondary font-mono">{p.distance}</span>
                        <Chip size="sm" variant={p.status === "Verified" ? "primary" : "secondary"} color={p.status === "Verified" ? "success" : "default"} className="flex items-center gap-1">
                          <span className="w-1 h-1 rounded-full bg-current" />
                          {p.status}
                        </Chip>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
         </CardContent>
        <hr className="border-t border-border-custom my-4" />
        <CardFooter className="flex flex-col gap-3 text-center">
          {step === 3 && (
            <Button variant="secondary" className="w-full" onPress={resetForm}>
              Analyze Another Symptom Set
            </Button>
          )}
          {/* Strict Medical Disclaimer (FR-AI-10 Compliance) */}
          <p className="text-[10px] text-text-secondary leading-relaxed uppercase tracking-wider">
            Disclaimer: Medicio AI triage is purely informational and does not constitute a certified medical diagnosis. Always consult a licensed clinician for emergencies.
          </p>
        </CardFooter>
      </Card>

      {/* Platform Telemetry Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-8">
        <Card className="p-6 border border-border-custom bg-surface/30">
          <span className="text-xs font-bold font-mono text-text-secondary uppercase">M4 Verified Doctor Nodes</span>
          <h2 className="text-4xl font-extrabold text-primary mt-2">142</h2>
          <p className="text-xs text-text-secondary mt-1">52 scraped directory listings cached.</p>
        </Card>
        <Card className="p-6 border border-border-custom bg-surface/30">
          <span className="text-xs font-bold font-mono text-text-secondary uppercase">M6 POS Sync Cadence</span>
          <h2 className="text-4xl font-extrabold text-primary mt-2">99.2%</h2>
          <p className="text-xs text-text-secondary mt-1">Real-time pharmacy inventory connection rate.</p>
        </Card>
        <Card className="p-6 border border-border-custom bg-surface/30">
          <span className="text-xs font-bold font-mono text-text-secondary uppercase">M3 specialty AI Latency</span>
          <h2 className="text-4xl font-extrabold text-primary mt-2">&lt; 1.8s</h2>
          <p className="text-xs text-text-secondary mt-1">Optimized NLP triage model callback time.</p>
        </Card>
      </div>
    </section>
  );
}
