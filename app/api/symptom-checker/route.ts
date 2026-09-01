import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import type { AppointmentBookingData } from "@/components/patient/chatbot/booking-card";
import { writeAudit } from "@/lib/audit";
import { getSession } from "@/lib/auth";
import { sendAppointmentBookedEmail } from "@/lib/email";
import type { TriageResult } from "@/lib/medical-knowledge";
import {
  checkOutOfScopeQuery,
  MEDICAL_DISCLAIMER,
} from "@/lib/medical-knowledge";
import { notify } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { getClientIp } from "@/lib/rate-limit";
import {
  buildTrainingContext,
  computeIsTrained,
  ensureSpecialistAgents,
  getAgentWithDoctors,
  makeConversationTitle,
} from "@/lib/specialist-agents";

interface LLMTurnResponse {
  isComplete: boolean;
  messageContent: string;
  suggestedQuickReplies?: string[];
  triageResult?: TriageResult;
}

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
  "start",
  "salam",
  "assalam",
  "asalam",
  "assalam o alaikum",
  "asalam alaikum",
  "kese ho",
  "kaise ho",
  "kya hal hai",
  "kya haal hai",
];

const PLEASANTRY_KEYWORDS = [
  "thank you",
  "thanks",
  "thank u",
  "thx",
  "ok",
  "okay",
  "got it",
  "understood",
  "bye",
  "goodbye",
  "sounds good",
  "alright",
  "perfect",
  "great",
  "shukriya",
  "bohot shukriya",
  "boht shukriya",
  "shukran",
  "jazakallah",
  "jazak allah",
  "theek hai",
  "thik hai",
  "thek hai",
];

function isRomanUrdu(text: string): boolean {
  const lower = text.toLowerCase();
  const words = lower.split(/[^a-z0-9]+/);

  const distinctUrduWords = [
    "mujhe", "mera", "meri", "mere", "hai", "hain", "kya", "kyun", "kab", "kese", "kaise",
    "raha", "rahi", "rahey", "bukhar", "khansi", "batao", "bataen",
    "shukriya", "theek", "thik", "thek", "chahiye", "chaheay", "dawaii",
    "bohot", "boht", "zyada", "ziada", "subah", "subha", "dopahar", "dophar",
    "shaam", "baje", "bje", "bachon", "khawateen", "chamri", "krna"
  ];

  const standardUrduWords = [
    "dard", "sar", "pait", "gala", "ko", "par", "mein", "main", "dikha", "milna",
    "salam", "karna", "dawa", "goli", "khana", "peena", "sham", "raat", "kal", "aaj",
    "bacha", "aurat", "dil", "jild", "haddi", "jor"
  ];

  const distinctCount = distinctUrduWords.filter((w) => words.includes(w)).length;
  if (distinctCount >= 1) return true;

  const standardCount = standardUrduWords.filter((w) => words.includes(w)).length;
  return standardCount >= 2;
}

function isSimpleGreeting(promptText: string): boolean {
  const clean = promptText.trim().toLowerCase().replace(/[^a-z0-9\s]/g, "");
  const words = clean.split(/\s+/).filter(Boolean);
  return (words.length <= 3 && words.some((w) => GREETING_KEYWORDS.includes(w))) || GREETING_KEYWORDS.includes(clean);
}

function isSimplePleasantry(promptText: string): boolean {
  const clean = promptText.trim().toLowerCase().replace(/[^a-z0-9\s]/g, "");
  return (
    PLEASANTRY_KEYWORDS.includes(clean) ||
    (clean.length <= 25 && PLEASANTRY_KEYWORDS.some((kw) => clean === kw || clean.startsWith(kw)))
  );
}

function isBookingConfirmation(promptText: string): boolean {
  const clean = promptText.toLowerCase().trim().replace(/[^a-z0-9\s]/g, "");
  const confirmPhrases = [
    "confirm",
    "confirm booking",
    "yes",
    "yes please",
    "book it",
    "proceed",
    "proceed with booking",
    "looks good",
    "ok confirm",
    "okay confirm",
    "confirm appointment",
    "finalize",
    "finalize booking",
    "haan",
    "han",
    "theek hai",
    "thik hai",
    "thek hai",
    "kar do",
    "kr do",
    "book kar do",
    "book kr do",
    "confirm kar do",
    "confirm kr do",
    "confirm kar dein",
    "confirm kr dein",
  ];
  return (
    confirmPhrases.includes(clean) ||
    clean.startsWith("confirm booking") ||
    clean.startsWith("confirm appointment") ||
    clean.startsWith("confirm slot") ||
    clean === "yes" ||
    clean === "haan" ||
    clean === "han"
  );
}

function isBookingIntent(promptText: string): boolean {
  const lower = promptText.toLowerCase();
  const bookingKeywords = [
    "book",
    "schedule",
    "reserve",
    "slot",
    "appointment",
    "consultation",
    "see a doctor",
    "see dr",
    "visit dr",
    "visit doctor",
    "take appointment",
    "confirm booking",
    "milna hai",
    "dikhana hai",
    "check karwana",
    "check krwana",
    "appointment leni",
    "slot chahiye",
  ];
  return bookingKeywords.some((kw) => lower.includes(kw));
}

function hasExplicitDateTime(promptText: string): boolean {
  const lower = promptText.toLowerCase();
  const dateWords = [
    "today",
    "tomorrow",
    "tonight",
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "morning",
    "afternoon",
    "evening",
    "am",
    "pm",
    "o'clock",
    ":00",
    ":30",
    ":15",
    ":45",
  ];
  return dateWords.some((dw) => lower.includes(dw)) || /\d{1,2}(:\d{2})?\s*(am|pm)/i.test(lower);
}

function hasExplicitDoctorMention(promptText: string, allDoctors: any[]): boolean {
  const lower = promptText.toLowerCase();
  if (lower.includes("dr.") || lower.includes("dr ") || lower.includes("doctor")) return true;
  for (const doc of allDoctors) {
    const name = (doc.user?.name || "").toLowerCase().replace(/^dr\.?\s*/i, "");
    if (name.length >= 3 && lower.includes(name)) return true;
  }
  return false;
}

