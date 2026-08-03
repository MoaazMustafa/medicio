"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface ClarificationQuestion {
  id: string;
  question: string;
  options: string[];
}

export interface TemporaryMedicine {
  name: string;
  dosage: string;
  purpose: string;
  warning?: string;
}

export interface PossibleCondition {
  condition: string;
  likelihood: "High" | "Moderate" | "Low";
  description: string;
}

export interface TriageResult {
  severityLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  summary: string;
  possibleConditions: PossibleCondition[];
  recommendDoctor: boolean;
  suggestedSpecialty: string;
  temporaryMedicines: TemporaryMedicine[];
  precautions: string[];
  disclaimer: string;
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
  responseType?: "GREETING" | "CLARIFICATION_NEEDED" | "TRIAGE_COMPLETE" | "MODEL_UNAVAILABLE";
  clarificationQuestions?: ClarificationQuestion[];
  userAnswers?: Record<string, string>;
  triageResult?: TriageResult;
  recommendedDoctors?: RecommendedDoctor[];
  recommendedPharmacies?: RecommendedPharmacy[];
  recommendedLabs?: RecommendedLab[];
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

  setAgentSpecialty: (specialty: string) => void;
  setDuration: (duration: string) => void;
  setPreExistingConditions: (val: string) => void;
  setCurrentMedicines: (val: string) => void;
  setTreatmentApproach: (val: string) => void;
  sendMessage: (promptText: string, answeredQuestions?: Record<string, string>) => Promise<void>;
  submitClarificationAnswers: (answers: Record<string, string>) => Promise<void>;
  resetChat: () => void;
  fetchAgents: () => Promise<void>;
  fetchHistorySessions: () => Promise<void>;
  loadHistorySession: (id: string) => Promise<void>;
}

const PatientContext = createContext<PatientContextType | undefined>(undefined);

export function PatientProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome-1",
      role: "assistant",
      content:
        "Hello! I am your Medicio AI Health Assistant. Share your symptoms or select an AI Specialist above to begin guided clinical triage.",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  const [activeAgentSpecialty, setAgentSpecialty] = useState<string>("GENERAL");
  const [duration, setDuration] = useState<string>("1-3 days");
  const [preExistingConditions, setPreExistingConditions] = useState<string>("");
  const [currentMedicines, setCurrentMedicines] = useState<string>("");
  const [treatmentApproach, setTreatmentApproach] = useState<string>("Allopathic");

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
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
          triageResult: m.triageResult,
        }));

        setMessages(formattedChatMessages);

        const lastBotMsg = parsedMsgs.slice().reverse().find((m) => m.role === "assistant" && m.triageResult);
        if (lastBotMsg && lastBotMsg.triageResult) {
          setLatestTriage(lastBotMsg.triageResult);
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
  }, []);

  const sendMessage = async (promptText: string, answeredQuestions?: Record<string, string>) => {
    if (!promptText || !promptText.trim() || isLoading) return;

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
      const response = await fetch("/api/symptom-checker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: promptText.trim(),
          agentSpecialty: activeAgentSpecialty,
          duration,
          preExistingConditions: preExistingConditions
            ? preExistingConditions.split(",").map((s) => s.trim()).filter(Boolean)
            : [],
          currentMedicines: currentMedicines
            ? currentMedicines.split(",").map((s) => s.trim()).filter(Boolean)
            : [],
          treatmentApproach,
          answeredQuestions,
          conversationId,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to reach AI triage server.");
      }

      if (data.conversationId) {
        setConversationId(data.conversationId);
      }

      const respType: "GREETING" | "CLARIFICATION_NEEDED" | "TRIAGE_COMPLETE" | "MODEL_UNAVAILABLE" =
        data.responseType || "TRIAGE_COMPLETE";

      if (respType === "MODEL_UNAVAILABLE") {
        const botMessage: ChatMessage = {
          id: `bot-${Date.now()}`,
          role: "assistant",
          content:
            data.content ||
            "This specialist model is not available yet. Please switch to an available AI model to continue.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          responseType: "MODEL_UNAVAILABLE",
        };

        setPendingClarificationMsg(null);
        setMessages((prev) => [...prev, botMessage]);
      } else if (respType === "CLARIFICATION_NEEDED") {
        const botMessage: ChatMessage = {
          id: `bot-${Date.now()}`,
          role: "assistant",
          content: data.content || "Please answer a few clarifying questions to complete triage.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          responseType: "CLARIFICATION_NEEDED",
          clarificationQuestions: data.clarificationQuestions || [],
        };
        setPendingClarificationMsg(botMessage);
        setMessages((prev) => [...prev, botMessage]);
      } else if (respType === "GREETING") {
        const botMessage: ChatMessage = {
          id: `bot-${Date.now()}`,
          role: "assistant",
          content: data.content || "Hello! How can I assist with your health today?",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          responseType: "GREETING",
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
          content: triage.summary,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          responseType: "TRIAGE_COMPLETE",
          triageResult: triage,
          recommendedDoctors: doctors,
          recommendedPharmacies: pharmacies,
          recommendedLabs: labs,
        };

        setMessages((prev) => [...prev, botMessage]);
        fetchHistorySessions();
      }
    } catch (err: any) {
      console.error("Error calling symptom checker: ", err);
      const errorMessage: ChatMessage = {
        id: `err-${Date.now()}`,
        role: "assistant",
        content:
          "Unable to complete AI clinical triage at this time. Please verify your connection or consult a medical provider directly.",
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

  const resetChat = () => {
    setMessages([
      {
        id: "welcome-1",
        role: "assistant",
        content:
          "Session reset. Share your symptoms or select an AI Specialist above to begin guided clinical triage.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
    setConversationId(null);
    setLatestTriage(null);
    setLatestDoctors([]);
    setLatestPharmacies([]);
    setLatestLabs([]);
    setPendingClarificationMsg(null);
    setLastUserPrompt("");
  };

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
        isLoading,
        conversationId,
        latestTriage,
        latestDoctors,
        latestPharmacies,
        latestLabs,
        historySessions,
        pendingClarificationMsg,
        lastUserPrompt,
        setAgentSpecialty,
        setDuration,
        setPreExistingConditions,
        setCurrentMedicines,
        setTreatmentApproach,
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
