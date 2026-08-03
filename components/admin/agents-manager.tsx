"use client";

import { Button, Card, Chip, Input, Label, Modal, TextArea } from "@heroui/react";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Baby,
  Bone,
  Bot,
  Brain,
  Check,
  Ear,
  Eye,
  HeartHandshake,
  HeartPulse,
  Pencil,
  Plus,
  Power,
  RefreshCw,
  Sparkles,
  Stethoscope,
  Trash2,
  Wind,
  X,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

const AGENT_ICONS: Record<string, LucideIcon> = {
  GENERAL: Bot,
  DERMATOLOGY: Sparkles,
  CARDIOLOGY: HeartPulse,
  NEUROLOGY: Brain,
  PEDIATRICS: Baby,
  ORTHOPEDICS: Bone,
  GYNECOLOGY: Stethoscope,
  ENT: Ear,
  OPHTHALMOLOGY: Eye,
  PSYCHIATRY: HeartHandshake,
  GASTROENTEROLOGY: Activity,
  PULMONOLOGY: Wind,
};

interface AdminDoctorTraining {
  agentName: string;
  agentTone: string;
  emergencyRedFlags: string[];
  intakeProtocols: string;
  practiceBoundaries: string;
  customDisclaimer: string;
  triageAdviceRules: string;
  trainedAt: string | null;
}

interface AdminDoctor {
  id: string;
  name: string;
  email: string | null;
  specialty: string;
  verificationStatus: string | null;
  isTrained: boolean;
  agentName: string | null;
  training: AdminDoctorTraining | null;
}

interface AdminAgent {
  id: string;
  specialty: string;
  displayName: string;
  description: string;
  trainingData: string | null;
  suggestedQuestions: string[];
  attachedDoctorIds: string[];
  isEnabled: boolean;
  isTrained: boolean;
  updatedAt: string;
}

function doctorMatchesSpecialty(doctorSpecialty: string, agentSpecialty: string): boolean {
  if (agentSpecialty === "GENERAL") return true;
  const d = doctorSpecialty.toUpperCase();
  const a = agentSpecialty.toUpperCase();

  return d.includes(a) || a.includes(d);
}