const SPECIALTY_CANONICAL_MAP: Record<string, string> = {
  dermatology: "Dermatology",
  dermatologist: "Dermatology",
  skin: "Dermatology",
  derma: "Dermatology",
  jild: "Dermatology",
  chamri: "Dermatology",
  cardiology: "Cardiology",
  cardiologist: "Cardiology",
  heart: "Cardiology",
  cardio: "Cardiology",
  dil: "Cardiology",
  neurology: "Neurology",
  neurologist: "Neurology",
  neuro: "Neurology",
  brain: "Neurology",
  dimagh: "Neurology",
  dimag: "Neurology",
  pediatrics: "Pediatrics",
  pediatrician: "Pediatrics",
  child: "Pediatrics",
  peds: "Pediatrics",
  bachon: "Pediatrics",
  bacha: "Pediatrics",
  orthopedics: "Orthopedics",
  orthopedic: "Orthopedics",
  ortho: "Orthopedics",
  bone: "Orthopedics",
  haddi: "Orthopedics",
  jor: "Orthopedics",
  gynecology: "Gynecology",
  gynecologist: "Gynecology",
  gynae: "Gynecology",
  obgyn: "Gynecology",
  aurat: "Gynecology",
  khawateen: "Gynecology",
  ent: "ENT",
  ear: "ENT",
  nose: "ENT",
  throat: "ENT",
  otolaryngology: "ENT",
  kaan: "ENT",
  naak: "ENT",
  gala: "ENT",
  ophthalmology: "Ophthalmology",
  ophthalmologist: "Ophthalmology",
  eye: "Ophthalmology",
  vision: "Ophthalmology",
  aankh: "Ophthalmology",
  aankhon: "Ophthalmology",
  psychiatry: "Psychiatry",
  psychiatrist: "Psychiatry",
  mental: "Psychiatry",
  psych: "Psychiatry",
  zehni: "Psychiatry",
  gastroenterology: "Gastroenterology",
  gastroenterologist: "Gastroenterology",
  gastro: "Gastroenterology",
  stomach: "Gastroenterology",
  digestive: "Gastroenterology",
  maida: "Gastroenterology",
  pait: "Gastroenterology",
  pulmonology: "Pulmonology",
  pulmonologist: "Pulmonology",
  pulmo: "Pulmonology",
  chest: "Pulmonology",
  respiratory: "Pulmonology",
  lungs: "Pulmonology",
  saans: "Pulmonology",
  phephray: "Pulmonology",
  phephre: "Pulmonology",
  general: "General Physician",
  physician: "General Physician",
  gp: "General Physician",
  "general physician": "General Physician",
  "general doctor": "General Physician",
};

function normalizeSpecialty(input?: string | null): string {
  if (!input) return "General Physician";
  const lower = input.toLowerCase().trim();
  for (const [key, canonical] of Object.entries(SPECIALTY_CANONICAL_MAP)) {
    if (lower === key || lower.includes(key)) {
      return canonical;
    }
  }
  return input;
}

function hasExplicitSpecialtyMention(promptText: string): string | null {
  const lower = promptText.toLowerCase();
  for (const [key, canonical] of Object.entries(SPECIALTY_CANONICAL_MAP)) {
    if (lower.includes(key)) {
      return canonical;
    }
  }
  return null;
}

function checkMedicalContextInHistory(history: any[]): {
  hasContext: boolean;
  detectedSpecialty?: string;
  recommendedDoctors?: any[];
} {
  if (!Array.isArray(history) || history.length === 0) {
    return { hasContext: false };
  }

  for (let i = history.length - 1; i >= 0; i--) {
    const turn = history[i];
    if (turn.triageResult) {
      return {
        hasContext: true,
        detectedSpecialty: normalizeSpecialty(turn.triageResult.suggestedSpecialty),
        recommendedDoctors: turn.recommendedDoctors,
      };
    }
  }

  const userMessages = history
    .filter((h) => h.role === "user")
    .map((h) => (h.content || "").toLowerCase());
  const symptomKeywords = [
    "pain",
    "ache",
    "fever",
    "cough",
    "rash",
    "dizzy",
    "headache",
    "chest",
    "stomach",
    "bleed",
    "nausea",
    "swelling",
    "vomit",
    "cramp",
    "breath",
    "itch",
    "dard",
    "sar",
    "pait",
    "bukhar",
    "khansi",
    "gala",
    "kharish",
    "chakkar",
    "saans",
  ];
  const hasSymptoms = userMessages.some((msg) =>
    symptomKeywords.some((kw) => msg.includes(kw)),
  );

  return { hasContext: hasSymptoms };
}

