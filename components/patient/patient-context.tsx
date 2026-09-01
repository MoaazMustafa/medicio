"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface ClarificationQuestion {
  id: string;
  question: string;
  options: string[];
  allowMultiSelect?: boolean;
}

export interface TemporaryMedicine {
  name: string;
  dosage: string;
  purpose: string;
  warning?: string;
  contraindicationAlert?: string;
}

export interface PossibleCondition {
  condition: string;
  icd11Code?: string;
  likelihood: "High" | "Moderate" | "Low";
  description: string;
  sourceGuideline?: string;
}

export interface TriageResult {
  severityLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  summary: string;
  clinicalImpression?: string;
  possibleConditions: PossibleCondition[];
  recommendDoctor: boolean;
  suggestedSpecialty: string;
  temporaryMedicines: TemporaryMedicine[];
  precautions: string[];
  redFlagsToWatch?: string[];
  questionsForDoctor?: string[];
  disclaimer: string;
  isEmergencyAlert?: boolean;
  isOutOfScope?: boolean;
}

export interface RecommendedDoctor {
  id: string;
  name: string;
  specialty: string;
  education: string;
  experience: number;
  clinicAddress: string;
  consultationFee: number;
  isVerified: boolean;
  hospitalName?: string;
}

import type { AppointmentBookingData } from "./chatbot/booking-card";

export interface RecommendedPharmacy {
  id: string;
  name: string;
  location: string;
  isVerified: boolean;
}

export interface RecommendedLab {
  id: string;
  name: string;
  isVerified: boolean;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  responseType?:
    | "GREETING"
    | "CLARIFICATION_NEEDED"
    | "TRIAGE_COMPLETE"
    | "MODEL_UNAVAILABLE"
    | "OUT_OF_SCOPE"
    | "CONVERSATION_TURN"
    | "API_KEY_REQUIRED"
    | "BOOKING_PREVIEW"
    | "BOOKING_CONFIRMED"
    | "BOOKING_AUTH_REQUIRED"
    | "SERVER_ERROR";
  clarificationQuestions?: ClarificationQuestion[];
  suggestedQuickReplies?: string[];
  userAnswers?: Record<string, string>;
  triageResult?: TriageResult;
  recommendedDoctors?: RecommendedDoctor[];
  recommendedPharmacies?: RecommendedPharmacy[];
  recommendedLabs?: RecommendedLab[];
  bookingResult?: AppointmentBookingData;
  specialty?: string;
  agentName?: string;
}

export interface SpecialistAgentInfo {
  specialty: string;
  displayName: string;
  description: string;
  isEnabled: boolean;
  isTrained: boolean;
  suggestedQuestions: string[];
  attachedDoctorCount: number;
}

export interface HistorySessionItem {
  id: string;
  title: string;
  symptomPrompt: string;
  severityLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  suggestedSpecialty: string;
  createdAt: string;
  summary: string;
}

interface PatientContextType {
  messages: ChatMessage[];
  agents: SpecialistAgentInfo[];
  activeAgent: SpecialistAgentInfo | null;
  activeAgentSpecialty: string;
  duration: string;
  preExistingConditions: string;
  currentMedicines: string;
  treatmentApproach: string;
  isLoading: boolean;
  conversationId: string | null;
  latestTriage: TriageResult | null;
  latestDoctors: RecommendedDoctor[];
  latestPharmacies: RecommendedPharmacy[];
  latestLabs: RecommendedLab[];
  historySessions: HistorySessionItem[];
  pendingClarificationMsg: ChatMessage | null;
  lastUserPrompt: string;

  userCoordinates: { lat: number; lng: number } | null;
  locationName: string;
  searchRadiusKm: number;
  isLocating: boolean;

  isIntakeAttached: boolean;
  setIsIntakeAttached(val: boolean): void;
  clearIntakeParameters(): void;

  setAgentSpecialty(specialty: string): void;
  setDuration(duration: string): void;
  setPreExistingConditions(val: string): void;
  setCurrentMedicines(val: string): void;
  setTreatmentApproach(val: string): void;
  setLocationName(name: string): void;
  setSearchRadiusKm(radius: number): void;
  requestDeviceLocation(): Promise<void>;
  sendMessage(promptText: string, answeredQuestions?: Record<string, string>): Promise<void>;
  submitClarificationAnswers(answers: Record<string, string>): Promise<void>;
  resetChat(): void;
  fetchAgents(): Promise<void>;
  fetchHistorySessions(): Promise<void>;
  loadHistorySession(id: string): Promise<void>;
}

