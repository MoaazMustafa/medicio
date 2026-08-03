import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { writeAudit } from "@/lib/audit";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getClientIp } from "@/lib/rate-limit";
import {
  buildTrainingContext,
  computeIsTrained,
  getAgentWithDoctors,
  makeConversationTitle,
  parseDoctorTraining,
} from "@/lib/specialist-agents";

export interface ClarificationQuestion {
  id: string;
  question: string;
  options: string[];
}

export interface TriageResult {
  severityLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  summary: string;
  possibleConditions: { condition: string; likelihood: "High" | "Moderate" | "Low"; description: string }[];
  recommendDoctor: boolean;
  suggestedSpecialty: string;
  temporaryMedicines: { name: string; dosage: string; purpose: string; warning?: string }[];
  precautions: string[];
  disclaimer: string;
}

const MEDICAL_DISCLAIMER =
  "Medical Disclaimer: Medicio AI guidance is provided for informational and advisory intake purposes only. It does not constitute a formal clinical diagnosis or emergency medical advice. Always consult a verified healthcare professional for medical concerns.";

const GREETING_KEYWORDS = [
  "hi",
  "hello",
  "hey",
  "good morning",
  "good evening",
  "good afternoon",
  "hola",
  "who are you",
  "test",
  "help",
  "sup",
  "yo",
  "im horny",
  "im tired",
  "start",
];

function isSimpleGreeting(promptText: string): boolean {
  const clean = promptText.trim().toLowerCase().replace(/[^a-z0-9\s]/g, "");
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length <= 3 && words.some((w) => GREETING_KEYWORDS.includes(w))) {
    return true;
  }
  return false;
}

function isVagueSymptomPrompt(promptText: string): boolean {
  const clean = promptText.trim().toLowerCase();
  const words = clean.split(/\s+/).filter(Boolean);

  if (words.length < 8 && !clean.includes("day") && !clean.includes("week") && !clean.includes("month")) {
    return true;
  }
  return false;
}

function mapSpecialtyToCategory(inputSpecialty: string, promptText: string): string {
  const lowerPrompt = promptText.toLowerCase();

  if (inputSpecialty && inputSpecialty !== "GENERAL") {
    switch (inputSpecialty.toUpperCase()) {
      case "DERMATOLOGY":
        return "Dermatology";
      case "CARDIOLOGY":
        return "Cardiology";
      case "NEUROLOGY":
        return "Neurology";
      case "PEDIATRICS":
        return "Pediatrics";
      default:
        break;
    }
  }

  if (lowerPrompt.includes("skin") || lowerPrompt.includes("rash") || lowerPrompt.includes("itch") || lowerPrompt.includes("acne") || lowerPrompt.includes("redness")) {
    return "Dermatology";
  }
  if (lowerPrompt.includes("chest") || lowerPrompt.includes("heart") || lowerPrompt.includes("palpitation") || lowerPrompt.includes("blood pressure")) {
    return "Cardiology";
  }
  if (lowerPrompt.includes("headache") || lowerPrompt.includes("dizzy") || lowerPrompt.includes("numbness") || lowerPrompt.includes("migraine") || lowerPrompt.includes("nerve")) {
    return "Neurology";
  }
  if (lowerPrompt.includes("child") || lowerPrompt.includes("baby") || lowerPrompt.includes("pediatric")) {
    return "Pediatrics";
  }

  return "General Physician";
}