function parseBookingDateTime(promptText: string, timezoneOffsetMinutes?: number): Date {
  const lower = promptText.toLowerCase();
  const now = new Date();
  const target = new Date(now);

  if (lower.includes("tomorrow") || lower.includes("kal")) {
    target.setDate(target.getDate() + 1);
  } else if (lower.includes("today") || lower.includes("tonight") || lower.includes("aaj")) {
    // keep today
  } else {
    const daysOfWeek = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const urduDays = ["itwar", "somwar", "mangal", "budh", "jumeraat", "jumma", "hafta"];
    const altUrduDays = ["itwar", "peer", "mangal", "budh", "jumerat", "juma", "hafta"];

    let foundDay = -1;
    for (let i = 0; i < daysOfWeek.length; i++) {
      if (lower.includes(daysOfWeek[i]) || lower.includes(urduDays[i]) || lower.includes(altUrduDays[i])) {
        foundDay = i;
        break;
      }
    }
    if (foundDay !== -1) {
      const currentDay = now.getDay();
      let diff = foundDay - currentDay;
      if (diff <= 0) diff += 7;
      target.setDate(now.getDate() + diff);
    } else {
      // Default to tomorrow
      target.setDate(target.getDate() + 1);
    }
  }

  // Parse time
  const time12Match = lower.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm|baje|bje)/i);
  let hour = 10;
  let minute = 0;

  if (time12Match) {
    hour = parseInt(time12Match[1], 10);
    minute = time12Match[2] ? parseInt(time12Match[2], 10) : 0;
    const meridian = time12Match[3].toLowerCase();
    if (meridian === "pm" && hour < 12) hour += 12;
    if (meridian === "am" && hour === 12) hour = 0;
    if (
      (meridian === "baje" || meridian === "bje") &&
      (lower.includes("shaam") ||
        lower.includes("sham") ||
        lower.includes("raat") ||
        lower.includes("dopahar") ||
        lower.includes("dophar")) &&
      hour < 12
    ) {
      hour += 12;
    }
  } else if (lower.includes("morning") || lower.includes("subah") || lower.includes("subha")) {
    hour = 10;
  } else if (lower.includes("afternoon") || lower.includes("dopahar") || lower.includes("dophar")) {
    hour = 14;
  } else if (lower.includes("evening") || lower.includes("shaam") || lower.includes("sham")) {
    hour = 17;
  } else if (lower.includes("night") || lower.includes("raat")) {
    hour = 20;
  }

  target.setHours(hour, minute, 0, 0);

  if (typeof timezoneOffsetMinutes === "number" && !isNaN(timezoneOffsetMinutes)) {
    const serverOffset = now.getTimezoneOffset();
    const diffMinutes = serverOffset - timezoneOffsetMinutes;
    target.setMinutes(target.getMinutes() + diffMinutes);
  }

  return target;
}

async function resolveDoctorForBooking(
  promptText: string,
  specialty: string,
  history: any[],
) {
  const lower = promptText.toLowerCase();
  const explicitSpec = hasExplicitSpecialtyMention(promptText);
  const targetSpecialty = explicitSpec || normalizeSpecialty(specialty);

  const allDocs = await prisma.doctor.findMany({
    where: { isVerified: true },
    include: {
      user: { select: { id: true, name: true, email: true, avatarUrl: true } },
      hospital: { select: { id: true, name: true, location: true } },
    },
  });

  if (!allDocs || allDocs.length === 0) return null;

  // A. Match doctor name in prompt
  for (const doc of allDocs) {
    const docName = (doc.user?.name || "").toLowerCase();
    const cleanName = docName.replace(/^dr\.?\s*/i, "");
    if (docName && (lower.includes(docName) || (cleanName.length >= 3 && lower.includes(cleanName)))) {
      return doc;
    }
  }

  // B. Match doctor by targeted specialty FIRST
  if (targetSpecialty) {
    const specMatch = allDocs.find((d) =>
      d.specialty.toLowerCase().includes(targetSpecialty.toLowerCase()) ||
      targetSpecialty.toLowerCase().includes(d.specialty.toLowerCase()),
    );
    if (specMatch) return specMatch;
    if (explicitSpec) return null;
  }

  // C. Match doctor mentioned in recent history
  if (Array.isArray(history) && history.length > 0) {
    for (let i = history.length - 1; i >= 0; i--) {
      const turn = history[i];
      if (turn.bookingResult?.doctorId) {
        const match = allDocs.find((d) => d.id === turn.bookingResult.doctorId);
        if (match) return match;
      }
      if (turn.recommendedDoctors && Array.isArray(turn.recommendedDoctors) && turn.recommendedDoctors.length > 0) {
        const firstRec = turn.recommendedDoctors[0];
        const match = allDocs.find((d) => d.id === firstRec.id);
        if (match) return match;
      }
    }
  }

  return allDocs[0] || null;
}

function cleanJsonString(raw: string): string {
  let text = raw.trim();
  if (text.startsWith("```")) {
    text = text.replace(/^```[a-zA-Z]*\n?/, "").replace(/\n?```$/, "").trim();
  }
  return text;
}

async function callOpenAIApi(
  apiKey: string,
  systemInstruction: string,
  newPrompt: string,
  conversationHistory: { role: string; content: string }[],
): Promise<LLMTurnResponse | null> {
  try {
    const messages = [
      { role: "system", content: systemInstruction },
      ...conversationHistory.map((turn) => ({
        role: turn.role === "user" ? "user" : "assistant",
        content: turn.content,
      })),
      { role: "user", content: newPrompt },
    ];

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages,
        temperature: 0.2,
      }),
    });

    if (!res.ok) {
      console.warn("[LIVE AI] OpenAI API returned error status:", res.status);
      return null;
    }

    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) return null;

    const parsed = JSON.parse(cleanJsonString(content));
    if (parsed && typeof parsed.messageContent === "string") {
      if (parsed.triageResult) {
        parsed.triageResult.disclaimer = MEDICAL_DISCLAIMER;
      }
      return parsed as LLMTurnResponse;
    }
    return null;
  } catch (err) {
    console.error("[LIVE AI] OpenAI generation error: ", err);
    return null;
  }
}

let workingGeminiModel: { model: string; apiVersion: "v1beta" | "v1" } | null = null;
let cachedGeminiModels: string[] | null = null;

async function getAvailableGeminiModels(apiKey: string): Promise<string[]> {
  if (cachedGeminiModels && cachedGeminiModels.length > 0) {
    return cachedGeminiModels;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.models)) {
        const available = data.models
          .filter((m: any) => {
            const name = (m.name || "").toLowerCase();
            const methods = Array.isArray(m.supportedGenerationMethods) ? m.supportedGenerationMethods : [];
            const isGenerate = methods.includes("generateContent");
            const isIgnored =
              name.includes("embedding") ||
              name.includes("imagen") ||
              name.includes("aqa") ||
              name.includes("tts") ||
              name.includes("whisper") ||
              name.includes("bison") ||
              name.includes("gecko");
            return isGenerate && !isIgnored;
          })
          .map((m: any) => m.name.replace(/^models\//, ""));

        // Sort Flash and lightweight models to top for fastest speed
        available.sort((a: string, b: string) => {
          const aFlash = a.includes("flash") ? 1 : 0;
          const bFlash = b.includes("flash") ? 1 : 0;
          return bFlash - aFlash;
        });

        if (available.length > 0) {
          cachedGeminiModels = available;
          return available;
        }
      }
    }
  } catch {
    // fast fallback
  }

  return [];
}

