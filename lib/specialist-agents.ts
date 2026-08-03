import type { PrismaClient, SpecialistAgent } from "@prisma/client";

export interface SpecialistDef {
  specialty: string;
  displayName: string;
  description: string;
  defaultTrainingData: string | null;
  defaultSuggestedQuestions: string[];
}

export interface DoctorTraining {
  agentName?: string;
  agentTone?: string;
  specialty?: string;
  emergencyRedFlags?: string[];
  intakeProtocols?: string;
  practiceBoundaries?: string;
  customDisclaimer?: string;
  triageAdviceRules?: string;
  trainedAt?: string;
  isTrained?: boolean;
}

export interface AttachableDoctor {
  id: string;
  aiTrainingData: string | null;
  user?: { name: string | null } | null;
}

const GENERAL_BASELINE_TRAINING = `Perform structured clinical intake triage for systemic and non-specific complaints.
Prioritize ruling out emergency red flags (chest pain, breathing difficulty, fainting, uncontrolled bleeding, sudden severe headache).
Assess symptom duration, intensity, and constitutional signs (fever, fatigue, appetite changes) before concluding.
Recommend conservative self-care only for LOW severity; refer MEDIUM and above to the matching specialist.
Never suggest prescription-only medication beyond short-term OTC symptomatic relief.`;

export const SPECIALIST_DEFS: SpecialistDef[] = [
  {
    specialty: "GENERAL",
    displayName: "General AI Triage",
    description: "Systemic symptoms, fever, intake assessment",
    defaultTrainingData: GENERAL_BASELINE_TRAINING,
    defaultSuggestedQuestions: [
      "I've had a dull headache with eye strain for 2 days",
      "Sudden skin rash and itching on arms after eating seafood",
      "High fever (101\u00B0F) with dry cough and body aches",
      "Mild stomach cramps after eating dinner last night",
    ],
  },
  {
    specialty: "DERMATOLOGY",
    displayName: "AI Dermatologist",
    description: "Skin rashes, lesions, itching, acne",
    defaultTrainingData: null,
    defaultSuggestedQuestions: [
      "Itchy red patches spreading on my elbows for a week",
      "Sudden acne breakout along my jawline",
      "A mole on my back changed shape recently",
    ],
  },
  {
    specialty: "CARDIOLOGY",
    displayName: "AI Cardiologist",
    description: "Chest pain, blood pressure, palpitations",
    defaultTrainingData: null,
    defaultSuggestedQuestions: [
      "Occasional heart palpitations when climbing stairs",
      "My blood pressure readings stay above 140/90",
      "Mild chest tightness after heavy meals",
    ],
  },
  {
    specialty: "NEUROLOGY",
    displayName: "AI Neurologist",
    description: "Headaches, dizziness, nerve conditions",
    defaultTrainingData: null,
    defaultSuggestedQuestions: [
      "Recurring migraines with light sensitivity",
      "Tingling and numbness in my left hand",
      "Sudden dizziness when standing up quickly",
    ],
  },
  {
    specialty: "PEDIATRICS",
    displayName: "AI Pediatrician",
    description: "Infant & child health guidance",
    defaultTrainingData: null,
    defaultSuggestedQuestions: [
      "My 3-year-old has a fever of 102\u00B0F since last night",
      "Toddler refuses food and seems unusually tired",
      "Child developed small red spots after playing outside",
    ],
  },
  {
    specialty: "ORTHOPEDICS",
    displayName: "AI Orthopedist",
    description: "Bone, joint, and muscle complaints",
    defaultTrainingData: null,
    defaultSuggestedQuestions: [
      "Knee pain that worsens when climbing stairs",
      "Lower back stiffness every morning",
      "Wrist ache after long computer sessions",
    ],
  },
  {
    specialty: "GYNECOLOGY",
    displayName: "AI Gynecologist",
    description: "Women's health & reproductive care",
    defaultTrainingData: null,
    defaultSuggestedQuestions: [
      "Irregular periods for the last three months",
      "Severe cramping on the first day of my cycle",
      "Unusual discharge with mild discomfort",
    ],
  },
  {
    specialty: "ENT",
    displayName: "AI ENT Specialist",
    description: "Ear, nose, and throat conditions",
    defaultTrainingData: null,
    defaultSuggestedQuestions: [
      "Persistent sore throat and hoarse voice for a week",
      "Blocked ears with mild ringing sound",
      "Recurring sinus pressure and nasal congestion",
    ],
  },
  {
    specialty: "OPHTHALMOLOGY",
    displayName: "AI Ophthalmologist",
    description: "Eye discomfort, vision changes",
    defaultTrainingData: null,
    defaultSuggestedQuestions: [
      "Red, watery eyes with a gritty feeling",
      "Blurry vision when reading small text",
      "Sudden floaters in my right eye",
    ],
  },
  {
    specialty: "PSYCHIATRY",
    displayName: "AI Psychiatry Assistant",
    description: "Mood, sleep, anxiety & mental wellness",
    defaultTrainingData: null,
    defaultSuggestedQuestions: [
      "Trouble falling asleep and constant worry",
      "Low mood and no energy for two weeks",
      "Sudden panic episodes with racing heart",
    ],
  },
  {
    specialty: "GASTROENTEROLOGY",
    displayName: "AI Gastroenterologist",
    description: "Digestive, stomach & bowel concerns",
    defaultTrainingData: null,
    defaultSuggestedQuestions: [
      "Frequent acid reflux after evening meals",
      "Bloating and irregular bowel movements",
      "Stomach pain that eases after eating",
    ],
  },
  {
    specialty: "PULMONOLOGY",
    displayName: "AI Pulmonologist",
    description: "Breathing, cough & lung conditions",
    defaultTrainingData: null,
    defaultSuggestedQuestions: [
      "Dry cough lingering for over three weeks",
      "Wheezing at night while lying down",
      "Shortness of breath during light exercise",
    ],
  },
];