function generateClarificationQuestions(promptText: string, specialty: string): ClarificationQuestion[] {
  const lower = promptText.toLowerCase();

  const q1: ClarificationQuestion = {
    id: "duration",
    question: "How long have you been experiencing these symptoms?",
    options: ["Less than 24 hours", "1 to 3 days", "4 to 7 days", "More than 1 week"],
  };

  const q2: ClarificationQuestion = {
    id: "severity",
    question: "How would you describe the intensity of your discomfort?",
    options: ["Mild (Manageable)", "Moderate (Interferes with work/sleep)", "Severe / Intense"],
  };

  let q3: ClarificationQuestion;

  if (specialty === "DERMATOLOGY" || lower.includes("skin") || lower.includes("rash") || lower.includes("itch")) {
    q3 = {
      id: "cutaneous_features",
      question: "Are you noticing any of these specific skin features?",
      options: ["Red bumps or swelling", "Dry/peeling skin", "Spreading rash after exposure", "None of these"],
    };
  } else if (specialty === "CARDIOLOGY" || lower.includes("chest") || lower.includes("heart")) {
    q3 = {
      id: "cardiac_features",
      question: "Do you have any accompanying thoracic signs?",
      options: ["Pain radiates to arm/jaw", "Shortness of breath on exertion", "Rapid/irregular heartbeat", "None of these"],
    };
  } else if (specialty === "NEUROLOGY" || lower.includes("headache") || lower.includes("dizzy")) {
    q3 = {
      id: "neurological_features",
      question: "What best describes your headache or neurological discomfort?",
      options: ["Throbbing on both sides", "Unilateral / sharp pain", "Pressure behind eyes / sinus", "Dizziness / light sensitivity"],
    };
  } else {
    q3 = {
      id: "systemic_features",
      question: "Are you experiencing any accompanying constitutional signs?",
      options: ["Fever / Chills", "Nausea / Digestive upset", "Fatigue / Body aches", "None of these"],
    };
  }

  return [q1, q2, q3];
}

async function callLLMApi(
  apiKey: string,
  prompt: string,
  specialty: string,
  duration: string,
  conditions: string[],
  medicines: string[],
  treatmentApproach: string,
  answeredQuestions?: Record<string, string>,
  trainingContext?: string,
): Promise<TriageResult | null> {
  try {
    const systemPrompt = `You are a clinical AI triage assistant for Medicio platform.
${trainingContext ? `\nSpecialist model training directives — follow these clinical protocols strictly:\n${trainingContext}\n` : ""}
Analyze the patient presentation below and return ONLY a valid JSON object matching this exact schema:
{
  "severityLevel": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "summary": "Concise medical triage summary",
  "possibleConditions": [
    { "condition": "Condition Name", "likelihood": "High" | "Moderate" | "Low", "description": "Clinical details" }
  ],
  "recommendDoctor": boolean,
  "suggestedSpecialty": "Dermatology" | "Cardiology" | "Neurology" | "Pediatrics" | "General Physician",
  "temporaryMedicines": [
    { "name": "Medication Name", "dosage": "Dosage instructions", "purpose": "Relief purpose", "warning": "Contraindications" }
  ],
  "precautions": ["Precaution 1", "Precaution 2"],
  "disclaimer": "${MEDICAL_DISCLAIMER}"
}

Patient Case:
- Primary Complaint: "${prompt}"
- Specialty Assistant Selected: "${specialty}"
- Symptom Duration: "${duration}"
- Patient Clarification Answers: "${JSON.stringify(answeredQuestions || {})}"
- Pre-existing Conditions: "${conditions.join(", ") || "None"}"
- Active Medications: "${medicines.join(", ") || "None"}"
- Preferred Treatment Approach: "${treatmentApproach}"
`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: systemPrompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.2,
        },
      }),
    });

    if (!res.ok) {
      console.warn("[LLM API] Gemini API request returned status:", res.status);
      return null;
    }

    const data = await res.json();
    const textContent = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!textContent) return null;

    const parsed = JSON.parse(textContent);
    if (parsed && parsed.severityLevel && parsed.summary) {
      parsed.disclaimer = MEDICAL_DISCLAIMER;
      return parsed as TriageResult;
    }
    return null;
  } catch (err) {
    console.warn("[LLM API] Error invoking external AI endpoint, activating fallback:", err);
    return null;
  }
}

