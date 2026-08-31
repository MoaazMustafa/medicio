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

const GENERAL_BASELINE_TRAINING = `Certified Protocol: WHO IMAI & NHS 111 Clinical Primary Triage.
Perform structured clinical intake triage for systemic and non-specific complaints.
Assess symptom onset, exact duration, intensity (1-10), aggravating/relieving factors, and chronic comorbidities (Diabetes, Hypertension, Asthma).
Prioritize screening emergency red flags: crushing chest pain, acute dyspnea, sudden unilateral weakness/slurred speech (FAST), uncontrollable hemorrhage, high fever with stiff neck.
Recommend evidence-based conservative self-care only for LOW severity; refer MEDIUM and above to the matching verified specialist.
Cross-reference patient comorbidities before suggesting safe OTC relief (e.g. avoid NSAIDs in hypertension/ulcers/renal disease).`;

const DERMATOLOGY_TRAINING = `Certified Protocol: British Association of Dermatologists (BAD) & AAD Clinical Triage Guidelines.
Perform structured cutaneous triage: assess lesion morphology, distribution, onset, pruritus intensity, and recent exposures (soaps, cosmetics, medications).
Screen for red-flag dermatological emergencies: ABCDE melanoma criteria (Asymmetry, Border irregularity, Color variegation, Diameter >6mm, Evolution), mucosal involvement, blistering/peeling rashes (SJS/TEN), rapidly spreading erythema with warmth (Cellulitis).
Differentiate between eczema, contact dermatitis, urticaria, fungal tinea, and acne vulgaris.
Recommend non-pharmacological skin barrier care (emollients, cool compresses) and safe antihistamines; refer persistent or suspicious lesions to a verified dermatologist.`;

const CARDIOLOGY_TRAINING = `Certified Protocol: ACC/AHA & ESC Cardiovascular Guidelines & NICE CG95 Chest Pain Pathways.
Perform rigorous cardiovascular risk stratification for chest discomfort, palpitations, hypertension, and dyspnea.
IMMEDIATELY rule out Acute Coronary Syndrome (crushing/tight retrosternal chest pain radiating to left arm/jaw, diaphoresis, dyspnea, nausea) and Hypertensive Crises (>180/120 mmHg).
Assess cardiovascular risk factors: age, hypertension, diabetes, smoking, hyperlipidemia, and family history of premature CAD.
Differentiate between musculoskeletal wall pain, reflux/esophageal spasm, benign ectopy/sinus tachycardia, and ischemic cardiac disease.
Instruct emergency 911 dispatch for suspected ischemic signs; recommend 12-lead ECG and cardiologist review for subacute cardiac complaints.`;

const NEUROLOGY_TRAINING = `Certified Protocol: International Headache Society (ICHD-3), NICE CG150, & FAST Stroke Criteria.
Perform structured neurological triage for headaches, dizziness, neuropathy, and cranial nerve symptoms.
IMMEDIATELY screen for acute neuro-emergencies: F.A.S.T. stroke signs (Facial droop, Arm drift, Slurred speech, Time to call 911), Thunderclap headache (sudden worst headache of life within seconds), fever + photophobia + nuchal rigidity (Meningitis), sudden vision loss.
Differentiate tension-type cephalea (bilateral band-like non-pulsatile), migraine with/without aura (unilateral throbbing, nausea, photophobia), cluster headache, and peripheral neuropathy.
Recommend trigger avoidance, dark quiet rest, and conservative analgesia while preventing medication-overuse headaches (<2-3 days/week).`;

const PEDIATRICS_TRAINING = `Certified Protocol: American Academy of Pediatrics (AAP) & NICE NG143 Fever in Under 5s Triage.
Perform age-stratified pediatric triage evaluating activity level, breathing effort, hydration status, and temperature.
Screen for pediatric emergency red flags: non-blanching purpuric rash (Meningococcemia), grunting/stridor/chest indrawing (respiratory distress), bulging fontanelle, lethargy/unresponsiveness, sunken eyes/dry nappies (dehydration).
Strictly enforce pediatric drug safety: NEVER recommend Aspirin in children under 16 due to Reye's Syndrome risk; enforce weight-based dosing (mg/kg) for pediatric paracetamol/ibuprofen.
Advise light clothing, frequent oral fluid sips, and prompt pediatrician evaluation for any infant under 3 months with fever >=38°C (100.4°F).`;