export function parseJsonStringArray(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
}

export function parseDoctorTraining(raw: string | null | undefined): DoctorTraining | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as DoctorTraining) : null;
  } catch {
    return null;
  }
}

/** Idempotently creates any missing specialist agent rows. */
export async function ensureSpecialistAgents(db: PrismaClient): Promise<void> {
  const existing = await db.specialistAgent.findMany({ select: { specialty: true } });
  const existingSet = new Set(existing.map((a) => a.specialty));
  const missing = SPECIALIST_DEFS.filter((def) => !existingSet.has(def.specialty));

  if (missing.length === 0) return;

  await db.specialistAgent.createMany({
    data: missing.map((def) => ({
      specialty: def.specialty,
      displayName: def.displayName,
      description: def.description,
      trainingData: def.defaultTrainingData,
      suggestedQuestions: JSON.stringify(def.defaultSuggestedQuestions),
    })),
    skipDuplicates: true,
  });
}

export function getAttachedDoctorIds(agent: SpecialistAgent): string[] {
  return parseJsonStringArray(agent.attachedDoctorIds);
}

/** Trained = admin training text present OR at least one attached doctor with trained agent data. */
export function computeIsTrained(agent: SpecialistAgent, attachedDoctors: AttachableDoctor[]): boolean {
  if (agent.trainingData && agent.trainingData.trim().length > 0) return true;

  return attachedDoctors.some((doc) => parseDoctorTraining(doc.aiTrainingData)?.isTrained === true);
}

/** Builds the training context block injected into the LLM system prompt. */
export function buildTrainingContext(agent: SpecialistAgent, attachedDoctors: AttachableDoctor[]): string {
  const sections: string[] = [];

  if (agent.trainingData && agent.trainingData.trim().length > 0) {
    sections.push(`Specialist model directives (${agent.displayName}):\n${agent.trainingData.trim()}`);
  }

  for (const doc of attachedDoctors) {
    const training = parseDoctorTraining(doc.aiTrainingData);
    if (!training?.isTrained) continue;

    const lines: string[] = [];
    const practitioner = training.agentName || `Dr. ${doc.user?.name || "Attached Practitioner"}'s Agent`;

    if (training.agentTone) lines.push(`Tone: ${training.agentTone}`);
    if (training.emergencyRedFlags?.length) lines.push(`Emergency red flags: ${training.emergencyRedFlags.join("; ")}`);
    if (training.intakeProtocols) lines.push(`Intake protocols: ${training.intakeProtocols}`);
    if (training.practiceBoundaries) lines.push(`Practice boundaries: ${training.practiceBoundaries}`);
    if (training.triageAdviceRules) lines.push(`Triage advice rules: ${training.triageAdviceRules}`);
    if (training.customDisclaimer) lines.push(`Practitioner disclaimer: ${training.customDisclaimer}`);

    if (lines.length > 0) {
      sections.push(`Attached practitioner protocol (${practitioner}):\n${lines.join("\n")}`);
    }
  }

  return sections.join("\n\n");
}

export async function getAgentWithDoctors(
  db: PrismaClient,
  specialty: string,
): Promise<{
  agent: SpecialistAgent | null;
  attachedDoctors: AttachableDoctor[];
}> {
  const agent = await db.specialistAgent.findUnique({ where: { specialty } });
  if (!agent) return { agent: null, attachedDoctors: [] };

  const doctorIds = getAttachedDoctorIds(agent);
  const attachedDoctors = doctorIds.length
    ? await db.doctor.findMany({
        where: { id: { in: doctorIds } },
        select: { id: true, aiTrainingData: true, user: { select: { name: true } } },
      })
    : [];

  return { agent, attachedDoctors };
}

export function makeConversationTitle(promptText: string): string {
  const clean = promptText.replace(/\s+/g, " ").trim();
  if (clean.length <= 60) return clean;

  const cut = clean.slice(0, 60);
  const lastSpace = cut.lastIndexOf(" ");
  return `${cut.slice(0, lastSpace > 30 ? lastSpace : 60)}\u2026`;
}