async function callGeminiCandidate(
  apiKey: string,
  modelName: string,
  apiVersion: "v1beta" | "v1",
  contents: { role: string; parts: { text: string }[] }[],
): Promise<LLMTurnResponse | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const url = `https://generativelanguage.googleapis.com/${apiVersion}/models/${modelName}:generateContent?key=${apiKey}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        contents,
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.2,
        },
      }),
    });
    clearTimeout(timeout);

    if (!res.ok) {
      return null;
    }

    const data = await res.json();
    const textContent = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!textContent) return null;

    const parsed = JSON.parse(cleanJsonString(textContent));
    if (parsed && typeof parsed.messageContent === "string") {
      if (parsed.triageResult) {
        parsed.triageResult.disclaimer = MEDICAL_DISCLAIMER;
      }
      // Remember working model for instant subsequent responses
      workingGeminiModel = { model: modelName, apiVersion };
      return parsed as LLMTurnResponse;
    }

    return null;
  } catch {
    return null;
  }
}

async function callLiveLLMApi(
  apiKey: string,
  newPrompt: string,
  specialty: string,
  trainingContext: string,
  conversationHistory: { role: string; content: string }[],
  duration?: string,
  conditions?: string[],
  medicines?: string[],
  treatmentApproach?: string,
): Promise<LLMTurnResponse | null> {
  try {
    const systemInstruction = `You are a certified Clinical AI Intake and Triage Specialist for the Medicio Platform.
You adhere strictly to certified global clinical protocols: World Health Organization (WHO), UK National Health Service (NHS 111), and NICE Guidelines.

DOCTRONIC-STYLE CLINICAL CONVERSATIONAL INTAKE PROTOCOL:
1. **Ultra-Concise Responses (Strict Rule)**: Keep all conversational text extremely short, natural, and direct (maximum 1-3 sentences per turn). NEVER write long essays or walls of text during intake counter-questioning.
2. **Sequential Diagnostic Clearance (One-By-One Counter-Questions)**:
   Do NOT dump multiple questions at once. Conduct a step-by-step diagnostic clearance:
   - **Turn 1**: Acknowledge symptoms empathetically + ask **ONSET & DURATION** (e.g., "I'm sorry to hear that. How many days have you had this symptom?")
   - **Turn 2**: Ask **PAIN CHARACTER / SEVERITY (1-10)** (e.g., "Is the discomfort sharp, throbbing, or a dull ache?")
   - **Turn 3**: Ask **ASSOCIATED SYMPTOMS & RED FLAGS** (e.g., "Are you also experiencing fever, nausea, or dizziness?")
   - **Turn 4**: Ask **COMORBIDITIES & MEDICATIONS** if not already provided in baseline parameters.
3. **Quick Reply Suggestions**: ALWAYS provide 2-4 short, clickable option strings in "suggestedQuickReplies" that directly answer your counter-question (e.g., ["1-2 days", "3-5 days", "Over a week"] or ["Mild (1-3)", "Moderate (4-6)", "Severe (7-10)"] or ["No fever", "Low fever", "High fever"]).
4. **Pattern Completion & Triage Report Trigger**:
   - Set "isComplete": false and "triageResult": null while conducting sequential counter-questioning across Turns 1-3.
   - ONLY set "isComplete": true and populate "triageResult" AFTER you have gathered sufficient clinical clarity across turns (or if the patient presents with an obvious emergency red flag or provides a complete clinical picture upfront).
5. **Post-Triage Follow-ups**: If a triage report was ALREADY generated earlier in the conversation history, set "isComplete": false and "triageResult": null, and answer any follow-up questions concisely (1-2 sentences).
6. **Language Mirroring**: Detect and mirror the patient's language (English or Roman Urdu). If Roman Urdu, reply in Roman Urdu (e.g. 'Aapko ye dard kitne din se hai?').

Specialist AI Directives for ${specialty}:
${trainingContext || "Perform empathetic, structured clinical intake and evidence-based triage."}

Patient Baseline Intake Parameters (if pre-configured):
- Duration: ${duration || "Not specified"}
- Pre-existing Conditions: ${conditions?.join(", ") || "None reported"}
- Active Medications: ${medicines?.join(", ") || "None reported"}
- Care Paradigm: ${treatmentApproach || "Allopathic / Conventional"}