function analyzeSymptomsFallback(
  prompt: string,
  specialty: string,
  duration: string,
  conditions: string[],
  medicines: string[],
  treatmentApproach: string,
  answeredQuestions?: Record<string, string>,
): TriageResult {
  const text = prompt.toLowerCase();
  const matchedSpecialty = mapSpecialtyToCategory(specialty, prompt);

  let severityLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" = "LOW";
  let recommendDoctor = false;
  const possibleConditions: TriageResult["possibleConditions"] = [];
  const temporaryMedicines: TriageResult["temporaryMedicines"] = [];
  const precautions: string[] = [];

  const effectiveDuration = answeredQuestions?.duration || duration || "1-3 days";
  const userSeverity = answeredQuestions?.severity || "";

  if (userSeverity.includes("Severe") || text.includes("chest pain") || text.includes("shortness of breath") || text.includes("fainting")) {
    severityLevel = userSeverity.includes("Severe") ? "HIGH" : "CRITICAL";
    recommendDoctor = true;
  } else if (userSeverity.includes("Moderate") || text.includes("fever") || text.includes("headache") || text.includes("rash")) {
    severityLevel = "MEDIUM";
    recommendDoctor = true;
  } else {
    severityLevel = "LOW";
    recommendDoctor = false;
  }

  if (text.includes("fever") || text.includes("chills")) {
    possibleConditions.push(
      {
        condition: "Viral Upper Respiratory Infection",
        likelihood: "High",
        description: "Febrile immune reaction secondary to viral inflammation.",
      },
      {
        condition: "Acute Febrile Illness",
        likelihood: "Moderate",
        description: "Requires hydration monitoring and temperature tracking.",
      },
    );
    temporaryMedicines.push({
      name: "Paracetamol (Acetaminophen) 500mg",
      dosage: "1 tablet every 6-8 hours as needed (Max 3000mg/day)",
      purpose: "Fever reduction and somatic discomfort relief.",
    });
    precautions.push("Maintain optimal fluid intake", "Rest in a well-ventilated room");
  } else if (text.includes("headache") || text.includes("migraine")) {
    possibleConditions.push(
      {
        condition: "Tension-Type Headache",
        likelihood: "High",
        description: "Pericranial muscle tension or ocular strain.",
      },
      {
        condition: "Primary Migraine Episode",
        likelihood: "Moderate",
        description: "Vascular headache episode with potential light sensitivity.",
      },
    );
    temporaryMedicines.push({
      name: "Ibuprofen 400mg",
      dosage: "1 tablet with food every 8 hours",
      purpose: "Anti-inflammatory pain management.",
    });
    precautions.push("Rest in a quiet, dark room", "Avoid prolonged screen strain");
  } else if (text.includes("skin") || text.includes("rash") || text.includes("itch")) {
    possibleConditions.push(
      {
        condition: "Cutaneous Hypersensitivity / Dermatitis",
        likelihood: "High",
        description: "Localized allergic or inflammatory epidermal reaction.",
      },
    );
    temporaryMedicines.push({
      name: "Cetirizine 10mg",
      dosage: "1 tablet daily at bedtime",
      purpose: "Antihistamine for controlling skin itching.",
    });
    precautions.push("Avoid scratching affected skin", "Apply cool compresses");
  } else {
    possibleConditions.push(
      {
        condition: "Mild Non-Specific Discomfort",
        likelihood: "Moderate",
        description: "Transient physical tiredness or mild functional discomfort.",
      },
    );
    precautions.push("Ensure 7-8 hours of nighttime rest", "Maintain hydration");
  }

  const summary = `Patient complaint: "${prompt}". Duration: ${effectiveDuration}. Clinical risk level: ${severityLevel}. ${
    recommendDoctor ? `Consultation with a ${matchedSpecialty} specialist is recommended.` : "Self-care precautions are advised."
  }`;

  return {
    severityLevel,
    summary,
    possibleConditions,
    recommendDoctor,
    suggestedSpecialty: matchedSpecialty,
    temporaryMedicines,
    precautions,
    disclaimer: MEDICAL_DISCLAIMER,
  };
}

/**
 * POST /api/symptom-checker
 */
