"use client";

import { Button, Chip, Dropdown, Separator, Tooltip } from "@heroui/react";
import {
  Activity,
  ArrowUp,
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
  Copy,
  HeartPulse,
  MapPin,
  Navigation,
  Plus,
  ShieldCheck,
  SlidersHorizontal,
  Wind,
  X,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";

import type { ChatMessage } from "./patient-context";
import { usePatientContext } from "./patient-context";

import { BookingCard } from "@/components/patient/chatbot/booking-card";
import { ChatEmptyState } from "@/components/patient/chatbot/chat-empty-state";
import { ClinicalAvatar } from "@/components/patient/chatbot/clinical-avatar";
import { TriageCard } from "@/components/patient/chatbot/triage-card";
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

const FALLBACK_AGENT = {
  specialty: "GENERAL",
  displayName: "General AI Triage",
  description: "Systemic symptoms, fever, intake assessment",
  isEnabled: true,
  isTrained: true,
  suggestedQuestions: [] as string[],
  attachedDoctorCount: 0,
};

const SPECIALTY_PLACEHOLDERS: Record<string, string> = {
  GENERAL: "Describe your symptoms (e.g. 'I've had a fever and sore throat for 2 days')…",
  DERMATOLOGY: "Describe skin or hair symptoms (e.g. 'Red itchy rash on my forearm for 3 days')…",
  CARDIOLOGY: "Describe cardiovascular symptoms (e.g. 'Palpitations and shortness of breath')…",
  NEUROLOGY: "Describe neurological symptoms (e.g. 'Throbbing headache with light sensitivity')…",
  PEDIATRICS: "Describe child symptoms (e.g. 'Toddler has a 101°F fever and ear pain')…",
  ORTHOPEDICS: "Describe joint or bone symptoms (e.g. 'Sharp right knee pain after running')…",
  GYNECOLOGY: "Describe reproductive health symptoms (e.g. 'Severe pelvic cramps and nausea')…",
  ENT: "Describe ear, nose, or throat symptoms (e.g. 'Sinus pressure, ear pain, and congestion')…",
  OPHTHALMOLOGY: "Describe eye or vision symptoms (e.g. 'Eye redness, burning, and blurry vision')…",
  PSYCHIATRY: "Describe emotional or mental health concerns (e.g. 'Persistent anxiety and insomnia')…",
  GASTROENTEROLOGY: "Describe digestive symptoms (e.g. 'Acid reflux and stomach pain after meals')…",
  PULMONOLOGY: "Describe respiratory symptoms (e.g. 'Persistent dry cough and wheezing')…",
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
    isIntakeAttached,
    setIsIntakeAttached,
    clearIntakeParameters,
    isLoading,
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
    resetChat,
    loadHistorySession,
  } = usePatientContext();

  const searchParams = useSearchParams();
  const sessionParam = searchParams.get("session");

  const [inputPrompt, setInputPrompt] = useState<string>("");
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  const handleIntakeSelect = (key: string) => {
    if (key.startsWith("dur_")) {
      setDuration(key.replace("dur_", ""));
      setIsIntakeAttached(true);
    } else if (key.startsWith("cond_")) {
      const val = key.replace("cond_", "");
      setPreExistingConditions(val === "None" ? "" : val);
      setIsIntakeAttached(true);
    } else if (key.startsWith("approach_")) {
      setTreatmentApproach(key.replace("approach_", ""));
      setIsIntakeAttached(true);
    } else if (key.startsWith("radius_")) {
      setSearchRadiusKm(Number(key.replace("radius_", "")));
      setIsIntakeAttached(true);
    } else if (key === "action_gps") {
      requestDeviceLocation();
      setIsIntakeAttached(true);
    } else if (key === "action_clear") {
      clearIntakeParameters();
    }
  };

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
  const showEmptyState = !messages.some((m) => m.role === "user");

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-background-custom">
      {/* Gemini-Style Fluid Ambient Aurora - Top Subheader */}
      <div className="gemini-top-aurora">
        <div className="aurora-top-node-1" />
        <div className="aurora-top-node-2" />
      </div>

      {/* Gemini-Style Fluid Ambient Aurora - Behind Chat Bar */}
      <div className="gemini-bottom-aurora">
        <div className="aurora-node-1" />
        <div className="aurora-node-2" />
        <div className="aurora-node-3" />
      </div>

      {/* Foreground Content with relative z-10 */}
      <div className="relative z-10 flex h-full w-full flex-col overflow-hidden">
        {/* Sleek Minimal Top Action Strip */}
        <div className="flex h-10 shrink-0 items-center justify-end px-3 pt-2 sm:px-5">
          <Tooltip delay={100}>
            <Tooltip.Trigger>
              <Button
                size="sm"
                variant="secondary"
                aria-label="Start new chat"
                className="h-7 rounded-full text-xs font-medium gap-1.5 px-2.5 shadow-2xs backdrop-blur-md bg-surface/70 hover:bg-surface border border-border-custom"
                onPress={resetChat}
              >
                <Plus className="h-3.5 w-3.5" />
                <span>New Chat</span>
              </Button>
            </Tooltip.Trigger>
            <Tooltip.Content className="px-2 py-1 text-xs" placement="bottom">
              Start a new session
            </Tooltip.Content>
          </Tooltip>
        </div>

        {/* Conversation stream */}
        <div className="relative flex-1 overflow-hidden">
          {showEmptyState ? (
            <div className="flex h-full flex-col items-center justify-center">
              <ChatEmptyState
                agentName={currentAgent.displayName}
                specialty={currentAgent.specialty}
                isModelAvailable={isModelAvailable}
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
                        <div className="group flex w-full flex-col gap-2">
                          {/* Assistant Avatar & Clinical Persona Header */}
                          <div className="flex items-center gap-2 mb-0.5">
                            <ClinicalAvatar
                              name={currentAgent.displayName}
                              specialty={currentAgent.specialty}
                              size={28}
                              isInteractive={true}
                              showStatus={isLastMessage}
                              isThinking={isLoading && isLastMessage}
                            />
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-semibold text-text-primary">{currentAgent.displayName}</span>
                              <span className="text-[10px] text-text-secondary font-mono">Clinical AI</span>
                            </div>
                          </div>
                          {msg.responseType === "API_KEY_REQUIRED" ? (
                            <div className="w-full rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-text-primary">
                              <MessageContent markdown className="w-full rounded-none bg-transparent p-0 text-text-primary">
                                {msg.content}
                              </MessageContent>
                            </div>
                          ) : (
                            <MessageContent markdown className="w-full rounded-none bg-transparent p-0 text-text-primary">
                              {msg.content}
                            </MessageContent>
                          )}

                          {msg.suggestedQuickReplies && msg.suggestedQuickReplies.length > 0 && isLastMessage && !isLoading && (
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {msg.suggestedQuickReplies.map((reply, rIdx) => (
                                <Button
                                  key={rIdx}
                                  className="h-auto rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary hover:bg-primary/20"
                                  size="sm"
                                  variant="secondary"
                                  onPress={() => sendMessage(reply)}
                                >
                                  {reply}
                                </Button>
                              ))}
                            </div>
                          )}

                          {msg.bookingResult && (
                            <BookingCard
                              booking={msg.bookingResult}
                              isAuthRequired={msg.responseType === "BOOKING_AUTH_REQUIRED"}
                              onConfirmBooking={(b) => {
                                sendMessage(
                                  `Confirm booking with Dr. ${b.doctorName} on ${b.dateTime}`,
                                );
                              }}
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
              className="w-full rounded-3xl border border-white/10 dark:border-white/10 bg-surface/75 dark:bg-[#181B20]/80 p-2.5 shadow-2xl backdrop-blur-2xl focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20 transition-all duration-200"
              disabled={!isModelAvailable}
              isLoading={isLoading}
              value={inputPrompt}
              onSubmit={handleSend}
              onValueChange={setInputPrompt}
            >
              <div className="flex flex-col">
                <PromptInputTextarea
                  className="min-h-[44px] pt-1 pl-2 text-sm"
                  placeholder={
                    isModelAvailable
                      ? SPECIALTY_PLACEHOLDERS[currentAgent.specialty] || "Describe your symptoms (e.g. 'I've had a headache for 2 days')…"
                      : `${currentAgent.displayName} is coming soon — switch to an available model to chat`
                  }
                />

                <PromptInputActions className="flex w-full items-center justify-between gap-2 pt-2">
                  {/* Left: Plus dropdown to select intake parameters (Gemini tools menu style) + attached tag */}
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Dropdown>
                      <Dropdown.Trigger>
                        <Button
                          isIconOnly
                          aria-label="Clinical intake options"
                          className="h-8 w-8 min-w-8 rounded-full border border-border-custom bg-surface hover:bg-secondary text-text-secondary hover:text-text-primary shadow-2xs"
                          size="sm"
                          variant="secondary"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </Dropdown.Trigger>
                      <Dropdown.Popover className="min-w-64 rounded-2xl border border-border-custom bg-surface/95 p-1.5 shadow-2xl backdrop-blur-2xl" placement="top start">
                        <Dropdown.Menu
                          aria-label="Clinical intake parameters"
                          onAction={(key) => handleIntakeSelect(String(key))}
                        >
                          {/* Submenu 1: Symptom Duration */}
                          <Dropdown.SubmenuTrigger>
                            <Dropdown.Item id="sub_duration" textValue="Symptom Duration">
                              <div className="flex w-full items-center gap-2 text-xs">
                                <Clock className="h-3.5 w-3.5 text-primary shrink-0" />
                                <span className="font-medium">Symptom Duration</span>
                                {duration && isIntakeAttached && (
                                  <span className="ml-auto max-w-20 truncate text-[10px] text-primary font-mono">{duration}</span>
                                )}
                                <ChevronRight className="ml-auto h-3.5 w-3.5 text-text-secondary shrink-0 opacity-70" />
                              </div>
                            </Dropdown.Item>
                            <Dropdown.Popover className="min-w-60 rounded-2xl border border-border-custom bg-surface/95 p-1.5 shadow-2xl backdrop-blur-2xl">
                              <Dropdown.Menu onAction={(key) => handleIntakeSelect(String(key))}>
                                <Dropdown.Item id="dur_Less than 24 hours" textValue="Less than 24 hours">
                                  <div className="flex w-full items-center gap-2 text-xs">
                                    <Clock className="h-3.5 w-3.5 text-primary shrink-0" />
                                    <span>Less than 24 hours (Acute)</span>
                                    {duration === "Less than 24 hours" && isIntakeAttached && (
                                      <Check className="ml-auto h-3.5 w-3.5 text-primary shrink-0" />
                                    )}
                                  </div>
                                </Dropdown.Item>
                                <Dropdown.Item id="dur_1-3 days" textValue="1 - 3 days">
                                  <div className="flex w-full items-center gap-2 text-xs">
                                    <Clock className="h-3.5 w-3.5 text-primary shrink-0" />
                                    <span>1 – 3 days (Recent)</span>
                                    {duration === "1-3 days" && isIntakeAttached && (
                                      <Check className="ml-auto h-3.5 w-3.5 text-primary shrink-0" />
                                    )}
                                  </div>
                                </Dropdown.Item>
                                <Dropdown.Item id="dur_1-2 weeks" textValue="1 - 2 weeks">
                                  <div className="flex w-full items-center gap-2 text-xs">
                                    <Clock className="h-3.5 w-3.5 text-primary shrink-0" />
                                    <span>1 – 2 weeks (Persistent)</span>
                                    {duration === "1-2 weeks" && isIntakeAttached && (
                                      <Check className="ml-auto h-3.5 w-3.5 text-primary shrink-0" />
                                    )}
                                  </div>
                                </Dropdown.Item>
                                <Dropdown.Item id="dur_More than 1 month" textValue="More than 1 month">
                                  <div className="flex w-full items-center gap-2 text-xs">
                                    <Clock className="h-3.5 w-3.5 text-primary shrink-0" />
                                    <span>More than 1 month (Chronic)</span>
                                    {duration === "More than 1 month" && isIntakeAttached && (
                                      <Check className="ml-auto h-3.5 w-3.5 text-primary shrink-0" />
                                    )}
                                  </div>
                                </Dropdown.Item>
                              </Dropdown.Menu>
                            </Dropdown.Popover>
                          </Dropdown.SubmenuTrigger>

                          {/* Submenu 2: Medical Background */}
                          <Dropdown.SubmenuTrigger>
                            <Dropdown.Item id="sub_conditions" textValue="Medical Background">
                              <div className="flex w-full items-center gap-2 text-xs">
                                <HeartPulse className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                                <span className="font-medium">Medical Background</span>
                                {preExistingConditions && isIntakeAttached && (
                                  <span className="ml-auto max-w-20 truncate text-[10px] text-primary font-mono">{preExistingConditions}</span>
                                )}
                                <ChevronRight className="ml-auto h-3.5 w-3.5 text-text-secondary shrink-0 opacity-70" />
                              </div>
                            </Dropdown.Item>
                            <Dropdown.Popover className="min-w-64 rounded-2xl border border-border-custom bg-surface/95 p-1.5 shadow-2xl backdrop-blur-2xl">
                              <Dropdown.Menu onAction={(key) => handleIntakeSelect(String(key))}>
                                <Dropdown.Item id="cond_Cardiovascular / High BP" textValue="Cardiovascular / High BP">
                                  <div className="flex w-full items-center gap-2 text-xs">
                                    <HeartPulse className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                                    <span>Cardiovascular / High BP</span>
                                    {preExistingConditions.includes("Cardiovascular") && isIntakeAttached && (
                                      <Check className="ml-auto h-3.5 w-3.5 text-primary shrink-0" />
                                    )}
                                  </div>
                                </Dropdown.Item>
                                <Dropdown.Item id="cond_Diabetes / Metabolic" textValue="Diabetes / Metabolic">
                                  <div className="flex w-full items-center gap-2 text-xs">
                                    <Activity className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                                    <span>Diabetes / Metabolic</span>
                                    {preExistingConditions.includes("Diabetes") && isIntakeAttached && (
                                      <Check className="ml-auto h-3.5 w-3.5 text-primary shrink-0" />
                                    )}
                                  </div>
                                </Dropdown.Item>
                                <Dropdown.Item id="cond_Asthma / Respiratory" textValue="Asthma / Respiratory">
                                  <div className="flex w-full items-center gap-2 text-xs">
                                    <Wind className="h-3.5 w-3.5 text-sky-500 shrink-0" />
                                    <span>Asthma / Respiratory</span>
                                    {preExistingConditions.includes("Asthma") && isIntakeAttached && (
                                      <Check className="ml-auto h-3.5 w-3.5 text-primary shrink-0" />
                                    )}
                                  </div>
                                </Dropdown.Item>
                                <Dropdown.Item id="cond_None" textValue="No Chronic Illnesses">
                                  <div className="flex w-full items-center gap-2 text-xs">
                                    <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                                    <span>No Chronic Conditions</span>
                                    {preExistingConditions === "" && isIntakeAttached && (
                                      <Check className="ml-auto h-3.5 w-3.5 text-primary shrink-0" />
                                    )}
                                  </div>
                                </Dropdown.Item>
                              </Dropdown.Menu>
                            </Dropdown.Popover>
                          </Dropdown.SubmenuTrigger>

                          {/* Submenu 3: Treatment Approach */}
                          <Dropdown.SubmenuTrigger>
                            <Dropdown.Item id="sub_approach" textValue="Treatment Approach">
                              <div className="flex w-full items-center gap-2 text-xs">
                                <ShieldCheck className="h-3.5 w-3.5 text-teal-500 shrink-0" />
                                <span className="font-medium">Treatment Approach</span>
                                {treatmentApproach && isIntakeAttached && (
                                  <span className="ml-auto max-w-20 truncate text-[10px] text-primary font-mono">{treatmentApproach}</span>
                                )}
                                <ChevronRight className="ml-auto h-3.5 w-3.5 text-text-secondary shrink-0 opacity-70" />
                              </div>
                            </Dropdown.Item>
                            <Dropdown.Popover className="min-w-60 rounded-2xl border border-border-custom bg-surface/95 p-1.5 shadow-2xl backdrop-blur-2xl">
                              <Dropdown.Menu onAction={(key) => handleIntakeSelect(String(key))}>
                                <Dropdown.Item id="approach_Allopathic" textValue="Allopathic Conventional">
                                  <div className="flex w-full items-center gap-2 text-xs">
                                    <ShieldCheck className="h-3.5 w-3.5 text-teal-500 shrink-0" />
                                    <span>Allopathic (Conventional)</span>
                                    {treatmentApproach === "Allopathic" && isIntakeAttached && (
                                      <Check className="ml-auto h-3.5 w-3.5 text-primary shrink-0" />
                                    )}
                                  </div>
                                </Dropdown.Item>
                                <Dropdown.Item id="approach_Homeopathic" textValue="Homeopathic Natural">
                                  <div className="flex w-full items-center gap-2 text-xs">
                                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                                    <span>Homeopathic (Natural)</span>
                                    {treatmentApproach === "Homeopathic" && isIntakeAttached && (
                                      <Check className="ml-auto h-3.5 w-3.5 text-primary shrink-0" />
                                    )}
                                  </div>
                                </Dropdown.Item>
                                <Dropdown.Item id="approach_Tibb" textValue="Tibb Greco-Arabic">
                                  <div className="flex w-full items-center gap-2 text-xs">
                                    <ShieldCheck className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                                    <span>Tibb (Greco-Arabic)</span>
                                    {treatmentApproach === "Tibb" && isIntakeAttached && (
                                      <Check className="ml-auto h-3.5 w-3.5 text-primary shrink-0" />
                                    )}
                                  </div>
                                </Dropdown.Item>
                              </Dropdown.Menu>
                            </Dropdown.Popover>
                          </Dropdown.SubmenuTrigger>

                          {/* Submenu 4: Provider Search Radius & GPS */}
                          <Dropdown.SubmenuTrigger>
                            <Dropdown.Item id="sub_radius" textValue="Provider Location & Radius">
                              <div className="flex w-full items-center gap-2 text-xs">
                                <MapPin className="h-3.5 w-3.5 text-text-secondary shrink-0" />
                                <span className="font-medium">Provider Radius</span>
                                <span className="ml-auto max-w-16 truncate text-[10px] text-text-secondary font-mono">{searchRadiusKm} km</span>
                                <ChevronRight className="ml-auto h-3.5 w-3.5 text-text-secondary shrink-0 opacity-70" />
                              </div>
                            </Dropdown.Item>
                            <Dropdown.Popover className="min-w-60 rounded-2xl border border-border-custom bg-surface/95 p-1.5 shadow-2xl backdrop-blur-2xl">
                              <Dropdown.Menu onAction={(key) => handleIntakeSelect(String(key))}>
                                <Dropdown.Item id="action_gps" textValue="Detect Device GPS">
                                  <div className="flex w-full items-center gap-2 text-xs">
                                    <Navigation className={cn("h-3.5 w-3.5 text-primary shrink-0", isLocating && "animate-spin")} />
                                    <span>{isLocating ? "Locating..." : locationName ? `Location: ${locationName}` : "Detect Device GPS"}</span>
                                  </div>
                                </Dropdown.Item>
                                <Dropdown.Item id="radius_10" textValue="10 km Radius">
                                  <div className="flex w-full items-center gap-2 text-xs">
                                    <MapPin className="h-3.5 w-3.5 text-text-secondary shrink-0" />
                                    <span>Provider Radius: 10 km</span>
                                    {searchRadiusKm === 10 && <Check className="ml-auto h-3.5 w-3.5 text-primary shrink-0" />}
                                  </div>
                                </Dropdown.Item>
                                <Dropdown.Item id="radius_25" textValue="25 km Radius">
                                  <div className="flex w-full items-center gap-2 text-xs">
                                    <MapPin className="h-3.5 w-3.5 text-text-secondary shrink-0" />
                                    <span>Provider Radius: 25 km</span>
                                    {searchRadiusKm === 25 && <Check className="ml-auto h-3.5 w-3.5 text-primary shrink-0" />}
                                  </div>
                                </Dropdown.Item>
                                <Dropdown.Item id="radius_50" textValue="50 km Radius">
                                  <div className="flex w-full items-center gap-2 text-xs">
                                    <MapPin className="h-3.5 w-3.5 text-text-secondary shrink-0" />
                                    <span>Provider Radius: 50 km</span>
                                    {searchRadiusKm === 50 && <Check className="ml-auto h-3.5 w-3.5 text-primary shrink-0" />}
                                  </div>
                                </Dropdown.Item>
                              </Dropdown.Menu>
                            </Dropdown.Popover>
                          </Dropdown.SubmenuTrigger>

                          {/* Clear & Detach if attached */}
                          {isIntakeAttached && (
                            <>
                              <Separator />
                              <Dropdown.Item id="action_clear" textValue="Clear and detach" variant="danger">
                                <div className="flex w-full items-center gap-2 text-xs text-danger">
                                  <X className="h-3.5 w-3.5 shrink-0" />
                                  <span>Clear & Detach Parameters</span>
                                </div>
                              </Dropdown.Item>
                            </>
                          )}
                        </Dropdown.Menu>
                      </Dropdown.Popover>
                    </Dropdown>

                    {isIntakeAttached && (
                      <div className="flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 pl-2.5 pr-1.5 py-1 text-xs font-medium text-primary animate-in fade-in zoom-in-95 duration-150">
                        <SlidersHorizontal className="h-3 w-3 shrink-0 text-primary" />
                        <span className="max-w-28 sm:max-w-44 truncate text-[11px] font-medium">
                          {duration} {preExistingConditions ? `· ${preExistingConditions}` : `· ${treatmentApproach}`}
                        </span>
                        <Button
                          isIconOnly
                          size="sm"
                          variant="secondary"
                          aria-label="Detach intake parameters"
                          className="h-4 w-4 min-w-4 rounded-full p-0 bg-transparent hover:bg-primary/20 text-primary border-0"
                          onPress={() => {
                            clearIntakeParameters();
                          }}
                        >
                          <X className="h-2.5 w-2.5" />
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Right: Specialist Model Picker (Flash v style) + Send Button */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Dropdown>
                      <Dropdown.Trigger>
                        <Button
                          size="sm"
                          variant="secondary"
                          aria-label="Select clinical specialist"
                          className="h-8 rounded-full border border-border-custom bg-surface px-2 text-xs font-medium text-text-primary hover:bg-secondary gap-1.5 shadow-2xs"
                        >
                          <ClinicalAvatar
                            name={currentAgent.displayName}
                            specialty={currentAgent.specialty}
                            size={18}
                            isInteractive={false}
                            showStatus={false}
                          />
                          <span className="max-w-24 sm:max-w-36 truncate">{currentAgent.displayName}</span>
                          <ChevronDown className="h-3 w-3 text-text-secondary shrink-0 opacity-70" />
                        </Button>
                      </Dropdown.Trigger>
                      <Dropdown.Popover className="min-w-64">
                        <Dropdown.Menu
                          aria-label="Select specialist model"
                          onAction={(key) => {
                            if (key) setAgentSpecialty(String(key));
                          }}
                        >
                          {agentOptions.map((agent) => {
                            const isAvailable = agent.isEnabled && agent.isTrained;

                            return (
                              <Dropdown.Item
                                key={agent.specialty}
                                id={agent.specialty}
                                textValue={agent.displayName}
                                className={cn(!isAvailable && "opacity-50 pointer-events-none")}
                              >
                                <div className="flex w-full items-center gap-2 text-xs">
                                  <ClinicalAvatar
                                    name={agent.displayName}
                                    specialty={agent.specialty}
                                    size={22}
                                    isInteractive={false}
                                    showStatus={false}
                                  />
                                  <span className="truncate">{agent.displayName}</span>
                                  {isAvailable ? (
                                    <span aria-hidden className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                                  ) : (
                                    <Chip className="ml-auto shrink-0 text-[9px] font-mono font-bold uppercase" size="sm" variant="soft">
                                      Soon
                                    </Chip>
                                  )}
                                </div>
                              </Dropdown.Item>
                            );
                          })}
                        </Dropdown.Menu>
                      </Dropdown.Popover>
                    </Dropdown>

                    <PromptInputAction tooltip={isLoading ? "Analyzing…" : "Send message"}>
                      <Button
                        isIconOnly
                        aria-label="Send message"
                        className="h-8 w-8 min-w-8 rounded-full bg-primary text-surface shadow-xs hover:opacity-90 transition-opacity"
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
                  </div>
                </PromptInputActions>
              </div>
            </PromptInput>

            <p className="pt-2 text-center text-[10px] text-text-secondary">
              Medicio AI guidance is advisory and does not replace professional clinical diagnosis.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
