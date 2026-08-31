"use client";

import { Button, Chip, Input, Label, ListBox, Modal, Select, Tooltip } from "@heroui/react";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  ArrowUp,
  Baby,
  Bone,
  Bot,
  Brain,
  Check,
  Copy,
  Ear,
  Eye,
  FileText,
  HeartHandshake,
  HeartPulse,
  History,
  MapPin,
  Navigation,
  Plus,
  SlidersHorizontal,
  Sparkles,
  Stethoscope,
  Wind,
  X,
} from "lucide-react";
import NextLink from "next/link";
import { useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";

import type { ChatMessage } from "./patient-context";
import { usePatientContext } from "./patient-context";

import { ChatEmptyState } from "@/components/patient/chatbot/chat-empty-state";
import { ClarificationCard } from "@/components/patient/chatbot/clarification-card";
import { getSeverityColor, TriageCard } from "@/components/patient/chatbot/triage-card";
import {
  ChatContainerContent,
  ChatContainerRoot,
  ChatContainerScrollAnchor,
} from "@/components/prompt-kit/chat-container";
import { DotsLoader } from "@/components/prompt-kit/loader";
import { Message, MessageAction, MessageActions, MessageContent } from "@/components/prompt-kit/message";
import { PromptInput, PromptInputAction, PromptInputActions, PromptInputTextarea } from "@/components/prompt-kit/prompt-input";
import { ScrollButton } from "@/components/prompt-kit/scroll-button";
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

const FALLBACK_AGENT = {
  specialty: "GENERAL",
  displayName: "General AI Triage",
  description: "Systemic symptoms, fever, intake assessment",
  isEnabled: true,
  isTrained: true,
  suggestedQuestions: [] as string[],
  attachedDoctorCount: 0,
};

export function PatientChatbot() {
  const {
    messages,
    agents,
    activeAgent,
    activeAgentSpecialty,
    duration,
    preExistingConditions,
    currentMedicines,
    treatmentApproach,
    isLoading,
    conversationId,
    historySessions,
    pendingClarificationMsg,
    userCoordinates,
    locationName,
    searchRadiusKm,
    isLocating,
    setAgentSpecialty,
    setDuration,
    setPreExistingConditions,
    setCurrentMedicines,
    setTreatmentApproach,
    setLocationName,
    setSearchRadiusKm,
    requestDeviceLocation,
    sendMessage,
    submitClarificationAnswers,
    resetChat,
    fetchHistorySessions,
    loadHistorySession,
  } = usePatientContext();

  const searchParams = useSearchParams();
  const sessionParam = searchParams.get("session");

  const [inputPrompt, setInputPrompt] = useState<string>("");
  const [isIntakeOpen, setIsIntakeOpen] = useState<boolean>(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  useEffect(() => {
    if (sessionParam) {
      loadHistorySession(sessionParam);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionParam]);

  const handleSend = () => {
    if (!inputPrompt.trim() || isLoading || !isModelAvailable) return;
    const text = inputPrompt;

    setInputPrompt("");
    sendMessage(text);
  };

  const handleCopy = async (msg: ChatMessage) => {
    try {
      await navigator.clipboard.writeText(msg.content);
      setCopiedMessageId(msg.id);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };

  const agentOptions = agents.length > 0 ? agents : [FALLBACK_AGENT];
  const currentAgent = activeAgent ?? agentOptions.find((a) => a.specialty === activeAgentSpecialty) ?? agentOptions[0];
  const isModelAvailable = currentAgent.isEnabled && currentAgent.isTrained;
  const ActiveIcon = AGENT_ICONS[currentAgent.specialty] ?? Stethoscope;
  const showEmptyState = !messages.some((m) => m.role === "user");

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-background-custom">
      {/* Sub-header: agent picker + session actions */}
      <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-border-custom bg-surface/60 px-3 backdrop-blur-lg sm:px-4">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
            <ActiveIcon className="h-4 w-4" />
          </div>
          <Select
            aria-label="Select AI specialist model"
            className="w-48 sm:w-56"
            selectedKey={currentAgent.specialty}
            onSelectionChange={(key: React.Key | null) => {
              if (key) setAgentSpecialty(String(key));
            }}
          >
            <Select.Trigger className="h-9 w-full border-0 bg-transparent text-xs font-semibold shadow-none">
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover className="min-w-64">
              <ListBox>
                {agentOptions.map((agent) => {
                  const AgentIcon = AGENT_ICONS[agent.specialty] ?? Stethoscope;
                  const isAvailable = agent.isEnabled && agent.isTrained;

                  return (
                    <ListBox.Item
                      key={agent.specialty}
                      id={agent.specialty}
                      isDisabled={!isAvailable}
                      textValue={agent.displayName}
                    >
                      <Label className="flex w-full items-center gap-2 text-xs">
                        <AgentIcon className={cn("h-3.5 w-3.5 shrink-0", isAvailable ? "text-primary" : "text-text-secondary")} />
                        <span className="truncate">{agent.displayName}</span>
                        {isAvailable ? (
                          <span aria-hidden className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                        ) : (
                          <Chip className="ml-auto shrink-0 text-[9px] font-mono font-bold uppercase" size="sm" variant="soft">
                            Soon
                          </Chip>
                        )}
                      </Label>
                    </ListBox.Item>
                  );
                })}
              </ListBox>
            </Select.Popover>
          </Select>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <Tooltip delay={100}>
            <Tooltip.Trigger>
              <Button
                aria-label="Current location and search radius"
                className="hidden rounded-full text-xs font-medium sm:flex"
                size="sm"
                variant={userCoordinates ? "primary" : "secondary"}
                onPress={requestDeviceLocation}
              >
                <MapPin className={cn("h-3.5 w-3.5", isLocating && "animate-spin")} />
                <span className="max-w-28 truncate">
                  {userCoordinates ? locationName || "GPS Active" : "Set Location"}
                </span>
                <Chip className="ml-0.5 text-[9px] font-mono" size="sm" variant="soft">
                  {searchRadiusKm}km
                </Chip>
              </Button>
            </Tooltip.Trigger>
            <Tooltip.Content className="px-2 py-1 text-xs" placement="bottom">
              {userCoordinates ? `Searching within ${searchRadiusKm} km of ${locationName}` : "Click to detect your device GPS location"}
            </Tooltip.Content>
          </Tooltip>

          <Tooltip delay={100}>
            <Tooltip.Trigger>
              <Button
                isIconOnly
                aria-label="Past sessions"
                className="rounded-full"
                size="sm"
                variant="secondary"
                onPress={() => {
                  fetchHistorySessions();
                  setIsHistoryOpen(true);
                }}
              >
                <History className="h-4 w-4" />
              </Button>
            </Tooltip.Trigger>
            <Tooltip.Content className="px-2 py-1 text-xs" placement="bottom">
              Past sessions ({historySessions.length})
            </Tooltip.Content>
          </Tooltip>

          <Tooltip delay={100}>
            <Tooltip.Trigger>
              <Button
                isIconOnly
                aria-label="Intake settings"
                className="rounded-full"
                size="sm"
                variant="secondary"
                onPress={() => setIsIntakeOpen(true)}
              >
                <SlidersHorizontal className="h-4 w-4" />
              </Button>
            </Tooltip.Trigger>
            <Tooltip.Content className="px-2 py-1 text-xs" placement="bottom">
              Intake settings
            </Tooltip.Content>
          </Tooltip>

          <Tooltip delay={100}>
            <Tooltip.Trigger>
              <Button
                isIconOnly
                aria-label="New chat"
                className="rounded-full"
                size="sm"
                variant="secondary"
                onPress={resetChat}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </Tooltip.Trigger>
            <Tooltip.Content className="px-2 py-1 text-xs" placement="bottom">
              New chat
            </Tooltip.Content>
          </Tooltip>
        </div>
      </header>

      {/* Conversation stream */}
      <div className="relative flex-1 overflow-hidden">
        {showEmptyState ? (
          <div className="flex h-full flex-col items-center justify-center">
            <ChatEmptyState
              agentName={currentAgent.displayName}
              isModelAvailable={isModelAvailable}
              suggestions={currentAgent.suggestedQuestions}
              onPromptSelect={(prompt) => {
                if (!isLoading && isModelAvailable) sendMessage(prompt);
              }}
            />
          </div>
        ) : (
          <ChatContainerRoot className="h-full w-full">
            <ChatContainerContent className="mx-auto w-full max-w-3xl gap-7 px-4 py-8 sm:px-6">
              {messages.map((msg, index) => {
                const isAssistant = msg.role === "assistant";
                const isLastMessage = index === messages.length - 1;

                return (
                  <Message key={msg.id} className={cn("w-full flex-col gap-1.5", isAssistant ? "items-start" : "items-end")}>
                    {isAssistant ? (
                      <div className="group flex w-full flex-col gap-2.5">
                        <MessageContent markdown className="w-full rounded-none bg-transparent p-0 text-text-primary">
                          {msg.content}
                        </MessageContent>

                        {msg.responseType === "CLARIFICATION_NEEDED" && (msg.clarificationQuestions?.length ?? 0) > 0 && (
                          <ClarificationCard
                            isActive={pendingClarificationMsg?.id === msg.id}
                            isLoading={isLoading}
                            questions={msg.clarificationQuestions!}
                            onSubmit={submitClarificationAnswers}
                          />
                        )}

                        {msg.triageResult && (
                          <TriageCard
                            doctors={msg.recommendedDoctors}
                            labs={msg.recommendedLabs}
                            pharmacies={msg.recommendedPharmacies}
                            triage={msg.triageResult}
                          />
                        )}

                        <MessageActions
                          className={cn(
                            "-ml-1 gap-1.5 opacity-0 transition-opacity duration-150 group-hover:opacity-100",
                            isLastMessage && !isLoading && "opacity-100",
                          )}
                        >
                          <MessageAction tooltip={copiedMessageId === msg.id ? "Copied" : "Copy"}>
                            <Button
                              isIconOnly
                              aria-label="Copy message"
                              className="h-7 w-7 min-w-7 rounded-full border-0 bg-transparent text-text-secondary hover:bg-secondary"
                              size="sm"
                              variant="secondary"
                              onPress={() => handleCopy(msg)}
                            >
                              {copiedMessageId === msg.id ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                            </Button>
                          </MessageAction>
                          <span className="text-[10px] font-mono text-text-secondary">{msg.timestamp}</span>
                        </MessageActions>
                      </div>
                    ) : (
                      <MessageContent className="max-w-[85%] rounded-3xl rounded-br-lg border border-primary/15 bg-primary/10 px-4 py-2.5 text-text-primary sm:max-w-[75%]">
                        {msg.content}
                      </MessageContent>
                    )}
                  </Message>
                );
              })}

              {isLoading && (
                <div className="flex items-center gap-2.5 text-xs text-text-secondary">
                  <DotsLoader />
                  <span className="animate-pulse">Analyzing symptoms &amp; building clinical triage…</span>
                </div>
              )}

              <ChatContainerScrollAnchor />
            </ChatContainerContent>

            <div className="absolute right-4 bottom-3 z-10">
              <ScrollButton />
            </div>
          </ChatContainerRoot>
        )}
      </div>

      {/* Input dock */}
      <div className="shrink-0 px-3 pt-1 pb-3 sm:px-4 sm:pb-4">
        <div className="mx-auto w-full max-w-3xl">
          <PromptInput
            className="w-full rounded-3xl border-border-custom bg-surface p-2 pt-1 shadow-sm"
            disabled={!isModelAvailable}
            isLoading={isLoading}
            value={inputPrompt}
            onSubmit={handleSend}
            onValueChange={setInputPrompt}
          >
            <div className="flex flex-col">
              <PromptInputTextarea
                className="min-h-[44px] pt-3 pl-2.5 text-sm"
                placeholder={
                  isModelAvailable
                    ? "Describe your symptoms (e.g. 'I've had a headache for 2 days')…"
                    : `${currentAgent.displayName} is coming soon — switch to an available model to chat`
                }
              />

              <PromptInputActions className="flex w-full items-center justify-between gap-2 pt-1.5">
                <PromptInputAction tooltip="Intake settings — duration, conditions, medications">
                  <Button
                    className="h-8 rounded-full border border-border-custom bg-transparent px-3 text-[11px] font-medium text-text-secondary"
                    size="sm"
                    variant="secondary"
                    onPress={() => setIsIntakeOpen(true)}
                  >
                    <SlidersHorizontal className="mr-1.5 h-3.5 w-3.5 text-primary" />
                    {duration} · {treatmentApproach}
                  </Button>
                </PromptInputAction>

                <PromptInputAction tooltip={isLoading ? "Analyzing…" : "Send message"}>
                  <Button
                    isIconOnly
                    aria-label="Send message"
                    className="h-9 w-9 min-w-9 rounded-full"
                    isDisabled={!inputPrompt.trim() || isLoading || !isModelAvailable}
                    size="sm"
                    variant="primary"
                    onPress={handleSend}
                  >
                    {isLoading ? (
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    ) : (
                      <ArrowUp className="h-4 w-4" />
                    )}
                  </Button>
                </PromptInputAction>
              </PromptInputActions>
            </div>
          </PromptInput>

          <p className="pt-2 text-center text-[10px] text-text-secondary">
            Medicio AI guidance is advisory and does not replace professional clinical diagnosis.
          </p>
        </div>
      </div>

      {/* Past sessions modal */}
      {isHistoryOpen && (
        <Modal.Root isOpen={isHistoryOpen} onOpenChange={() => setIsHistoryOpen(false)}>
          <Modal.Backdrop className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md outline-none animate-in fade-in">
            <Modal.Dialog className="pointer-events-auto flex h-fit max-h-[90vh] w-full max-w-md flex-col gap-4 overflow-y-auto rounded-2xl border border-border-custom bg-surface p-6 shadow-2xl outline-none">
              <Modal.Header className="flex items-center justify-between border-b border-border-custom pb-3">
                <h3 className="flex items-center gap-2 text-sm font-bold text-text-primary">
                  <History className="h-4 w-4 text-primary" /> Past triage sessions
                </h3>
                <Modal.CloseTrigger className="p-1 text-text-secondary hover:text-text-primary">
                  <X className="h-4 w-4" />
                </Modal.CloseTrigger>
              </Modal.Header>

              <Modal.Body className="flex flex-col gap-2.5 py-2 text-xs text-text-primary">
                {historySessions.length === 0 ? (
                  <div className="p-6 text-center text-xs text-text-secondary">
                    No past sessions found. Start a new triage conversation!
                  </div>
                ) : (
                  historySessions.map((session) => {
                    const dateStr = new Date(session.createdAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    });
                    const isActive = conversationId === session.id;

                    return (
                      <button
                        key={session.id}
                        className={cn(
                          "flex cursor-pointer items-center justify-between gap-3 rounded-xl border p-3 text-left transition-colors",
                          isActive
                            ? "border-primary/40 bg-primary/10 text-text-primary"
                            : "border-border-custom bg-background-custom/50 hover:border-primary/40",
                        )}
                        type="button"
                        onClick={() => {
                          loadHistorySession(session.id);
                          setIsHistoryOpen(false);
                        }}
                      >
                        <div className="flex max-w-[75%] flex-col gap-1">
                          <span className="truncate text-xs font-bold text-text-primary">
                            {session.title || session.symptomPrompt}
                          </span>
                          <span className="truncate text-[11px] text-text-secondary">
                            {session.suggestedSpecialty} · <span className="font-mono">{dateStr}</span>
                          </span>
                        </div>
                        <Chip
                          className="text-[9px] font-mono font-bold"
                          color={getSeverityColor(session.severityLevel)}
                          variant="soft"
                        >
                          {session.severityLevel}
                        </Chip>
                      </button>
                    );
                  })
                )}
              </Modal.Body>

              <Modal.Footer className="flex items-center justify-between border-t border-border-custom pt-4">
                <NextLink href="/ai-records">
                  <Button className="text-xs font-semibold" size="sm" variant="secondary">
                    <FileText className="mr-1 h-3.5 w-3.5 text-primary" /> View all records
                  </Button>
                </NextLink>
                <Button
                  size="sm"
                  variant="primary"
                  onPress={() => {
                    resetChat();
                    setIsHistoryOpen(false);
                  }}
                >
                  Start new session
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Backdrop>
        </Modal.Root>
      )}

      {/* Intake parameters modal */}
      {isIntakeOpen && (
        <Modal.Root isOpen={isIntakeOpen} onOpenChange={() => setIsIntakeOpen(false)}>
          <Modal.Backdrop className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md outline-none animate-in fade-in">
            <Modal.Dialog className="pointer-events-auto flex h-fit max-h-[90vh] w-full max-w-md flex-col gap-4 overflow-y-auto rounded-2xl border border-border-custom bg-surface p-6 shadow-2xl outline-none">
              <Modal.Header className="flex items-center justify-between border-b border-border-custom pb-3">
                <h3 className="flex items-center gap-2 text-sm font-bold text-text-primary">
                  <SlidersHorizontal className="h-4 w-4 text-primary" /> Patient intake parameters
                </h3>
                <Modal.CloseTrigger className="p-1 text-text-secondary hover:text-text-primary">
                  <X className="h-4 w-4" />
                </Modal.CloseTrigger>
              </Modal.Header>

              <Modal.Body className="flex flex-col gap-4 py-2 text-xs text-text-primary">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-semibold text-text-secondary">Symptom duration</Label>
                  <Select
                    aria-label="Symptom duration"
                    className="w-full"
                    selectedKey={duration}
                    onSelectionChange={(key: React.Key | null) => {
                      if (key) setDuration(String(key));
                    }}
                  >
                    <Select.Trigger className="w-full">
                      <Select.Value />
                      <Select.Indicator />
                    </Select.Trigger>
                    <Select.Popover>
                      <ListBox>
                        {["Less than 24 hours", "1-3 days", "1 week", "More than 2 weeks"].map((opt) => (
                          <ListBox.Item key={opt} id={opt} textValue={opt}>
                            <Label>{opt}</Label>
                          </ListBox.Item>
                        ))}
                      </ListBox>
                    </Select.Popover>
                  </Select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-semibold text-text-secondary">Major pre-existing conditions</Label>
                  <Input
                    placeholder="e.g. Diabetes, Hypertension, Asthma"
                    value={preExistingConditions}
                    onChange={(e) => setPreExistingConditions(e.target.value)}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-semibold text-text-secondary">Current active medications</Label>
                  <Input
                    placeholder="e.g. Paracetamol, Metformin 500mg"
                    value={currentMedicines}
                    onChange={(e) => setCurrentMedicines(e.target.value)}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-semibold text-text-secondary">Preferred treatment approach</Label>
                  <Select
                    aria-label="Preferred treatment approach"
                    className="w-full"
                    selectedKey={treatmentApproach}
                    onSelectionChange={(key: React.Key | null) => {
                      if (key) setTreatmentApproach(String(key));
                    }}
                  >
                    <Select.Trigger className="w-full">
                      <Select.Value />
                      <Select.Indicator />
                    </Select.Trigger>
                    <Select.Popover>
                      <ListBox>
                        <ListBox.Item id="Allopathic" textValue="Allopathic / Conventional">
                          <Label>Allopathic / Conventional</Label>
                        </ListBox.Item>
                        <ListBox.Item id="Homeopathic" textValue="Homeopathic">
                          <Label>Homeopathic</Label>
                        </ListBox.Item>
                        <ListBox.Item id="Tibb" textValue="Tibb / Traditional Greco-Arabic">
                          <Label>Tibb / Traditional Greco-Arabic</Label>
                        </ListBox.Item>
                      </ListBox>
                    </Select.Popover>
                  </Select>
                </div>

                <div className="flex flex-col gap-1.5 border-t border-border-custom pt-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold text-text-secondary">Location & Provider Radius</Label>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-7 text-[11px]"
                      onPress={requestDeviceLocation}
                    >
                      <Navigation className={cn("h-3 w-3 text-primary", isLocating && "animate-spin")} />
                      {isLocating ? "Locating..." : "Use Device GPS"}
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="City or Area (optional)"
                      value={locationName}
                      onChange={(e) => setLocationName(e.target.value)}
                    />
                    <Select
                      aria-label="Provider Search Radius"
                      selectedKey={String(searchRadiusKm)}
                      onSelectionChange={(key: React.Key | null) => {
                        if (key) setSearchRadiusKm(Number(key));
                      }}
                    >
                      <Select.Trigger className="w-full">
                        <Select.Value />
                        <Select.Indicator />
                      </Select.Trigger>
                      <Select.Popover>
                        <ListBox>
                          {[5, 10, 25, 50, 100].map((km) => (
                            <ListBox.Item key={km} id={String(km)} textValue={`${km} km Radius`}>
                              <Label>{km} km Radius</Label>
                            </ListBox.Item>
                          ))}
                        </ListBox>
                      </Select.Popover>
                    </Select>
                  </div>
                </div>
              </Modal.Body>

              <Modal.Footer className="flex items-center justify-end gap-3 border-t border-border-custom pt-4">
                <Button size="sm" variant="primary" onPress={() => setIsIntakeOpen(false)}>
                  Save intake parameters
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Backdrop>
        </Modal.Root>
      )}
    </div>
  );
}