You MUST respond ONLY with a valid JSON object matching this exact schema:
{
  "isComplete": boolean,
  "messageContent": "Ultra-short conversational text (1-3 sentences) asking your ONE focused counter-question or presenting final assessment.",
  "suggestedQuickReplies": ["Short Option 1", "Short Option 2", "Short Option 3"],
  "triageResult": {
    "severityLevel": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
    "summary": "Evidence-based summary of presentation and recommended next steps.",
    "clinicalImpression": "Detailed medical rationale explaining suspected differentials.",
    "possibleConditions": [
      {
        "condition": "Official Condition Name",
        "icd11Code": "ICD-11 Code (e.g. CA40, BA80)",
        "likelihood": "High" | "Moderate" | "Low",
        "description": "Clinical details and diagnostic rationale",
        "sourceGuideline": "Certified Guideline (e.g. WHO / NICE / NHS 111)"
      }
    ],
    "recommendDoctor": boolean,
    "suggestedSpecialty": "Dermatology" | "Cardiology" | "Neurology" | "Pediatrics" | "Orthopedics" | "Gynecology" | "ENT" | "Ophthalmology" | "Psychiatry" | "Gastroenterology" | "Pulmonology" | "General Physician",
    "temporaryMedicines": [
      {
        "name": "Medication Name (e.g. Paracetamol)",
        "dosage": "Standard certified adult dosage",
        "purpose": "Symptom relief purpose",
        "warning": "Safe use guidelines",
        "contraindicationAlert": "Explicit warning if contraindicated for patient's comorbidities"
      }
    ],
    "precautions": ["Evidence-based self-care precaution 1", "Precaution 2"],
    "redFlagsToWatch": ["Specific warning sign 1 requiring immediate ER care"],
    "questionsForDoctor": ["Key clinical question 1 for in-person consultation"],
    "disclaimer": "${MEDICAL_DISCLAIMER}"
  }
}
Note: "triageResult" is required when "isComplete" is true. When "isComplete" is false, "triageResult" should be null.
`;

    // 1. If OpenAI API key provided
    if (apiKey.startsWith("sk-") || process.env.OPENAI_API_KEY) {
      const openAiKey = apiKey.startsWith("sk-") ? apiKey : (process.env.OPENAI_API_KEY as string);
      const res = await callOpenAIApi(openAiKey, systemInstruction, newPrompt, conversationHistory);
      if (res) return res;
    }

    // 2. Google Gemini multi-turn payload
    const contents: { role: string; parts: { text: string }[] }[] = [];
    contents.push({
      role: "user",
      parts: [{ text: `[System Instructions & Clinical Directives]\n${systemInstruction}` }],
    });
    contents.push({
      role: "model",
      parts: [{ text: "Understood. I will conduct one-by-one conversational clinical triage according to certified WHO/NHS 111/NICE protocols and respond strictly with the requested JSON schema." }],
    });

    for (const turn of conversationHistory) {
      if (turn.content && turn.content.trim()) {
        contents.push({
          role: turn.role === "user" ? "user" : "model",
          parts: [{ text: turn.content.trim() }],
        });
      }
    }

    contents.push({
      role: "user",
      parts: [{ text: newPrompt.trim() }],
    });

    // Step A: If we already found the working model, invoke it immediately! (sub-second response)
    if (workingGeminiModel) {
      const fastResult = await callGeminiCandidate(apiKey, workingGeminiModel.model, workingGeminiModel.apiVersion, contents);
      if (fastResult) return fastResult;
      workingGeminiModel = null; // Reset if expired
    }

    // Step B: Top fast candidates
    const fastPriorityCandidates: { model: string; apiVersion: "v1beta" | "v1" }[] = [
      { model: "gemini-2.5-flash", apiVersion: "v1beta" },
      { model: "gemini-2.0-flash", apiVersion: "v1beta" },
      { model: "gemini-1.5-flash", apiVersion: "v1beta" },
      { model: "gemini-1.5-flash-latest", apiVersion: "v1beta" },
      { model: "gemini-1.5-flash-8b", apiVersion: "v1beta" },
      { model: "gemini-3.6-flash", apiVersion: "v1beta" },
      { model: "gemini-1.5-pro", apiVersion: "v1beta" },
      { model: "gemini-1.5-flash", apiVersion: "v1" },
      { model: "gemini-pro", apiVersion: "v1" },
    ];

    for (const config of fastPriorityCandidates) {
      const result = await callGeminiCandidate(apiKey, config.model, config.apiVersion, contents);
      if (result) {
        return result;
      }
    }

    // Step C: Dynamic discovery fallback
    const discoveredModels = await getAvailableGeminiModels(apiKey);
    for (const model of discoveredModels) {
      const result = await callGeminiCandidate(apiKey, model, "v1beta", contents);
      if (result) {
        return result;
      }
    }

    return null;
  } catch (err) {
    console.error("[LIVE AI] Error executing live LLM generation: ", err);
    return null;
  }
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
      duration,
      preExistingConditions = [],
      currentMedicines = [],
      treatmentApproach = "Allopathic",
      conversationId,
      coordinates,
      locationName,
      radiusKm = 10,
      timezoneOffset,
      history = [],
    } = body;

    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return NextResponse.json(
        { error: "Symptom prompt is required for clinical intake." },
        { status: 400 },
      );
    }

    const trimmedPrompt = prompt.trim();

    // 0. STRICT API KEY GATE: Ensure a live AI API key is configured
    const apiKey = process.env.GEMINI_API_KEY || process.env.AI_API_KEY || process.env.OPENAI_API_KEY;

    if (!apiKey || apiKey.trim() === "" || apiKey === "your_gemini_api_key_here") {
      return NextResponse.json({
        success: false,
        responseType: "API_KEY_REQUIRED",
        content:
          "**Medicio AI Engine Configuration Required**\n\nThe Medicio AI Chatbot strictly requires an active AI API Key (`GEMINI_API_KEY` or `OPENAI_API_KEY`) configured in your `.env` file to generate live clinical triage and specialty models.\n\nTo activate live conversational triage:\n1. Open your `.env` file in the project root.\n2. Add your Google Gemini API key: `GEMINI_API_KEY=\"AIzaSy...\"`\n3. Save the file and restart your Next.js server (`npm run dev`).",
        conversationId: conversationId || null,
      });
    }

    // Ensure all specialist models are initialized and trained in DB
    await ensureSpecialistAgents(prisma);

    // 1. SPECIALIST MODEL READINESS GATE
    const { agent, attachedDoctors } = await getAgentWithDoctors(prisma, agentSpecialty);
    const modelIsReady = !!agent && agent.isEnabled && computeIsTrained(agent, attachedDoctors);

    if (!modelIsReady) {
      const modelName = agent?.displayName || "This specialist model";

      return NextResponse.json({
        success: true,
        responseType: "MODEL_UNAVAILABLE",
        content: `${modelName} is currently updating its certified clinical training protocols. Please switch to General AI Triage or another active specialist model.`,
        conversationId: conversationId || null,
      });
    }

    const trainingContext = buildTrainingContext(agent, attachedDoctors);

    // 2. OUT-OF-SCOPE & NON-MEDICAL PROMPT FILTER
    const outOfScopeCheck = checkOutOfScopeQuery(trimmedPrompt);
    if (outOfScopeCheck.isOutOfScope) {
      return NextResponse.json({
        success: true,
        responseType: "OUT_OF_SCOPE",
        content: outOfScopeCheck.apologyMessage,
        conversationId: conversationId || null,
      });
    }

    const isUrdu = isRomanUrdu(trimmedPrompt);

    // 3. GREETING & PLEASANTRY CHECK
    if (isSimpleGreeting(trimmedPrompt)) {
      const hasHistory = Array.isArray(history) && history.length > 0;
      const greetingMessage = isUrdu
        ? hasHistory
          ? "Assalam o Alaikum! Main aapki mazeed kya madad kar sakta hoon? Agar aapko koi aur takleef hai to batayein, ya naya session shuru karne ke liye '+' button dabayein."
          : `Assalam o Alaikum! Main Medicio AI Clinical Assistant (${agent.displayName}) hoon. Main aapki sehat ke hawalay se kis tarah madad kar sakta hoon? Barah-e-karam apni takleef ya alamaat batayein.`
        : hasHistory
        ? `Hello! How can I assist you further? If you're experiencing any other symptoms or have questions regarding your assessment, let me know. You can also click the '+' button in the top bar to start a fresh triage session.`
        : `Hello! I am your Medicio AI Clinical Assistant (${agent.displayName}). How can I assist with your health today? Please describe your symptoms or physical concerns to begin guided clinical triage.`;

      return NextResponse.json({
        success: true,
        responseType: "GREETING",
        content: greetingMessage,
        conversationId: conversationId || null,
      });
    }

    if (isSimplePleasantry(trimmedPrompt)) {
      return NextResponse.json({
        success: true,
        responseType: "GREETING",
        content: isUrdu
          ? "Bohot shukriya! Apna khayal rakhein, ehtiyati tadabeer par amal karein, aur agar takleef barhe to foran doctor se rujoo karein."
          : "You're very welcome! Please take care, follow your care precautions, and don't hesitate to book a slot with a registered doctor if your symptoms change or worsen.",
        conversationId: conversationId || null,
      });
    }

    // 3.5 CONVERSATIONAL APPOINTMENT BOOKING FLOW
    const isConfirming = isBookingConfirmation(trimmedPrompt);
    const isBooking = isBookingIntent(trimmedPrompt) || isConfirming;

    if (isBooking) {
      const allDocs = await prisma.doctor.findMany({
        where: { isVerified: true },
        include: {
          user: { select: { id: true, name: true, email: true, avatarUrl: true } },
          hospital: { select: { id: true, name: true, location: true } },
        },
      });

      const medicalContext = checkMedicalContextInHistory(history);
      const explicitSpecialty = hasExplicitSpecialtyMention(trimmedPrompt);
      const explicitDoctor = hasExplicitDoctorMention(trimmedPrompt, allDocs);
      const explicitDateTime = hasExplicitDateTime(trimmedPrompt);

      // STEP 1: If user says "Confirm" or is confirming a previous preview
      if (isConfirming) {
        const targetDoctor = await resolveDoctorForBooking(trimmedPrompt, agentSpecialty, history);
        const scheduledDateTime = parseBookingDateTime(trimmedPrompt, timezoneOffset);

        if (targetDoctor) {
          const formattedDate = scheduledDateTime.toLocaleDateString(undefined, {
            weekday: "short",
            month: "short",
            day: "numeric",
            year: "numeric",
          });
          const formattedTime = scheduledDateTime.toLocaleTimeString(undefined, {
            hour: "2-digit",
            minute: "2-digit",
          });

          if (session && session.userId) {
            const appointment = await prisma.appointment.create({
              data: {
                patientId: session.userId,
                doctorId: targetDoctor.id,
                dateTime: scheduledDateTime,
                status: "PENDING",
                notes: `Confirmed booking via AI Assistant: "${trimmedPrompt}"`,
              },
              include: {
                patient: { select: { id: true, name: true, email: true } },
                doctor: {
                  include: {
                    user: { select: { id: true, name: true, email: true, avatarUrl: true } },
                    hospital: { select: { id: true, name: true, location: true } },
                  },
                },
              },
            });

            await notify({
              userId: targetDoctor.userId,
              type: "APPOINTMENT",
              title: "New AI Appointment Request",
              body: `${appointment.patient?.name || "A patient"} requested an appointment on ${appointment.dateTime.toLocaleString()} via AI Chatbot.`,
              href: "/doctor/appointments",
              metadata: { appointmentId: appointment.id, status: "PENDING" },
            });

            if (appointment.patient?.email && appointment.doctor?.user?.email) {
              await sendAppointmentBookedEmail({
                patientEmail: appointment.patient.email,
                patientName: appointment.patient.name || "Patient",
                doctorEmail: appointment.doctor.user.email,
                doctorName: appointment.doctor.user.name || "Doctor",
                dateTime: appointment.dateTime.toLocaleString(),
                notes: appointment.notes || undefined,
              });

              await writeAudit({
                action: "APPOINTMENT_BOOKED_EMAIL_SENT",
                actorId: session.userId,
                actorRole: session.role,
                entityType: "APPOINTMENT",
                entityId: appointment.id,
                metadata: {
                  patientEmail: appointment.patient.email,
                  doctorEmail: appointment.doctor.user.email,
                  dateTime: appointment.dateTime,
                },
              });
            }

            const bookingResult: AppointmentBookingData = {
              appointmentId: appointment.id,
              doctorId: appointment.doctorId,
              doctorName: appointment.doctor.user.name,
              doctorSpecialty: appointment.doctor.specialty,
              doctorAvatar: appointment.doctor.user.avatarUrl,
              hospitalName: appointment.doctor.hospital?.name || null,
              clinicAddress: appointment.doctor.clinicAddress || appointment.doctor.hospital?.location || "Medicio Health Center",
              consultationFee: appointment.doctor.consultationFee ?? 50,
              dateTime: scheduledDateTime.toISOString(),
              status: "PENDING",
              notes: appointment.notes,
            };

            const confirmedContent = isUrdu
              ? `**Appointment Request Jama Ho Chuki Hai**\n\n**Dr. ${appointment.doctor.user.name}** (${appointment.doctor.specialty}) ke sath aapki appointment **${formattedDate} ko ${formattedTime}** ke liye reserve kar di gayi hai.\n\nDoctor ko notification aur confirmation email bhej di gayi hai. Aap appointments dashboard mein iska status dekh sakte hain.`
              : `**Appointment Confirmed & Submitted**\n\nYour appointment with **Dr. ${appointment.doctor.user.name}** (${appointment.doctor.specialty}) has been reserved for **${formattedDate} at ${formattedTime}**.\n\nA notification and confirmation email have been sent to the doctor. You can track or modify this booking anytime in your appointments dashboard.`;

            return NextResponse.json({
              success: true,
              responseType: "BOOKING_CONFIRMED",
              content: confirmedContent,
              bookingResult,
              conversationId: conversationId || null,
            });
          } else {
            const bookingResult: AppointmentBookingData = {
              doctorId: targetDoctor.id,
              doctorName: targetDoctor.user.name,
              doctorSpecialty: targetDoctor.specialty,
              doctorAvatar: targetDoctor.user.avatarUrl,
              hospitalName: targetDoctor.hospital?.name || null,
              clinicAddress: targetDoctor.clinicAddress || targetDoctor.hospital?.location || "Medicio Health Center",
              consultationFee: targetDoctor.consultationFee ?? 50,
              dateTime: scheduledDateTime.toISOString(),
              status: "AUTH_REQUIRED",
              notes: `Prompt booking via AI Assistant: "${trimmedPrompt}"`,
            };

            const authContent = isUrdu
              ? `**Appointment Slot Tayyar Hai**\n\nMaine **Dr. ${targetDoctor.user.name}** ke sath **${formattedDate} ko ${formattedTime}** ke liye aapka slot tayyar kar diya hai.\n\nBarah-e-karam booking finalize karne ke liye apne Medicio account mein login karein.`
              : `**Appointment Slot Prepared**\n\nI have prepared your appointment request with **Dr. ${targetDoctor.user.name}** for **${formattedDate} at ${formattedTime}**.\n\nPlease sign in to your Medicio account to finalize this booking.`;

            return NextResponse.json({
              success: true,
              responseType: "BOOKING_AUTH_REQUIRED",
              content: authContent,
              bookingResult,
              conversationId: conversationId || null,
            });
          }
        }
      }

      // STEP 2: If user sends general "book a slot" without any symptoms / medical context or doctor
      if (!medicalContext.hasContext && !explicitDoctor && !explicitSpecialty) {
        const askReasonContent = isUrdu
          ? "Main aapki appointment book karne mein zaroor madad karunga! Barah-e-karam apni takleef ya bimari thori tafseel se batayein taake main aapko sahi specialist doctor (maslan Dermatology, Cardiology, ya General Physician) suggest kar sakoon.\n\n*(Agar aapko pehle se kisi makhsoos doctor ya specialty ka pata hai, to aap seedha keh sakte hain: 'Dr. Sarah Jenkins se appointment chahiye' ya 'Dermatologist book karna hai')*"
          : "I'd be glad to help you schedule an appointment! Could you briefly share what symptoms or health concerns you are experiencing? This helps me recommend the appropriate specialist (such as Cardiology, Dermatology, or General Physician) and find the best doctor for you.\n\n*(Alternatively, if you already have a doctor or specialty in mind, you can simply say: 'Book with Dr. Aisha' or 'Book a cardiologist')*";

        return NextResponse.json({
          success: true,
          responseType: "CONVERSATION_TURN",
          content: askReasonContent,
          conversationId: conversationId || null,
        });
      }

      // STEP 3: Specialty is known / triaged, but user hasn't chosen a specific doctor
      const targetSpecialty = explicitSpecialty || normalizeSpecialty(medicalContext.detectedSpecialty || agentSpecialty);
      if (!explicitDoctor && !isConfirming) {
        const matchingDocs = allDocs.filter(
          (d) =>
            d.specialty.toLowerCase().includes(targetSpecialty.toLowerCase()) ||
            targetSpecialty.toLowerCase().includes(d.specialty.toLowerCase()),
        );
        const docsToList = matchingDocs.length > 0 ? matchingDocs : allDocs.slice(0, 3);

        const docListText = docsToList
          .map(
            (d) =>
              `• **Dr. ${d.user.name}** (${d.specialty} · ${d.hospital?.name || d.clinicAddress || "Medicio Health Center"}${d.consultationFee ? ` · Fee: $${d.consultationFee}` : ""})`,
          )
          .join("\n");

        const listDoctorsContent = isUrdu
          ? `Yeh hamare verified **${targetSpecialty}** specialists dastiyab hain:\n\n${docListText}\n\nAap kis doctor ko dikhana chahenge, aur konsa din aur waqt (maslan *'Kal subah 10:00 baje'* ya *'Jumma dopahar 2:00 baje'*) aapke liye behtar rahega?`
          : `Here are our verified **${targetSpecialty}** specialists available for consultation:\n\n${docListText}\n\nWhich doctor would you like to see, and what preferred day and time (e.g. *'Tomorrow at 10:00 AM'* or *'Friday at 2:00 PM'*) works best for you?`;

        return NextResponse.json({
          success: true,
          responseType: "CONVERSATION_TURN",
          content: listDoctorsContent,
          conversationId: conversationId || null,
        });
      }

      // STEP 4: Doctor is selected, but NO day/time is provided
      const targetDoctor = await resolveDoctorForBooking(trimmedPrompt, targetSpecialty, history);
      if (!explicitDateTime && targetDoctor) {
        const askTimeContent = isUrdu
          ? `Aap **Dr. ${targetDoctor.user.name}** (${targetDoctor.specialty}) se kis din aur kis waqt appointment lena chahenge? (Maslan: *'Kal subah 10:00 baje'*, *'Somwar dopahar 2:30 baje'*, ya *'Jumma shaam'*).`
          : `What preferred day and time would you like for your appointment with **Dr. ${targetDoctor.user.name}** (${targetDoctor.specialty})? (e.g., *'Tomorrow at 10:00 AM'*, *'Monday at 2:30 PM'*, or *'Friday afternoon'*).`;

        return NextResponse.json({
          success: true,
          responseType: "CONVERSATION_TURN",
          content: askTimeContent,
          conversationId: conversationId || null,
        });
      }

      // STEP 5: Doctor AND Date/Time are identified -> Show PREVIEW & CONFIRMATION Card
      if (targetDoctor) {
        const scheduledDateTime = parseBookingDateTime(trimmedPrompt, timezoneOffset);
        const formattedDate = scheduledDateTime.toLocaleDateString(undefined, {
          weekday: "short",
          month: "short",
          day: "numeric",
          year: "numeric",
        });
        const formattedTime = scheduledDateTime.toLocaleTimeString(undefined, {
          hour: "2-digit",
          minute: "2-digit",
        });

        const bookingResult: AppointmentBookingData = {
          doctorId: targetDoctor.id,
          doctorName: targetDoctor.user.name,
          doctorSpecialty: targetDoctor.specialty,
          doctorAvatar: targetDoctor.user.avatarUrl,
          hospitalName: targetDoctor.hospital?.name || null,
          clinicAddress: targetDoctor.clinicAddress || targetDoctor.hospital?.location || "Medicio Health Center",
          consultationFee: targetDoctor.consultationFee ?? 50,
          dateTime: scheduledDateTime.toISOString(),
          status: "PREVIEW",
          notes: `Proposed booking via AI Assistant: "${trimmedPrompt}"`,
        };

        const previewContent = isUrdu
          ? `**Barah-e-Karam Appointment Ki Tafseelat Check Karein**\n\nMaine **Dr. ${targetDoctor.user.name}** (${targetDoctor.specialty}) ke sath aapki appointment **${formattedDate} ko ${formattedTime}** ke liye tayyar kar di hai.\n\nNeeche di gayi details check karein aur confirm karne ke liye **Confirm Booking** par click karein, ya waqt tabdeel karne ke liye batayein.`
          : `**Please Review & Confirm Your Appointment**\n\nI have prepared your appointment request with **Dr. ${targetDoctor.user.name}** (${targetDoctor.specialty}) for **${formattedDate} at ${formattedTime}**.\n\nPlease review the details below and click **Confirm Booking** to submit your reservation, or let me know if you would like to adjust the day or time.`;

        return NextResponse.json({
          success: true,
          responseType: "BOOKING_PREVIEW",
          content: previewContent,
          bookingResult,
          conversationId: conversationId || null,
        });
      }
    }

    // 4. PREPARE CONVERSATION HISTORY
    let conversationHistory: { role: string; content: string }[] = [];

    if (Array.isArray(history) && history.length > 0) {
      conversationHistory = history.map((h: any) => ({
        role: h.role === "user" ? "user" : "model",
        content: typeof h.content === "string" ? h.content : "",
      }));
    } else if (conversationId) {
      const existingConv = await prisma.aIConversation.findUnique({
        where: { id: conversationId },
      });
      if (existingConv) {
        try {
          const parsed = JSON.parse(existingConv.messages);
          if (Array.isArray(parsed)) {
            conversationHistory = parsed.map((m: any) => ({
              role: m.role === "user" ? "user" : "model",
              content: m.content || "",
            }));
          }
        } catch {
          // continue
        }
      }
    }

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

    // 5. CALL LIVE LLM ENGINE (One-By-One Conversational Protocol)
    const liveResult = await callLiveLLMApi(
      apiKey,
      trimmedPrompt,
      agentSpecialty,
      trainingContext,
      conversationHistory,
      duration,
      conditionsArray,
      medicinesArray,
      treatmentApproach,
    );

    if (!liveResult) {
      return NextResponse.json({
        success: false,
        responseType: "SERVER_ERROR",
        error: "The AI model encountered a temporary issue. Please check your API key or try again in a moment.",
        conversationId: conversationId || null,
      }, { status: 502 });
    }

    // 6. IF TRIAGE IS COMPLETE, QUERY MATCHING DOCTORS, PHARMACIES, LABS
    let recommendedDoctors: any[] = [];
    let pharmacies: any[] = [];
    let labs: any[] = [];

    if (liveResult.isComplete && liveResult.triageResult) {
      const rawSpecialty = liveResult.triageResult.suggestedSpecialty || agentSpecialty;
      const targetSpecialty = normalizeSpecialty(rawSpecialty);

      const matchingDocs = await prisma.doctor.findMany({
        where: {
          isVerified: true,
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

      recommendedDoctors = matchingDocs.map((doc) => ({
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
        const fallbackDocs = await prisma.doctor.findMany({
          take: 3,
          include: {
            user: { select: { name: true, email: true, avatarUrl: true } },
            hospital: { select: { name: true, location: true } },
          },
        });

        recommendedDoctors = fallbackDocs.map((doc) => ({
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

      pharmacies = await prisma.pharmacy.findMany({
        take: 3,
        select: { id: true, name: true, location: true, isVerified: true },
      });

      labs = await prisma.lab.findMany({
        take: 3,
        select: { id: true, name: true, isVerified: true },
      });
    }

    // 7. SAVE CONVERSATION TURN TO DATABASE
    let savedConversationId = conversationId;
    const conversationMessages = [
      {
        role: "user",
        content: trimmedPrompt,
        timestamp: new Date().toISOString(),
      },
      {
        role: "assistant",
        content: liveResult.messageContent,
        triageResult: liveResult.triageResult || null,
        suggestedQuickReplies: liveResult.suggestedQuickReplies || null,
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
        isComplete: liveResult.isComplete,
        severityLevel: liveResult.triageResult?.severityLevel || null,
        isLiveAIUsed: true,
        coordinates: coordinates || null,
        locationName: locationName || null,
        radiusKm,
      },
    });

    return NextResponse.json({
      success: true,
      responseType: liveResult.isComplete ? "TRIAGE_COMPLETE" : "CONVERSATION_TURN",
      conversationId: savedConversationId,
      isLiveAIUsed: true,
      isComplete: liveResult.isComplete,
      content: liveResult.messageContent,
      suggestedQuickReplies: liveResult.suggestedQuickReplies || [],
      triageResult: liveResult.triageResult || null,
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