const ORTHOPEDICS_TRAINING = `Certified Protocol: Ottawa Ankle/Knee Rules & AAOS Musculoskeletal Clinical Guidelines.
Perform structured musculoskeletal triage evaluating joint pain, spine mechanics, acute trauma, and mobility impairment.
Screen for orthopedic red flags: Cauda Equina Syndrome (saddle anesthesia, bowel/bladder incontinence, progressive bilateral lower limb weakness), open fracture, severe joint effusion with fever (Septic Arthritis), neurovascular compromise.
Differentiate between acute ligamentous sprain, mechanical lumbar strain, knee/hip osteoarthritis, and tendinitis.
Recommend certified conservative R.I.C.E. principles (Rest, Ice, Compression, Elevation), ergonomic adjustments, and low-impact mobility; refer structural instabilities to an orthopedist.`;

const GYNECOLOGY_TRAINING = `Certified Protocol: ACOG & RCOG Women's Health & Obstetric Triage Standards.
Perform empathetic clinical intake for menstrual irregularities, pelvic discomfort, dysmenorrhea, and reproductive health.
Screen for gynecological emergencies: acute unilateral pelvic pain with vaginal bleeding in reproductive age (suspected Ectopic Pregnancy), heavy acute hemorrhage (>1 pad/hour), severe pelvic inflammatory disease with high fever.
Evaluate pregnancy status, LMP (last menstrual period), contraception, and cycle regularity.
Enforce pregnancy safety warnings: avoid NSAIDs in pregnancy; recommend gynecologist consultation for chronic pelvic pain, endometriosis screening, and abnormal bleeding.`;

const ENT_TRAINING = `Certified Protocol: EPOS 2020 Sinusitis Consensus & AAO-HNS / NICE Sore Throat Guidelines.
Perform structured ENT triage for rhinological, otological, and pharyngeal complaints.
Screen for ENT emergencies: Peritonsillar abscess / Quinsy (hot potato voice, severe unilateral tonsillar swelling, trismus), acute airway compromise/stridor, uncontrolled epistaxis, mastoid tenderness with swelling behind the ear.
Apply Centor / McIsaac criteria for sore throat differentiation (viral pharyngitis vs Group A Strep).
Recommend saline nasal rinses, facial compresses, voice rest, and safe hydration; limit topical decongestant sprays to <=3 days to avoid rhinitis medicamentosa.`;

const OPHTHALMOLOGY_TRAINING = `Certified Protocol: American Academy of Ophthalmology (AAO) Preferred Practice Patterns.
Perform structured ocular triage evaluating visual acuity changes, pain, discharge, and photophobia.
Screen for ophthalmic emergencies: Acute Angle-Closure Glaucoma (severe eye pain, steamy cornea, halos around lights, nausea), Retinal Detachment (sudden curtain/shadow, flashes of light, shower of floaters), chemical eye injury, penetrating ocular trauma.
Differentiate between viral/allergic conjunctivitis (grittiness, watery/mucoid discharge) and corneal abrasions/ulcers (severe foreign body sensation, contact lens wear).
Instruct contact lens wearers to cease lens use immediately upon eye irritation; recommend urgent slit-lamp ophthalmologist examination for vision loss.`;

const PSYCHIATRY_TRAINING = `Certified Protocol: DSM-5-TR, GAD-7 / PHQ-9 Clinical Frameworks, & 988 Suicide Crisis Guidelines.
Perform compassionate, trauma-informed mental wellness triage for anxiety, depressive episodes, panic attacks, and insomnia.
IMMEDIATELY screen for self-harm or suicidal ideation: provide the 988 Suicide & Crisis Lifeline (call/text 988 in US/Canada, 111 in UK) and local emergency crisis resources.
Provide evidence-based somatic grounding exercises (box breathing 4x4, 5-4-3-2-1 sensory grounding) for panic episodes.
Emphasize non-judgmental validation, sleep hygiene protocols, and referral to licensed clinical psychologists and psychiatrists.`;

const GASTROENTEROLOGY_TRAINING = `Certified Protocol: American Gastroenterological Association (AGA) & Rome IV IBS Guidelines.
Perform structured gastrointestinal triage evaluating abdominal pain location, bowel habit changes, dyspepsia, and reflux.
Screen for GI emergencies: Acute Abdomen / Appendicitis (sharp periumbilical pain migrating to right lower quadrant with rebound tenderness), GI Bleeding (hematemesis/coffee-ground emesis, melena/black tarry stools), acute bowel obstruction (feculent vomiting, obstipation).
Differentiate between GERD/acid dyspepsia, Irritable Bowel Syndrome (Rome IV criteria), viral gastroenteritis, and peptic ulcer disease.
Recommend dietary lifestyle modifications (low-FODMAP, head of bed elevation 6 inches, avoid late-night meals) and antacids; refer chronic dyspepsia to a gastroenterologist.`;

