"use client";

import { Button, Card, Input, Label, TextArea } from "@heroui/react";
import { Bot, Sparkles, ArrowRight } from "lucide-react";
import NextLink from "next/link";
import React from "react";

import { useDoctorContext } from "./doctor-context";

export function DoctorAgentConfig() {
  const {
    agentName,
    setAgentName,
    agentTone,
    setAgentTone,
    emergencyRedFlags,
    setEmergencyRedFlags,
    intakeProtocols,
    setIntakeProtocols,
    practiceBoundaries,
    setPracticeBoundaries,
    customDisclaimer,
    setCustomDisclaimer,
    handleTrainAgent,
    doctorData,
    saving,
  } = useDoctorContext();

  return (
    <Card className="p-6 border border-border-custom bg-surface/40 flex flex-col gap-6 shadow-sm">
      <div className="border-b border-border-custom pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
            <Bot className="w-5 h-5 text-primary" />
            <span>Train Specialty AI Agent Protocols & Red Flags</span>
          </h2>
          <p className="text-xs text-text-secondary mt-1">
            FR-DOC-08: Complete the emergency question set, intake protocols, and practice boundaries to fine-tune your personal specialty bot.
          </p>
        </div>

        <NextLink href="/doctor/agent/playground">
          <Button variant="secondary" size="sm" className="text-xs font-semibold text-primary shrink-0">
            <Sparkles className="w-3.5 h-3.5 mr-1 text-primary" /> Open Agent Simulator <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </NextLink>
      </div>

      <form onSubmit={handleTrainAgent} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs font-semibold text-text-primary">Agent Display Name</Label>
          <Input
            placeholder={`Dr. ${doctorData?.user?.name || "Practitioner"}'s Assistant`}
            value={agentName}
            onChange={(e) => setAgentName(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="text-xs font-semibold text-text-primary">Clinical Communication Tone</Label>
          <Input
            placeholder="e.g. Clinical & Reassuring, Empathetic, Direct"
            value={agentTone}
            onChange={(e) => setAgentTone(e.target.value)}
          />
        </div>

        <div className="md:col-span-2 flex flex-col gap-1.5">
          <Label className="text-xs font-semibold text-text-primary">Emergency Red Flags (Comma separated keywords)</Label>
          <TextArea
            placeholder="Chest pain radiating to jaw/arm, sudden severe breathlessness..."
            value={emergencyRedFlags}
            onChange={(e) => setEmergencyRedFlags(e.target.value)}
            rows={2}
          />
        </div>

        <div className="md:col-span-2 flex flex-col gap-1.5">
          <Label className="text-xs font-semibold text-text-primary">Specialty Intake & Triage Protocols</Label>
          <TextArea
            placeholder="Clinical guidelines on how the bot should triage patient symptoms for your specialty..."
            value={intakeProtocols}
            onChange={(e) => setIntakeProtocols(e.target.value)}
            rows={3}
          />
        </div>

        <div className="md:col-span-2 flex flex-col gap-1.5">
          <Label className="text-xs font-semibold text-text-primary">Practice Scope & Prescription Boundaries</Label>
          <TextArea
            placeholder="Rules on what advice the agent cannot provide (e.g. schedule II drugs)..."
            value={practiceBoundaries}
            onChange={(e) => setPracticeBoundaries(e.target.value)}
            rows={2}
          />
        </div>

        <div className="md:col-span-2 flex flex-col gap-1.5">
          <Label className="text-xs font-semibold text-text-primary">Custom Patient Medical Disclaimer</Label>
          <TextArea
            placeholder="Custom text displayed to patients before symptom triage..."
            value={customDisclaimer}
            onChange={(e) => setCustomDisclaimer(e.target.value)}
            rows={2}
          />
        </div>

        <div className="md:col-span-2 flex justify-end">
          <Button variant="primary" type="submit" isDisabled={saving} className="px-6 font-semibold text-xs">
            {saving ? "Publishing Agent..." : "Train & Publish Specialty AI Agent"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