function generateChatId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `chat_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

const PatientContext = createContext<PatientContextType | undefined>(undefined);

export function PatientProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const [activeAgentSpecialty, setAgentSpecialty] = useState<string>("GENERAL");
  const [duration, setDuration] = useState<string>("1-3 days");
  const [userCoordinates, setUserCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [locationName, setLocationName] = useState<string>("");
  const [searchRadiusKm, setSearchRadiusKm] = useState<number>(10);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [preExistingConditions, setPreExistingConditions] = useState<string>("");
  const [currentMedicines, setCurrentMedicines] = useState<string>("");
  const [treatmentApproach, setTreatmentApproach] = useState<string>("Allopathic");
  const [isIntakeAttached, setIsIntakeAttached] = useState<boolean>(false);

  const [conversationId, setConversationId] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const urlId = new URLSearchParams(window.location.search).get("id");
      if (urlId) return urlId;
    }
    return generateChatId();
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lastUserPrompt, setLastUserPrompt] = useState<string>("");
  const [pendingClarificationMsg, setPendingClarificationMsg] = useState<ChatMessage | null>(null);

  const [latestTriage, setLatestTriage] = useState<TriageResult | null>(null);
  const [latestDoctors, setLatestDoctors] = useState<RecommendedDoctor[]>([]);
  const [latestPharmacies, setLatestPharmacies] = useState<RecommendedPharmacy[]>([]);
  const [latestLabs, setLatestLabs] = useState<RecommendedLab[]>([]);
  const [historySessions, setHistorySessions] = useState<HistorySessionItem[]>([]);
  const [agents, setAgents] = useState<SpecialistAgentInfo[]>([]);

  const activeAgent = agents.find((a) => a.specialty === activeAgentSpecialty) ?? null;

  const fetchAgents = async () => {
    try {
      const res = await fetch("/api/agents");
      const data = await res.json();

      if (res.ok && Array.isArray(data.agents)) {
        setAgents(data.agents);
      }
    } catch (err) {
      console.error("Failed to fetch specialist agents: ", err);
    }
  };

  const fetchHistorySessions = async () => {
    try {
      const res = await fetch("/api/symptom-checker/history");
      const data = await res.json();
      if (res.ok && data.success) {
        setHistorySessions(data.history || []);
      }
    } catch (err) {
      console.error("Failed to fetch history sessions: ", err);
    }
  };

  const loadHistorySession = async (id: string) => {
    if (!id) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/symptom-checker/history?id=${id}`);
      const data = await res.json();
      if (res.ok && data.success && data.conversation) {
        const conv = data.conversation;
        setConversationId(conv.id);
        const parsedMsgs: any[] = conv.messages || [];

        const formattedChatMessages: ChatMessage[] = parsedMsgs.map((m, idx) => ({
          id: `msg-${idx}-${Date.now()}`,
          role: m.role || "assistant",
          content: m.content || "",
          timestamp: m.timestamp
            ? new Date(m.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            : new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          responseType: m.responseType || (m.triageResult ? "TRIAGE_COMPLETE" : "CONVERSATION_TURN"),
          triageResult: m.triageResult || undefined,
          suggestedQuickReplies: m.suggestedQuickReplies || undefined,
          specialty: m.specialty || undefined,
          agentName: m.agentName || undefined,
        }));

        setMessages(formattedChatMessages);

        if (conv.conversationType && conv.conversationType !== "SYMPTOM_CHECKER") {
          setAgentSpecialty(conv.conversationType);
        }

        const lastBotMsg = [...parsedMsgs].reverse().find((m) => m.role === "assistant" && m.triageResult);
        if (lastBotMsg?.triageResult) {
          setLatestTriage(lastBotMsg.triageResult);
          if (lastBotMsg.recommendedDoctors) setLatestDoctors(lastBotMsg.recommendedDoctors);
          if (lastBotMsg.recommendedPharmacies) setLatestPharmacies(lastBotMsg.recommendedPharmacies);
          if (lastBotMsg.recommendedLabs) setLatestLabs(lastBotMsg.recommendedLabs);
          if (lastBotMsg.triageResult.suggestedSpecialty) {
            const normalized = lastBotMsg.triageResult.suggestedSpecialty.toUpperCase().replace(/\s+/g, "_");
            if (agents.some((a) => a.specialty === normalized)) {
              setAgentSpecialty(normalized);
            }
          }
        }
      }
    } catch (err) {
      console.error("Failed to load history session: ", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
    fetchHistorySessions();
    if (typeof window !== "undefined") {
      const urlId = new URLSearchParams(window.location.search).get("id");
      if (urlId) {
        loadHistorySession(urlId);
      }
    }
  }, []);

  const requestDeviceLocation = async () => {
    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      setLocationName("Location unavailable");
      return;
    }

    setIsLocating(true);
    try {
      await new Promise<void>((resolve) => {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            const coords = {
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
            };
            setUserCoordinates(coords);
            try {
              // Quick reverse lookup format
              const formatted = `Near ${coords.lat.toFixed(3)}, ${coords.lng.toFixed(3)}`;
              setLocationName(formatted);
            } catch {
              setLocationName("Current GPS Location");
            }
            resolve();
          },
          (err) => {
            console.warn("[GEOLOCATION] Access denied or unavailable:", err.message);
            setUserCoordinates({ lat: 31.5204, lng: 74.3587 });
            setLocationName("Lahore Medical Hub");
            resolve();
          },
          { timeout: 8000, enableHighAccuracy: true },
        );
      });
    } finally {
      setIsLocating(false);
    }
  };

  const sendMessage = async (promptText: string, answeredQuestions?: Record<string, string>) => {
    if (!promptText.trim() && !answeredQuestions) return;

    const userMsgId = `user-${Date.now()}`;
    const timestampStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    const userMessage: ChatMessage = {
      id: userMsgId,
      role: "user",
      content: promptText.trim(),
      timestamp: timestampStr,
      userAnswers: answeredQuestions,
    };

    setMessages((prev) => [...prev, userMessage]);
    setLastUserPrompt(promptText.trim());
    setIsLoading(true);

    try {
      // Build conversation history from current messages
      const historyPayload = messages.map((m) => ({
        role: m.role,
        content: m.content,
        responseType: m.responseType,
        triageResult: m.triageResult,
        bookingResult: m.bookingResult,
        recommendedDoctors: m.recommendedDoctors,
      }));

      const response = await fetch("/api/symptom-checker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: promptText.trim(),
          agentSpecialty: activeAgentSpecialty,
          duration: isIntakeAttached ? duration : undefined,
          preExistingConditions: isIntakeAttached && preExistingConditions
            ? preExistingConditions.split(",").map((s) => s.trim()).filter(Boolean)
            : [],
          currentMedicines: isIntakeAttached && currentMedicines
            ? currentMedicines.split(",").map((s) => s.trim()).filter(Boolean)
            : [],
          treatmentApproach: isIntakeAttached ? treatmentApproach : "Allopathic",
          answeredQuestions,
          conversationId,
          coordinates: userCoordinates,
          locationName,
          radiusKm: searchRadiusKm,
          timezoneOffset: new Date().getTimezoneOffset(),
          history: historyPayload,
        }),
      });

      const data = await response.json();

      if (data.conversationId) {
        setConversationId(data.conversationId);
      }

      const respType:
        | "GREETING"
        | "CLARIFICATION_NEEDED"
        | "TRIAGE_COMPLETE"
        | "MODEL_UNAVAILABLE"
        | "OUT_OF_SCOPE"
        | "CONVERSATION_TURN"
        | "API_KEY_REQUIRED"
        | "BOOKING_PREVIEW"
        | "BOOKING_CONFIRMED"
        | "BOOKING_AUTH_REQUIRED"
        | "SERVER_ERROR" = data.responseType || (data.success ? "TRIAGE_COMPLETE" : data.error ? "SERVER_ERROR" : "API_KEY_REQUIRED");

      const currentSpecialty = data.agentSpecialty || activeAgentSpecialty;
      const currentAgentName = data.agentName || activeAgent?.displayName || "Clinical AI";

      if (respType === "SERVER_ERROR") {
        const botMessage: ChatMessage = {
          id: `bot-${Date.now()}`,
          role: "assistant",
          content: data.error || data.content || "An issue occurred while communicating with the AI service. Please try again.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          responseType: "SERVER_ERROR",
          specialty: currentSpecialty,
          agentName: currentAgentName,
        };

        setPendingClarificationMsg(null);
        setMessages((prev) => [...prev, botMessage]);
      } else if (respType === "API_KEY_REQUIRED") {
        const botMessage: ChatMessage = {
          id: `bot-${Date.now()}`,
          role: "assistant",
          content:
            data.content ||
            "**API Key Required**: Please configure `GEMINI_API_KEY` in your `.env` file to activate the live AI conversational clinical assistant.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          responseType: "API_KEY_REQUIRED",
          specialty: currentSpecialty,
          agentName: currentAgentName,
        };

        setPendingClarificationMsg(null);
        setMessages((prev) => [...prev, botMessage]);
      } else if (respType === "OUT_OF_SCOPE") {
        const botMessage: ChatMessage = {
          id: `bot-${Date.now()}`,
          role: "assistant",
          content:
            data.content ||
            "I apologize, but I am specialized strictly in medical intake and healthcare triage. Please share any physical symptoms or health concerns you have.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          responseType: "OUT_OF_SCOPE",
          specialty: currentSpecialty,
          agentName: currentAgentName,
        };

        setPendingClarificationMsg(null);
        setMessages((prev) => [...prev, botMessage]);
      } else if (respType === "MODEL_UNAVAILABLE") {
        const botMessage: ChatMessage = {
          id: `bot-${Date.now()}`,
          role: "assistant",
          content:
            data.content ||
            "This specialist model is currently updating its certified training protocols. Please switch to General AI Triage or another active specialist model.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          responseType: "MODEL_UNAVAILABLE",
          specialty: currentSpecialty,
          agentName: currentAgentName,
        };

        setPendingClarificationMsg(null);
        setMessages((prev) => [...prev, botMessage]);
      } else if (respType === "GREETING") {
        const botMessage: ChatMessage = {
          id: `bot-${Date.now()}`,
          role: "assistant",
          content: data.content || "Hello! How can I assist with your health today?",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          responseType: "GREETING",
          suggestedQuickReplies: data.suggestedQuickReplies || [],
          specialty: currentSpecialty,
          agentName: currentAgentName,
        };
        setPendingClarificationMsg(null);
        setMessages((prev) => [...prev, botMessage]);
      } else if (respType === "CONVERSATION_TURN") {
        // One-by-one live AI clinical question
        const botMessage: ChatMessage = {
          id: `bot-${Date.now()}`,
          role: "assistant",
          content: data.content || "Could you share more details about your symptoms?",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          responseType: "CONVERSATION_TURN",
          suggestedQuickReplies: data.suggestedQuickReplies || [],
          specialty: currentSpecialty,
          agentName: currentAgentName,
        };
        setPendingClarificationMsg(null);
        setMessages((prev) => [...prev, botMessage]);
      } else if (
        respType === "BOOKING_PREVIEW" ||
        respType === "BOOKING_CONFIRMED" ||
        respType === "BOOKING_AUTH_REQUIRED"
      ) {
        const botMessage: ChatMessage = {
          id: `bot-${Date.now()}`,
          role: "assistant",
          content: data.content || "Your appointment booking details:",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          responseType: respType,
          bookingResult: data.bookingResult,
          specialty: currentSpecialty,
          agentName: currentAgentName,
        };
        setPendingClarificationMsg(null);
        setMessages((prev) => [...prev, botMessage]);
      } else {
        // TRIAGE COMPLETE
        setPendingClarificationMsg(null);
        const triage: TriageResult = data.triageResult;
        const doctors: RecommendedDoctor[] = data.recommendedDoctors || [];
        const pharmacies: RecommendedPharmacy[] = data.recommendedPharmacies || [];
        const labs: RecommendedLab[] = data.recommendedLabs || [];

        setLatestTriage(triage);
        setLatestDoctors(doctors);
        setLatestPharmacies(pharmacies);
        setLatestLabs(labs);

        const botMessage: ChatMessage = {
          id: `bot-${Date.now()}`,
          role: "assistant",
          content: data.content || triage?.summary || "Clinical assessment complete.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          responseType: "TRIAGE_COMPLETE",
          triageResult: triage,
          recommendedDoctors: doctors,
          recommendedPharmacies: pharmacies,
          recommendedLabs: labs,
          specialty: currentSpecialty,
          agentName: currentAgentName,
        };

        setMessages((prev) => [...prev, botMessage]);
        fetchHistorySessions();
      }
    } catch (err: any) {
      const errorMessage: ChatMessage = {
        id: `bot-err-${Date.now()}`,
        role: "assistant",
        content: `Error: ${err.message || "Failed to process symptom check. Please try again."}`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const submitClarificationAnswers = async (answers: Record<string, string>) => {
    if (!lastUserPrompt) return;
    await sendMessage(lastUserPrompt, answers);
  };

  const clearIntakeParameters = () => {
    setPreExistingConditions("");
    setCurrentMedicines("");
    setDuration("1-3 days");
    setTreatmentApproach("Allopathic");
    setIsIntakeAttached(false);
  };

  const resetChat = () => {
    setMessages([]);
    setLatestTriage(null);
    setLatestDoctors([]);
    setLatestPharmacies([]);
    setLatestLabs([]);
    setPendingClarificationMsg(null);
    setLastUserPrompt("");
    const newId = generateChatId();
    setConversationId(newId);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("id", newId);
      window.history.replaceState({}, "", url.toString());
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined" && conversationId) {
      const url = new URL(window.location.href);
      if (url.searchParams.get("id") !== conversationId) {
        url.searchParams.set("id", conversationId);
        window.history.replaceState({}, "", url.toString());
      }
    }
  }, [conversationId]);

  return (
    <PatientContext.Provider
      value={{
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
        conversationId,
        latestTriage,
        latestDoctors,
        latestPharmacies,
        latestLabs,
        historySessions,
        pendingClarificationMsg,
        lastUserPrompt,
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
        fetchAgents,
        fetchHistorySessions,
        loadHistorySession,
      }}
    >
      {children}
    </PatientContext.Provider>
  );
}

export function usePatientContext() {
  const context = useContext(PatientContext);
  if (!context) {
    throw new Error("usePatientContext must be used within a PatientProvider");
  }
  return context;
}
