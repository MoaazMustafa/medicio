"use client";

import React from "react";
import NextLink from "next/link";
import { Button, Card, Input, Chip } from "@heroui/react";
import { Sparkles, Send, Bot, ArrowLeft, ShieldAlert } from "lucide-react";
import { useDoctorContext } from "./doctor-context";

export function DoctorAgentPlayground() {
  const {
    agentName,
    agentTone,
    intakeProtocols,
    emergencyRedFlags,
    customDisclaimer,
    aiTestPrompt,
    setAiTestPrompt,
    aiTestResult,
    aiTesting,
    handleTestAgent,
    doctorData,
  } = useDoctorContext();

  return (
    <Card className="p-6 border border-border-custom bg-surface/40 flex flex-col gap-6 shadow-sm">
      <div className="border-b border-border-custom pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <span>AI Clinical Agent Simulator & Testing Sandbox</span>
          </h2>
          <p className="text-xs text-text-secondary mt-1">
            Simulate interactive patient prompts to verify how your custom specialty protocols and red flags respond before live patient triage.
          </p>
        </div>

        <NextLink href="/doctor/agent">
          <Button variant="secondary" size="sm" className="text-xs font-semibold shrink-0">
            <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Edit Agent Protocols
          </Button>
        </NextLink>
      </div>

      {/* Active Persona Summary Badge */}
      <div className="p-4 rounded-xl bg-surface/60 border border-border-custom flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 border border-primary/20 text-primary">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-text-primary block text-sm">
              {agentName || `Dr. ${doctorData?.user?.name || "Practitioner"}'s Bot`}
            </span>
            <span className="text-text-secondary">Tone: {agentTone || "Clinical"}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Chip color="accent" variant="soft" className="text-[10px] font-semibold">
            Protocols Configured
          </Chip>
        </div>
      </div>

      {/* Simulator Inputs & Preview */}
      <div className="p-5 rounded-xl bg-background-custom/40 border border-border-custom flex flex-col gap-4">
        <h3 className="text-xs font-bold text-text-primary uppercase font-mono flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" /> Interactive Triage Simulator
        </h3>

        <div className="flex gap-2">
          <Input
            placeholder="Type a sample patient symptom query (e.g. 'I have chest tightness and dizziness')..."
            value={aiTestPrompt}
            onChange={(e) => setAiTestPrompt(e.target.value)}
            className="flex-1"
          />
          <Button
            variant="primary"
            onPress={handleTestAgent}
            isDisabled={aiTesting || !aiTestPrompt}
            className="text-xs font-semibold px-5"
          >
            <Send className="w-3.5 h-3.5 mr-1" /> {aiTesting ? "Simulating..." : "Test Response"}
          </Button>
        </div>

        {/* Preset Sample Prompts */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-text-secondary text-[11px] font-mono">Sample Prompts:</span>
          {[
            "I've had a dull headache for 2 days",
            "Sharp chest pain radiating to left arm",
            "Can I get a renewal on my medication?",
          ].map((sample) => (
            <Button
              key={sample}
              variant="secondary"
              size="sm"
              className="text-[11px] h-7 px-2.5 font-normal"
              onPress={() => setAiTestPrompt(sample)}
            >
              "{sample}"
            </Button>
          ))}
        </div>

        {aiTestResult && (
          <div className="p-4 rounded-xl bg-surface/90 border border-primary/40 flex flex-col gap-2">
            <span className="text-[11px] font-mono uppercase font-bold text-primary">Generated Triage Output</span>
            <div className="text-xs text-text-primary font-mono leading-relaxed bg-background-custom/60 p-3 rounded-lg border border-border-custom/50">
              {aiTestResult}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
