import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { writeAudit } from "@/lib/audit";
import { getSession } from "@/lib/auth";
import type { TriageResult } from "@/lib/medical-knowledge";
import {
  checkOutOfScopeQuery,
  MEDICAL_DISCLAIMER,
} from "@/lib/medical-knowledge";
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
];

function isSimpleGreeting(promptText: string): boolean {
  const clean = promptText.trim().toLowerCase().replace(/[^a-z0-9\s]/g, "");
  const words = clean.split(/\s+/).filter(Boolean);
  return (words.length <= 3 && words.some((w) => GREETING_KEYWORDS.includes(w))) || GREETING_KEYWORDS.includes(clean);
}

function isSimplePleasantry(promptText: string): boolean {
  const clean = promptText.trim().toLowerCase().replace(/[^a-z0-9\s]/g, "");
  return (
    PLEASANTRY_KEYWORDS.includes(clean) ||
    (clean.length <= 20 && PLEASANTRY_KEYWORDS.some((kw) => clean === kw || clean.startsWith(kw)))
  );
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

Specialist AI Directives for ${specialty}:
${trainingContext || "Perform empathetic, structured clinical intake and evidence-based triage."}

Patient Baseline Intake Parameters (if pre-configured):
- Duration: ${duration || "Not specified"}
- Pre-existing Conditions: ${conditions?.join(", ") || "None reported"}
- Active Medications: ${medicines?.join(", ") || "None reported"}
- Care Paradigm: ${treatmentApproach || "Allopathic / Conventional"}

CRITICAL CONVERSATIONAL RULES:
1. **One-By-One Questioning**: If the patient's presentation is missing key clinical details (e.g. onset & duration, severity 1-10, chronic comorbidities like Diabetes/Hypertension/Asthma, active medications, or specialty red flags), DO NOT dump a bulk form of questions. Instead, ask **EXACTLY ONE focused, empathetic follow-up question at a time**.
2. **Completion & No Duplicate Reports**: If the clinical intake is complete for the first time, set "isComplete": true and populate the full "triageResult". However, **if a triage assessment report was ALREADY provided earlier in the conversation history**, set "isComplete": false and "triageResult": null, and simply answer the patient's follow-up questions or conversational remarks directly in "messageContent".
3. **Safety & Contraindications**: Always cross-reference the patient's reported comorbidities (e.g. Hypertension, Peptic Ulcers, Kidney Disease, Asthma) before recommending any OTC medications in "triageResult".
4. **Red Flags & Urgent Care**: If life-threatening red flags are present (crushing chest pain radiating to jaw/arm, sudden slurred speech/facial droop, severe dyspnea), immediately mark severity as "CRITICAL" and advise emergency ER/911 care.

You MUST respond ONLY with a valid JSON object matching this exact schema:
{
  "isComplete": boolean,
  "messageContent": "Conversational reply text formatted in clean Markdown (empathetic acknowledgment, then your ONE follow-up question or complete clinical findings).",
  "triageResult": {
    "severityLevel": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
    "summary": "Evidence-based summary of presentation and recommended next steps.",
    "clinicalImpression": "Detailed medical rationale explaining suspected differentials and how duration/comorbidities influenced the assessment.",
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
        "contraindicationAlert": "Explicit warning if contraindicated for patient's comorbidities (e.g. avoid NSAIDs in hypertension/ulcers)"
      }
    ],
    "precautions": ["Evidence-based self-care precaution 1", "Precaution 2"],
    "redFlagsToWatch": ["Specific warning sign 1 requiring immediate ER care", "Warning sign 2"],
    "questionsForDoctor": ["Key clinical question 1 for in-person consultation", "Question 2"],
    "disclaimer": "${MEDICAL_DISCLAIMER}"
  }
}
Note: "triageResult" is required when "isComplete" is true. When "isComplete" is false, "triageResult" can be omitted or null.
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

    // 3. GREETING & PLEASANTRY CHECK
    if (isSimpleGreeting(trimmedPrompt)) {
      const hasHistory = Array.isArray(history) && history.length > 0;
      const greetingMessage = hasHistory
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
        content:
          "You're very welcome! Please take care, follow your care precautions, and don't hesitate to book a slot with a registered doctor if your symptoms change or worsen.",
        conversationId: conversationId || null,
      });
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
        error: "Live AI model was unable to process the request. Please check your API key and connection.",
      }, { status: 502 });
    }

    // 6. IF TRIAGE IS COMPLETE, QUERY MATCHING DOCTORS, PHARMACIES, LABS
    let recommendedDoctors: any[] = [];
    let pharmacies: any[] = [];
    let labs: any[] = [];

    if (liveResult.isComplete && liveResult.triageResult) {
      const targetSpecialty = liveResult.triageResult.suggestedSpecialty || agentSpecialty;

      const matchingDocs = await prisma.doctor.findMany({
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