const PULMONOLOGY_TRAINING = `Certified Protocol: GINA Global Strategy for Asthma Management & GOLD COPD Guidelines.
Perform structured respiratory triage evaluating dyspnea, cough characteristics, sputum production, and wheezing.
Screen for pulmonary emergencies: acute severe asthma exacerbation (cyanosis, silent chest, inability to speak full sentences), pulmonary embolism (sudden pleuritic chest pain, unexplained hypoxia, unilateral leg swelling), tension pneumothorax.
Assess baseline lung history (Asthma, COPD, smoking history) and current inhaler compliance.
Recommend warm fluid hydration, cool mist humidification, and avoidance of airway irritants; advise immediate pulse oximetry and pulmonologist review if dyspnea persists.`;

export const SPECIALIST_DEFS: SpecialistDef[] = [
  {
    specialty: "GENERAL",
    displayName: "General AI Triage",
    description: "Systemic symptoms, fever, intake assessment",
    defaultTrainingData: GENERAL_BASELINE_TRAINING,
    defaultSuggestedQuestions: [
      "I've had a dull headache with eye strain for 2 days",
      "Sudden skin rash and itching on arms after eating seafood",
      "High fever (101°F) with dry cough and body aches",
      "Mild stomach cramps after eating dinner last night",
    ],
  },
  {
    specialty: "DERMATOLOGY",
    displayName: "AI Dermatologist",
    description: "Skin rashes, lesions, itching, acne",
    defaultTrainingData: DERMATOLOGY_TRAINING,
    defaultSuggestedQuestions: [
      "Itchy red patches spreading on my elbows for a week",
      "Sudden acne breakout along my jawline",
      "A mole on my back changed shape recently",
      "Raised itchy hives that flare up in the evening",
    ],
  },
  {
    specialty: "CARDIOLOGY",
    displayName: "AI Cardiologist",
    description: "Chest pain, blood pressure, palpitations",
    defaultTrainingData: CARDIOLOGY_TRAINING,
    defaultSuggestedQuestions: [
      "Occasional heart palpitations when climbing stairs",
      "My blood pressure readings stay above 140/90",
      "Mild chest tightness after heavy meals",
      "Pounding heartbeat and dizziness after exercise",
    ],
  },
  {
    specialty: "NEUROLOGY",
    displayName: "AI Neurologist",
    description: "Headaches, dizziness, nerve conditions",
    defaultTrainingData: NEUROLOGY_TRAINING,
    defaultSuggestedQuestions: [
      "Recurring migraines with light sensitivity",
      "Tingling and numbness in my left hand",
      "Sudden dizziness when standing up quickly",
      "Band-like pressure across both temples after work",
    ],
  },
  {
    specialty: "PEDIATRICS",
    displayName: "AI Pediatrician",
    description: "Infant & child health guidance",
    defaultTrainingData: PEDIATRICS_TRAINING,
    defaultSuggestedQuestions: [
      "My 3-year-old has a fever of 102°F since last night",
      "Toddler refuses food and seems unusually tired",
      "Child developed small red spots after playing outside",
      "Baby has mild nasal congestion and dry cough",
    ],
  },
  {
    specialty: "ORTHOPEDICS",
    displayName: "AI Orthopedist",
    description: "Bone, joint, and muscle complaints",
    defaultTrainingData: ORTHOPEDICS_TRAINING,
    defaultSuggestedQuestions: [
      "Knee pain that worsens when climbing stairs",
      "Lower back stiffness every morning after waking up",
      "Wrist ache after long computer typing sessions",
      "Ankle swelling and pain after twisting it yesterday",
    ],
  },
  {
    specialty: "GYNECOLOGY",
    displayName: "AI Gynecologist",
    description: "Women's health & reproductive care",
    defaultTrainingData: GYNECOLOGY_TRAINING,
    defaultSuggestedQuestions: [
      "Irregular periods for the last three months",
      "Severe cramping on the first day of my menstrual cycle",
      "Unusual pelvic discomfort after intense workouts",
      "Hormonal mood changes and spotting between periods",
    ],
  },
  {
    specialty: "ENT",
    displayName: "AI ENT Specialist",
    description: "Ear, nose, and throat conditions",
    defaultTrainingData: ENT_TRAINING,
    defaultSuggestedQuestions: [
      "Persistent sore throat and hoarse voice for a week",
      "Blocked ears with mild ringing sound",
      "Recurring sinus pressure and nasal congestion",
      "Throat tickle with dry cough when lying down",
    ],
  },
  {
    specialty: "OPHTHALMOLOGY",
    displayName: "AI Ophthalmologist",
    description: "Eye discomfort, vision changes",
    defaultTrainingData: OPHTHALMOLOGY_TRAINING,
    defaultSuggestedQuestions: [
      "Red, watery eyes with a gritty feeling",
      "Blurry vision and eye strain when reading screens",
      "Occasional floaters in my right eye",
      "Dry, irritated eyes after contact lens use",
    ],
  },
  {
    specialty: "PSYCHIATRY",
    displayName: "AI Psychiatry Assistant",
    description: "Mood, sleep, anxiety & mental wellness",
    defaultTrainingData: PSYCHIATRY_TRAINING,
    defaultSuggestedQuestions: [
      "Trouble falling asleep and constant racing thoughts",
      "Low mood, brain fog, and no energy for two weeks",
      "Sudden panic episodes with rapid heartbeat and shakiness",
      "Workplace burnout and overwhelming stress",
    ],
  },
  {
    specialty: "GASTROENTEROLOGY",
    displayName: "AI Gastroenterologist",
    description: "Digestive, stomach & bowel concerns",
    defaultTrainingData: GASTROENTEROLOGY_TRAINING,
    defaultSuggestedQuestions: [
      "Frequent acid reflux and heartburn after evening meals",
      "Bloating and irregular alternating bowel movements",
      "Stomach cramping that eases after eating",
      "Sour taste in mouth when waking up in the morning",
    ],
  },
  {
    specialty: "PULMONOLOGY",
    displayName: "AI Pulmonologist",
    description: "Breathing, cough & lung conditions",
    defaultTrainingData: PULMONOLOGY_TRAINING,
    defaultSuggestedQuestions: [
      "Dry cough lingering for over three weeks",
      "Mild wheezing at night while lying down",
      "Shortness of breath during light stair climbing",
      "Chest tightness in cold morning weather",
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

/** Idempotently creates or updates specialist agent rows with certified training data. */
export async function ensureSpecialistAgents(db: PrismaClient): Promise<void> {
  const existing = await db.specialistAgent.findMany();
  const existingMap = new Map(existing.map((a) => [a.specialty, a]));

  for (const def of SPECIALIST_DEFS) {
    const found = existingMap.get(def.specialty);
    if (!found) {
      await db.specialistAgent.create({
        data: {
          specialty: def.specialty,
          displayName: def.displayName,
          description: def.description,
          trainingData: def.defaultTrainingData,
          suggestedQuestions: JSON.stringify(def.defaultSuggestedQuestions),
          isEnabled: true,
        },
      });
    } else if (!found.trainingData || found.trainingData.trim().length === 0) {
      // Update existing agents with missing training data
      await db.specialistAgent.update({
        where: { id: found.id },
        data: {
          trainingData: def.defaultTrainingData,
          suggestedQuestions: JSON.stringify(def.defaultSuggestedQuestions),
          isEnabled: true,
        },
      });
    }
  }

  await ensureSpecialistDoctors(db);
}

/** Idempotently ensures sample verified specialist doctor profiles exist across all specialties. */
export async function ensureSpecialistDoctors(db: PrismaClient): Promise<void> {
  const sampleSpecialistDoctors = [
    {
      email: "doctor.dermatology@medicio.com",
      name: "Dr. Sarah Jenkins",
      specialty: "Dermatology",
      subSpecialty: "Cutaneous Oncology & Eczema",
      education: "MD - Harvard Medical School, FAAD",
      experience: 10,
      clinicAddress: "Medicio Dermatology & Skin Care Clinic, Suite 402",
      consultationFee: 65,
    },
    {
      email: "doctor.cardiology@medicio.com",
      name: "Dr. Aisha Rahman",
      specialty: "Cardiology",
      subSpecialty: "Interventional Cardiology",
      education: "MD - Johns Hopkins University, FACC",
      experience: 12,
      clinicAddress: "City General Heart Institute, 5th Floor",
      consultationFee: 75,
    },
    {
      email: "doctor.neurology@medicio.com",
      name: "Dr. Marcus Vance",
      specialty: "Neurology",
      subSpecialty: "Headache & Stroke Management",
      education: "MD - Columbia University, FAAN",
      experience: 14,
      clinicAddress: "Neurological Care Center, Suite 300",
      consultationFee: 80,
    },
    {
      email: "doctor.pediatrics@medicio.com",
      name: "Dr. Emily Chen",
      specialty: "Pediatrics",
      subSpecialty: "General Pediatrics & Neonatal Care",
      education: "MD - Stanford University, FAAP",
      experience: 8,
      clinicAddress: "Children's Health & Wellness Pavilion",
      consultationFee: 50,
    },
    {
      email: "doctor.orthopedics@medicio.com",
      name: "Dr. David Miller",
      specialty: "Orthopedics",
      subSpecialty: "Joint Replacement & Sports Injuries",
      education: "MD - Oxford University, FAAOS",
      experience: 15,
      clinicAddress: "Orthopedic & Spine Health Clinic",
      consultationFee: 70,
    },
    {
      email: "doctor.gynecology@medicio.com",
      name: "Dr. Priya Patel",
      specialty: "Gynecology",
      subSpecialty: "Obstetrics & Women's Health",
      education: "MD - King's College London, FACOG",
      experience: 11,
      clinicAddress: "Women's Health & Fertility Center",
      consultationFee: 65,
    },
    {
      email: "doctor.ent@medicio.com",
      name: "Dr. James Wilson",
      specialty: "ENT",
      subSpecialty: "Otolaryngology & Sinus Surgery",
      education: "MD - Edinburgh Medical School, FACS",
      experience: 9,
      clinicAddress: "Ear, Nose & Throat Specialist Pavilion",
      consultationFee: 55,
    },
    {
      email: "doctor.ophthalmology@medicio.com",
      name: "Dr. Elena Rostova",
      specialty: "Ophthalmology",
      subSpecialty: "Cornea & Refractive Vision",
      education: "MD - Melbourne University, ABO",
      experience: 13,
      clinicAddress: "Vision Care & Ophthalmic Center",
      consultationFee: 60,
    },
    {
      email: "doctor.psychiatry@medicio.com",
      name: "Dr. Robert Kim",
      specialty: "Psychiatry",
      subSpecialty: "Adult Psychiatry & Psychotherapy",
      education: "MD - Yale School of Medicine, FAPA",
      experience: 16,
      clinicAddress: "Mind & Behavioral Health Institute",
      consultationFee: 90,
    },
    {
      email: "doctor.gastroenterology@medicio.com",
      name: "Dr. Tariq Al-Mansoor",
      specialty: "Gastroenterology",
      subSpecialty: "Hepatology & Endoscopy",
      education: "MD - Toronto University, FACG",
      experience: 12,
      clinicAddress: "Digestive Diseases & Endoscopy Center",
      consultationFee: 70,
    },
    {
      email: "doctor.pulmonology@medicio.com",
      name: "Dr. Karen Taylor",
      specialty: "Pulmonology",
      subSpecialty: "Asthma, COPD & Sleep Medicine",
      education: "MD - McGill University, FCCP",
      experience: 10,
      clinicAddress: "Chest & Respiratory Clinic",
      consultationFee: 75,
    },
    {
      email: "doctor.general@medicio.com",
      name: "Dr. Moaaz Mustafa",
      specialty: "General Physician",
      subSpecialty: "Family & Preventive Medicine",
      education: "MBBS, MRCGP (UK)",
      experience: 7,
      clinicAddress: "Medicio Clinical Primary Care",
      consultationFee: 40,
    },
  ];

  for (const doc of sampleSpecialistDoctors) {
    const existingDoc = await db.doctor.findFirst({
      where: {
        specialty: { equals: doc.specialty, mode: "insensitive" },
      },
    });

    if (!existingDoc) {
      let user = await db.user.findUnique({ where: { email: doc.email } });
      if (!user) {
        user = await db.user.create({
          data: {
            email: doc.email,
            name: doc.name,
            passwordHash: "$2b$10$demoHashedPasswordDummyValuePlaceholderForSeed12345",
            role: "DOCTOR",
            isVerified: true,
          },
        });
      }

      await db.doctor.create({
        data: {
          userId: user.id,
          specialty: doc.specialty,
          subSpecialty: doc.subSpecialty,
          education: doc.education,
          experience: doc.experience,
          licenseNumber: `LIC-${Math.floor(100000 + Math.random() * 900000)}`,
          isVerified: true,
          clinicAddress: doc.clinicAddress,
          consultationFee: doc.consultationFee,
        },
      });
    }
  }
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