export function AgentsManager() {
  const [agents, setAgents] = useState<AdminAgent[]>([]);
  const [doctors, setDoctors] = useState<AdminDoctor[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  // Agent edit modal state
  const [editingAgent, setEditingAgent] = useState<AdminAgent | null>(null);
  const [formDisplayName, setFormDisplayName] = useState<string>("");
  const [formDescription, setFormDescription] = useState<string>("");
  const [formTrainingData, setFormTrainingData] = useState<string>("");
  const [formQuestions, setFormQuestions] = useState<string[]>([]);
  const [newQuestion, setNewQuestion] = useState<string>("");
  const [formDoctorIds, setFormDoctorIds] = useState<string[]>([]);
  const [formEnabled, setFormEnabled] = useState<boolean>(true);
  const [showAllDoctors, setShowAllDoctors] = useState<boolean>(false);

  // Doctor training modal state
  const [editingDoctor, setEditingDoctor] = useState<AdminDoctor | null>(null);
  const [docAgentName, setDocAgentName] = useState<string>("");
  const [docAgentTone, setDocAgentTone] = useState<string>("");
  const [docRedFlags, setDocRedFlags] = useState<string>("");
  const [docIntake, setDocIntake] = useState<string>("");
  const [docBoundaries, setDocBoundaries] = useState<string>("");
  const [docDisclaimer, setDocDisclaimer] = useState<string>("");
  const [docTriageRules, setDocTriageRules] = useState<string>("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/agents");
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to load specialist models.");
      setAgents(data.agents || []);
      setDoctors(data.doctors || []);
    } catch (err: any) {
      toast.error(err.message || "Could not fetch specialist models.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openAgentModal = (agent: AdminAgent) => {
    setEditingAgent(agent);
    setFormDisplayName(agent.displayName);
    setFormDescription(agent.description);
    setFormTrainingData(agent.trainingData || "");
    setFormQuestions(agent.suggestedQuestions);
    setNewQuestion("");
    setFormDoctorIds(agent.attachedDoctorIds);
    setFormEnabled(agent.isEnabled);
    setShowAllDoctors(false);
  };

  const saveAgent = async () => {
    if (!editingAgent) return;
    if (!formDisplayName.trim() || !formDescription.trim()) {
      toast.error("Display name and description are required.");

      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/agents/${editingAgent.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: formDisplayName.trim(),
          description: formDescription.trim(),
          trainingData: formTrainingData.trim() ? formTrainingData.trim() : null,
          suggestedQuestions: formQuestions,
          attachedDoctorIds: formDoctorIds,
          isEnabled: formEnabled,
        }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to update specialist model.");

      setAgents((prev) => prev.map((a) => (a.id === data.agent.id ? { ...a, ...data.agent } : a)));
      toast.success(`"${data.agent.displayName}" saved — model is now ${data.agent.isTrained && data.agent.isEnabled ? "LIVE" : "not live"}.`);
      setEditingAgent(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to update specialist model.");
    } finally {
      setSaving(false);
    }
  };

  const openDoctorModal = (doctor: AdminDoctor) => {
    setEditingDoctor(doctor);
    setDocAgentName(doctor.training?.agentName || doctor.agentName || "");
    setDocAgentTone(doctor.training?.agentTone || "");
    setDocRedFlags((doctor.training?.emergencyRedFlags || []).join("\n"));
    setDocIntake(doctor.training?.intakeProtocols || "");
    setDocBoundaries(doctor.training?.practiceBoundaries || "");
    setDocDisclaimer(doctor.training?.customDisclaimer || "");
    setDocTriageRules(doctor.training?.triageAdviceRules || "");
  };

  const saveDoctorTraining = async () => {
    if (!editingDoctor) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/agents/doctors/${editingDoctor.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentName: docAgentName.trim() || undefined,
          agentTone: docAgentTone.trim() || undefined,
          emergencyRedFlags: docRedFlags
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean),
          intakeProtocols: docIntake.trim(),
          practiceBoundaries: docBoundaries.trim(),
          customDisclaimer: docDisclaimer.trim() || undefined,
          triageAdviceRules: docTriageRules.trim(),
          isTrained: true,
        }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to update doctor training.");

      setDoctors((prev) => prev.map((d) => (d.id === data.doctor.id ? { ...d, ...data.doctor } : d)));
      toast.success(`Training saved for ${data.doctor.name}.`);
      setEditingDoctor(null);
      // Attached-doctor training affects agent liveness — refresh catalog.
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Failed to update doctor training.");
    } finally {
      setSaving(false);
    }
  };

  const addQuestion = () => {
    const q = newQuestion.trim();

    if (!q) return;
    if (formQuestions.includes(q)) {
      toast.error("That question is already in the list.");

      return;
    }
    setFormQuestions((prev) => [...prev, q]);
    setNewQuestion("");
  };

  const toggleDoctorAttach = (doctorId: string) => {
    setFormDoctorIds((prev) =>
      prev.includes(doctorId) ? prev.filter((id) => id !== doctorId) : [...prev, doctorId],
    );
  };

  const liveCount = agents.filter((a) => a.isEnabled && a.isTrained).length;
  const soonCount = agents.filter((a) => a.isEnabled && !a.isTrained).length;
  const disabledCount = agents.filter((a) => !a.isEnabled).length;

  const modalDoctors = editingAgent
    ? doctors.filter((doc) => showAllDoctors || formDoctorIds.includes(doc.id) || doctorMatchesSpecialty(doc.specialty, editingAgent.specialty))
    : [];

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-text-primary">AI Specialist Models</h1>
            <p className="text-xs text-text-secondary">
              Train each specialty model, curate suggested questions, and attach trained doctors. Untrained models show
              as &ldquo;Soon&rdquo; to patients and never answer.
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Chip className="text-[10px] font-mono font-bold uppercase" color="success" variant="soft">
            {liveCount} Live
          </Chip>
          <Chip className="text-[10px] font-mono font-bold uppercase" variant="soft">
            {soonCount} Soon
          </Chip>
          <Chip className="text-[10px] font-mono font-bold uppercase" color="danger" variant="soft">
            {disabledCount} Disabled
          </Chip>
          <Button className="text-xs font-semibold" size="sm" variant="secondary" onPress={fetchData}>
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Refresh
          </Button>
        </div>
      </div>

      {/* Agent cards */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-44 animate-pulse rounded-2xl border border-border-custom bg-surface/40" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {agents.map((agent) => {
            const AgentIcon = AGENT_ICONS[agent.specialty] ?? Stethoscope;
            const isLive = agent.isEnabled && agent.isTrained;
            const attachedTrainedCount = agent.attachedDoctorIds.filter(
              (id) => doctors.find((d) => d.id === id)?.isTrained,
            ).length;

            return (
              <Card
                key={agent.id}
                className="flex flex-col gap-3 border border-border-custom bg-surface/70 p-5 shadow-xs transition-all hover:border-primary/40"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border",
                        isLive
                          ? "border-primary/20 bg-primary/10 text-primary"
                          : "border-border-custom bg-background-custom/60 text-text-secondary",
                      )}
                    >
                      <AgentIcon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-bold text-text-primary">{agent.displayName}</h3>
                      <span className="font-mono text-[10px] tracking-wider text-text-secondary uppercase">
                        {agent.specialty}
                      </span>
                    </div>
                  </div>

                  {!agent.isEnabled ? (
                    <Chip className="shrink-0 text-[9px] font-mono font-bold uppercase" color="danger" variant="soft">
                      Disabled
                    </Chip>
                  ) : isLive ? (
                    <Chip className="shrink-0 text-[9px] font-mono font-bold uppercase" color="success" variant="soft">
                      Live
                    </Chip>
                  ) : (
                    <Chip className="shrink-0 text-[9px] font-mono font-bold uppercase" variant="soft">
                      Soon
                    </Chip>
                  )}
                </div>

                <p className="line-clamp-2 text-xs leading-relaxed text-text-secondary">{agent.description}</p>

                <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-text-secondary">
                  <span>{agent.trainingData ? "Admin training set" : "No admin training"}</span>
                  <span>{agent.suggestedQuestions.length} suggestions</span>
                  <span>
                    {agent.attachedDoctorIds.length} doctors ({attachedTrainedCount} trained)
                  </span>
                </div>

                <Button
                  className="w-full text-xs font-semibold"
                  size="sm"
                  variant="secondary"
                  onPress={() => openAgentModal(agent)}
                >
                  <Pencil className="mr-1.5 h-3.5 w-3.5 text-primary" /> Manage model
                </Button>
              </Card>
            );
          })}
        </div>
      )}

      {/* Agent edit modal */}
      {editingAgent && (
        <Modal.Root isOpen={!!editingAgent} onOpenChange={() => setEditingAgent(null)}>
          <Modal.Backdrop className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md outline-none animate-in fade-in">
            <Modal.Dialog className="pointer-events-auto flex h-fit max-h-[90vh] w-full max-w-2xl flex-col gap-4 overflow-y-auto rounded-2xl border border-border-custom bg-surface p-6 shadow-2xl outline-none">
              <Modal.Header className="flex items-center justify-between border-b border-border-custom pb-3">
                <h3 className="flex items-center gap-2 text-sm font-bold text-text-primary">
                  <Bot className="h-4 w-4 text-primary" /> Manage {editingAgent.displayName}
                  <Chip className="font-mono text-[9px] uppercase" variant="soft">
                    {editingAgent.specialty}
                  </Chip>
                </h3>
                <Modal.CloseTrigger className="p-1 text-text-secondary hover:text-text-primary">
                  <X className="h-4 w-4" />
                </Modal.CloseTrigger>
              </Modal.Header>

              <Modal.Body className="flex flex-col gap-5 py-2 text-xs text-text-primary">
                {/* Identity */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs font-semibold text-text-secondary">Display name</Label>
                    <Input value={formDisplayName} onChange={(e) => setFormDisplayName(e.target.value)} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs font-semibold text-text-secondary">Short description</Label>
                    <Input value={formDescription} onChange={(e) => setFormDescription(e.target.value)} />
                  </div>
                </div>

                {/* Training data */}
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-semibold text-text-secondary">
                    Clinical training directives (makes the model LIVE when set)
                  </Label>
                  <TextArea
                    className="min-h-28 text-xs"
                    placeholder="Intake protocols, red-flag rules, triage boundaries this specialist model must follow…"
                    value={formTrainingData}
                    onChange={(e) => setFormTrainingData(e.target.value)}
                  />
                </div>

                {/* Suggested questions */}
                <div className="flex flex-col gap-2">
                  <Label className="text-xs font-semibold text-text-secondary">
                    Suggested patient questions ({formQuestions.length}/12)
                  </Label>

                  <div className="flex flex-col gap-1.5">
                    {formQuestions.map((q, idx) => (
                      <div
                        key={`${q}-${idx}`}
                        className="flex items-center justify-between gap-2 rounded-lg border border-border-custom bg-background-custom/50 px-3 py-1.5"
                      >
                        <span className="truncate text-xs text-text-primary">{q}</span>
                        <button
                          aria-label={`Remove question: ${q}`}
                          className="shrink-0 cursor-pointer p-0.5 text-text-secondary hover:text-red-500"
                          type="button"
                          onClick={() => setFormQuestions((prev) => prev.filter((_, i) => i !== idx))}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                    {formQuestions.length === 0 && (
                      <span className="px-1 text-[11px] text-text-secondary">
                        No suggestions yet — patients will see generic prompts.
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Input
                      className="flex-1 text-xs"
                      placeholder="e.g. Itchy red patches spreading on my elbows for a week"
                      value={newQuestion}
                      onChange={(e) => setNewQuestion(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addQuestion();
                        }
                      }}
                    />
                    <Button
                      isIconOnly
                      aria-label="Add question"
                      isDisabled={!newQuestion.trim() || formQuestions.length >= 12}
                      size="sm"
                      variant="secondary"
                      onPress={addQuestion}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Attach doctors */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold text-text-secondary">
                      Attached doctor agents ({formDoctorIds.length}) — a trained attachment also makes the model LIVE
                    </Label>
                    <button
                      className="cursor-pointer text-[11px] font-semibold text-primary hover:underline"
                      type="button"
                      onClick={() => setShowAllDoctors((v) => !v)}
                    >
                      {showAllDoctors ? "Show matching specialty only" : "Show all doctors"}
                    </button>
                  </div>

                  <div className="flex max-h-52 flex-col gap-1.5 overflow-y-auto pr-1">
                    {modalDoctors.length === 0 ? (
                      <span className="px-1 py-2 text-[11px] text-text-secondary">
                        No doctors found for this specialty. Use &ldquo;Show all doctors&rdquo; to attach across
                        specialties.
                      </span>
                    ) : (
                      modalDoctors.map((doc) => {
                        const isAttached = formDoctorIds.includes(doc.id);

                        return (
                          <div
                            key={doc.id}
                            className={cn(
                              "flex items-center justify-between gap-2 rounded-xl border p-2.5 transition-colors",
                              isAttached
                                ? "border-primary/40 bg-primary/10"
                                : "border-border-custom bg-background-custom/40",
                            )}
                          >
                            <button
                              className="flex min-w-0 flex-1 cursor-pointer items-center gap-2.5 text-left"
                              type="button"
                              onClick={() => toggleDoctorAttach(doc.id)}
                            >
                              <span
                                className={cn(
                                  "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border",
                                  isAttached
                                    ? "border-primary bg-primary text-white"
                                    : "border-border-custom bg-surface",
                                )}
                              >
                                {isAttached && <Check className="h-3.5 w-3.5" />}
                              </span>
                              <span className="min-w-0">
                                <span className="block truncate text-xs font-semibold text-text-primary">
                                  {doc.name}
                                </span>
                                <span className="block truncate text-[10px] text-text-secondary">
                                  {doc.specialty}
                                  {doc.agentName ? ` · ${doc.agentName}` : ""}
                                </span>
                              </span>
                            </button>

                            <div className="flex shrink-0 items-center gap-1.5">
                              <Chip
                                className="text-[9px] font-mono font-bold uppercase"
                                color={doc.isTrained ? "success" : "default"}
                                variant="soft"
                              >
                                {doc.isTrained ? "Trained" : "Untrained"}
                              </Chip>
                              <Button
                                className="h-7 px-2 text-[10px] font-semibold"
                                size="sm"
                                variant="secondary"
                                onPress={() => openDoctorModal(doc)}
                              >
                                <Pencil className="mr-1 h-3 w-3" /> Training
                              </Button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Enabled toggle */}
                <button
                  className={cn(
                    "flex cursor-pointer items-center justify-between rounded-xl border p-3 text-left transition-colors",
                    formEnabled ? "border-emerald-500/30 bg-emerald-500/5" : "border-red-500/30 bg-red-500/5",
                  )}
                  type="button"
                  onClick={() => setFormEnabled((v) => !v)}
                >
                  <span className="flex items-center gap-2 text-xs font-semibold text-text-primary">
                    <Power className={cn("h-4 w-4", formEnabled ? "text-emerald-500" : "text-red-500")} />
                    {formEnabled ? "Model enabled for patients" : "Model disabled — hidden from live use"}
                  </span>
                  <Chip
                    className="text-[9px] font-mono font-bold uppercase"
                    color={formEnabled ? "success" : "danger"}
                    variant="soft"
                  >
                    {formEnabled ? "On" : "Off"}
                  </Chip>
                </button>
              </Modal.Body>

              <Modal.Footer className="flex items-center justify-end gap-3 border-t border-border-custom pt-4">
                <Button size="sm" variant="secondary" onPress={() => setEditingAgent(null)}>
                  Cancel
                </Button>
                <Button isDisabled={saving} size="sm" variant="primary" onPress={saveAgent}>
                  {saving ? "Saving…" : "Save model"}
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Backdrop>
        </Modal.Root>
      )}

      {/* Doctor training modal */}
      {editingDoctor && (
        <Modal.Root isOpen={!!editingDoctor} onOpenChange={() => setEditingDoctor(null)}>
          <Modal.Backdrop className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md outline-none animate-in fade-in">
            <Modal.Dialog className="pointer-events-auto flex h-fit max-h-[90vh] w-full max-w-xl flex-col gap-4 overflow-y-auto rounded-2xl border border-border-custom bg-surface p-6 shadow-2xl outline-none">
              <Modal.Header className="flex items-center justify-between border-b border-border-custom pb-3">
                <h3 className="flex items-center gap-2 text-sm font-bold text-text-primary">
                  <Stethoscope className="h-4 w-4 text-primary" /> Train {editingDoctor.name}&rsquo;s agent
                  <Chip className="font-mono text-[9px] uppercase" variant="soft">
                    {editingDoctor.specialty}
                  </Chip>
                </h3>
                <Modal.CloseTrigger className="p-1 text-text-secondary hover:text-text-primary">
                  <X className="h-4 w-4" />
                </Modal.CloseTrigger>
              </Modal.Header>

              <Modal.Body className="flex flex-col gap-4 py-2 text-xs text-text-primary">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs font-semibold text-text-secondary">Agent name</Label>
                    <Input
                      placeholder={`Dr. ${editingDoctor.name}'s Specialty Agent`}
                      value={docAgentName}
                      onChange={(e) => setDocAgentName(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs font-semibold text-text-secondary">Agent tone</Label>
                    <Input
                      placeholder="Empathetic & Clinical"
                      value={docAgentTone}
                      onChange={(e) => setDocAgentTone(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-semibold text-text-secondary">
                    Emergency red flags (one per line)
                  </Label>
                  <TextArea
                    className="min-h-20 text-xs"
                    placeholder={"Chest pain radiating to arm\nSudden vision loss"}
                    value={docRedFlags}
                    onChange={(e) => setDocRedFlags(e.target.value)}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-semibold text-text-secondary">Intake protocols</Label>
                  <TextArea
                    className="min-h-20 text-xs"
                    placeholder="Structured questions and assessment flow the agent must follow…"
                    value={docIntake}
                    onChange={(e) => setDocIntake(e.target.value)}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-semibold text-text-secondary">Practice boundaries</Label>
                  <TextArea
                    className="min-h-20 text-xs"
                    placeholder="What the agent must never advise or prescribe…"
                    value={docBoundaries}
                    onChange={(e) => setDocBoundaries(e.target.value)}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-semibold text-text-secondary">Triage advice rules</Label>
                  <TextArea
                    className="min-h-20 text-xs"
                    placeholder="Rules for severity grading and referral thresholds…"
                    value={docTriageRules}
                    onChange={(e) => setDocTriageRules(e.target.value)}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-semibold text-text-secondary">Custom disclaimer</Label>
                  <Input
                    placeholder="AI advisory only. Seek immediate ER care for emergencies."
                    value={docDisclaimer}
                    onChange={(e) => setDocDisclaimer(e.target.value)}
                  />
                </div>
              </Modal.Body>

              <Modal.Footer className="flex items-center justify-end gap-3 border-t border-border-custom pt-4">
                <Button size="sm" variant="secondary" onPress={() => setEditingDoctor(null)}>
                  Cancel
                </Button>
                <Button isDisabled={saving} size="sm" variant="primary" onPress={saveDoctorTraining}>
                  {saving ? "Saving…" : "Save & mark trained"}
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Backdrop>
        </Modal.Root>
      )}
    </div>
  );
}