export async function POST(request: NextRequest) {
  const session = await getSession();

  try {
    const body = await request.json();
    const {
      prompt,
      agentSpecialty = "GENERAL",
      duration = "1-3 days",
      preExistingConditions = [],
      currentMedicines = [],
      treatmentApproach = "Allopathic",
      answeredQuestions,
      conversationId,
    } = body;

    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return NextResponse.json(
        { error: "Symptom prompt is required for AI intake." },
        { status: 400 },
      );
    }

    const trimmedPrompt = prompt.trim();

    // 0. MODEL AVAILABILITY GATE: the selected specialist model must exist,
    // be enabled, and be trained (admin training data or an attached trained
    // doctor) before the AI responds at all.
    const { agent, attachedDoctors } = await getAgentWithDoctors(prisma, agentSpecialty);
    const modelIsReady = !!agent && agent.isEnabled && computeIsTrained(agent, attachedDoctors);

    if (!modelIsReady) {
      const modelName = agent?.displayName || "This specialist model";

      return NextResponse.json({
        success: true,
        responseType: "MODEL_UNAVAILABLE",
        content: `${modelName} is not available yet — no trained AI model is attached to this specialty. Please switch to an available specialist model (like General AI Triage) or check back soon.`,
        conversationId: conversationId || null,
      });
    }

    const trainingContext = buildTrainingContext(agent, attachedDoctors);

    const conditionsArray = Array.isArray(preExistingConditions)
      ? preExistingConditions
      : typeof preExistingConditions === "string" && preExistingConditions
      ? [preExistingConditions]
      : [];

    const medicinesArray = Array.isArray(currentMedicines)
      ? currentMedicines
      : typeof currentMedicines === "string" && currentMedicines
      ? [currentMedicines]
      : [];

    // 1. GREETING CHECK: If prompt is a simple greeting and no clarification answers provided
    if (isSimpleGreeting(trimmedPrompt) && (!answeredQuestions || Object.keys(answeredQuestions).length === 0)) {
      const greetingMessage =
        "Hello! I am your Medicio AI Clinical Assistant. Please describe your symptoms or health concern to begin guided clinical intake and specialist referrals.";

      return NextResponse.json({
        success: true,
        responseType: "GREETING",
        content: greetingMessage,
        conversationId: conversationId || null,
      });
    }

    // 2. CLARIFICATION CHECK: If prompt is vague and no answered clarification questions yet
    if (isVagueSymptomPrompt(trimmedPrompt) && (!answeredQuestions || Object.keys(answeredQuestions).length === 0)) {
      const clarificationQuestions = generateClarificationQuestions(trimmedPrompt, agentSpecialty);
      const clarificationMessage =
        `I understand you are experiencing ${trimmedPrompt}. To provide an accurate clinical triage assessment, please answer a few quick questions below.`;

      return NextResponse.json({
        success: true,
        responseType: "CLARIFICATION_NEEDED",
        content: clarificationMessage,
        clarificationQuestions,
        conversationId: conversationId || null,
      });
    }

    // 3. FULL TRIAGE SYNTHESIS
    const apiKey = process.env.GEMINI_API_KEY || process.env.AI_API_KEY || process.env.OPENAI_API_KEY;
    let triageResult: TriageResult | null = null;
    let isLiveAIUsed = false;

    if (apiKey) {
      triageResult = await callLLMApi(
        apiKey,
        trimmedPrompt,
        agentSpecialty,
        duration,
        conditionsArray,
        medicinesArray,
        treatmentApproach,
        answeredQuestions,
        trainingContext,
      );
      if (triageResult) isLiveAIUsed = true;
    }

    if (!triageResult) {
      triageResult = analyzeSymptomsFallback(
        trimmedPrompt,
        agentSpecialty,
        duration,
        conditionsArray,
        medicinesArray,
        treatmentApproach,
        answeredQuestions,
      );

      // Surface the attached practitioner's disclaimer in fallback mode too.
      const practitionerDisclaimer = attachedDoctors
        .map((doc) => parseDoctorTraining(doc.aiTrainingData))
        .find((t) => t?.isTrained && t.customDisclaimer)?.customDisclaimer;

      if (practitionerDisclaimer) {
        triageResult.disclaimer = `${MEDICAL_DISCLAIMER} ${practitionerDisclaimer}`;
      }
    }

    const targetSpecialty = triageResult.suggestedSpecialty;
    const matchingDoctors = await prisma.doctor.findMany({
      where: {
        specialty: {
          contains: targetSpecialty,
          mode: "insensitive",
        },
      },
      take: 4,
      include: {
        user: { select: { name: true, email: true, avatarUrl: true } },
        hospital: { select: { name: true, location: true } },
      },
    });

    let recommendedDoctors = matchingDoctors.map((doc) => ({
      id: doc.id,
      name: doc.user?.name || "Verified Practitioner",
      specialty: doc.specialty,
      education: doc.education,
      experience: doc.experience,
      clinicAddress: doc.clinicAddress || doc.hospital?.location || "Medicio Clinical Center",
      consultationFee: doc.consultationFee ?? 50,
      isVerified: doc.isVerified,
      hospitalName: doc.hospital?.name,
    }));

    if (recommendedDoctors.length === 0) {
      const fallbackDoctors = await prisma.doctor.findMany({
        take: 3,
        include: {
          user: { select: { name: true, email: true, avatarUrl: true } },
          hospital: { select: { name: true, location: true } },
        },
      });

      recommendedDoctors = fallbackDoctors.map((doc) => ({
        id: doc.id,
        name: doc.user?.name || "Verified Doctor",
        specialty: doc.specialty,
        education: doc.education,
        experience: doc.experience,
        clinicAddress: doc.clinicAddress || doc.hospital?.location || "Medicio Health Portal",
        consultationFee: doc.consultationFee ?? 50,
        isVerified: doc.isVerified,
        hospitalName: doc.hospital?.name,
      }));
    }

    const pharmacies = await prisma.pharmacy.findMany({
      take: 3,
      select: { id: true, name: true, location: true, isVerified: true },
    });

    const labs = await prisma.lab.findMany({
      take: 3,
      select: { id: true, name: true, isVerified: true },
    });

    let savedConversationId = conversationId;
    const conversationMessages = [
      {
        role: "user",
        content: trimmedPrompt,
        timestamp: new Date().toISOString(),
        answeredQuestions,
      },
      {
        role: "assistant",
        content: triageResult.summary,
        triageResult,
        timestamp: new Date().toISOString(),
      },
    ];

    if (savedConversationId) {
      const existingConv = await prisma.aIConversation.findUnique({
        where: { id: savedConversationId },
      });

      if (existingConv) {
        let currentMsgs: any[] = [];
        try {
          currentMsgs = JSON.parse(existingConv.messages);
        } catch {
          currentMsgs = [];
        }
        const updatedMsgs = [...currentMsgs, ...conversationMessages];

        await prisma.aIConversation.update({
          where: { id: savedConversationId },
          data: { messages: JSON.stringify(updatedMsgs) },
        });
      }
    } else {
      const newConv = await prisma.aIConversation.create({
        data: {
          userId: session?.userId || null,
          conversationType: agentSpecialty !== "GENERAL" ? "SPECIALTY_AGENT" : "SYMPTOM_CHECKER",
          title: makeConversationTitle(trimmedPrompt),
          messages: JSON.stringify(conversationMessages),
        },
      });
      savedConversationId = newConv.id;
    }

    await writeAudit({
      action: "PATIENT_AI_SYMPTOM_CHECK",
      actorId: session?.userId || null,
      actorRole: session?.role || "PATIENT",
      entityType: "AIConversation",
      entityId: savedConversationId,
      ip: getClientIp(request),
      metadata: {
        specialty: agentSpecialty,
        severityLevel: triageResult.severityLevel,
        recommendDoctor: triageResult.recommendDoctor,
        suggestedSpecialty: triageResult.suggestedSpecialty,
        isLiveAIUsed,
      },
    });

    return NextResponse.json({
      success: true,
      responseType: "TRIAGE_COMPLETE",
      conversationId: savedConversationId,
      isLiveAIUsed,
      triageResult,
      recommendedDoctors,
      recommendedPharmacies: pharmacies.map((p) => ({
        id: p.id,
        name: p.name,
        location: p.location,
        isVerified: p.isVerified,
      })),
      recommendedLabs: labs.map((l) => ({
        id: l.id,
        name: l.name,
        isVerified: l.isVerified,
      })),
    });
  } catch (error: any) {
    console.error("Symptom checker endpoint error: ", error);
    return NextResponse.json(
      { error: "Failed to process AI symptom triage request." },
      { status: 500 },
    );
  }
}
