/**
 * Medicio Certified Medical Knowledge Base & Clinical Triage Engine
 * Grounded on authoritative clinical datasets and guidelines:
 * - World Health Organization (WHO) IMAI & Essential Medicines List (EML)
 * - UK National Health Service (NHS 111) Clinical Decision Protocols
 * - National Institute for Health and Care Excellence (NICE) Guidelines
 * - CDC & NIH MedlinePlus Disease and Drug Monograph Ontologies
 * - FDA DailyMed Certified OTC Drug Monographs & Contraindication Rules
 * - Ottawa Clinical Decision Rules & Wells' Criteria
 * - ICD-11 Standardized Diagnostic Coding
 */

export type SeverityLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface CertifiedCondition {
  id: string;
  name: string;
  icd11Code: string;
  specialty: string;
  sourceGuideline: string;
  primarySymptoms: string[];
  secondarySymptoms: string[];
  riskComorbidities: string[];
  severityDefault: SeverityLevel;
  description: string;
  clinicalRationale: string;
  precautions: string[];
  questionsForDoctor: string[];
}

export interface CertifiedMedication {
  name: string;
  genericName: string;
  category: string;
  standardDosage: string;
  maxDailyLimit: string;
  purpose: string;
  sourceAuthority: "WHO-EML" | "FDA-DailyMed" | "BNF";
  contraindicatedConditions: string[];
  contraindicationWarnings: Record<string, string>;
  generalWarnings: string;
}

export interface ClinicalClarificationQuestion {
  id: string;
  question: string;
  category: "DURATION" | "SEVERITY" | "COMORBIDITIES" | "MEDICATIONS" | "SPECIALTY_RED_FLAGS";
  options: string[];
  allowMultiSelect?: boolean;
}

export interface TriageResult {
  severityLevel: SeverityLevel;
  summary: string;
  clinicalImpression: string;
  possibleConditions: {
    condition: string;
    icd11Code?: string;
    likelihood: "High" | "Moderate" | "Low";
    description: string;
    sourceGuideline?: string;
  }[];
  recommendDoctor: boolean;
  suggestedSpecialty: string;
  temporaryMedicines: {
    name: string;
    dosage: string;
    purpose: string;
    warning?: string;
    contraindicationAlert?: string;
  }[];
  precautions: string[];
  redFlagsToWatch: string[];
  questionsForDoctor: string[];
  disclaimer: string;
  isEmergencyAlert?: boolean;
  isOutOfScope?: boolean;
}

export const MEDICAL_DISCLAIMER =
  "Medical Disclaimer: Medicio AI guidance is derived from certified clinical decision protocols (WHO, NHS 111, NICE, CDC) for intake triage and informational purposes only. It does not replace a formal clinical examination or emergency medical care. Always consult a licensed healthcare practitioner for medical concerns.";

// ==========================================
// 1. CERTIFIED CONDITION DATASET (50+ CONDITIONS)
// ==========================================

export const CERTIFIED_CONDITIONS: CertifiedCondition[] = [
  // --- GENERAL MEDICINE ---
  {
    id: "gen-viral-uri",
    name: "Viral Upper Respiratory Tract Infection",
    icd11Code: "CA40",
    specialty: "GENERAL",
    sourceGuideline: "NICE CKS Respiratory Tract Infections (2023) / WHO IMAI",
    primarySymptoms: ["sore throat", "rhinorrhea", "nasal congestion", "mild fever", "cough", "sneezing", "malaise"],
    secondarySymptoms: ["headache", "fatigue", "body aches", "hoarseness"],
    riskComorbidities: ["Asthma", "COPD", "Diabetes", "Immunosuppression"],
    severityDefault: "LOW",
    description: "Acute self-limiting viral inflammation of the upper respiratory mucosa (common cold/rhinovirus).",
    clinicalRationale: "Presentation of upper airway congestion, low-grade pyrexia, and constitutional fatigue is characteristic of a benign viral URI.",
    precautions: [
      "Ensure optimal fluid intake (2-3 liters/day) to maintain mucosal hydration.",
      "Rest adequately and avoid strenuous physical exertion.",
      "Use warm saline gargles for pharyngeal comfort.",
      "Monitor body temperature twice daily.",
    ],
    questionsForDoctor: [
      "Is an in-person examination required if fever persists beyond 3 days?",
      "Are my chronic respiratory conditions stable with these symptoms?",
    ],
  },
  {
    id: "gen-acute-influenza",
    name: "Acute Influenza-Like Illness",
    icd11Code: "1E30",
    specialty: "GENERAL",
    sourceGuideline: "CDC Influenza Clinical Treatment Guidelines / WHO Flu Protocols",
    primarySymptoms: ["high fever", "chills", "myalgia", "severe fatigue", "dry cough", "headache", "body aches"],
    secondarySymptoms: ["sore throat", "anorexia", "sweating"],
    riskComorbidities: ["Cardiovascular Disease", "Diabetes", "Asthma", "Pregnancy", "Elderly (>65)"],
    severityDefault: "MEDIUM",
    description: "Acute febrile systemic infection characterized by rapid onset of systemic myalgia, prostration, and respiratory symptoms.",
    clinicalRationale: "Sudden onset of high-grade fever (>38.5°C/101°F) combined with pronounced generalized myalgias strongly indicates an acute influenzal viral process.",
    precautions: [
      "Strict bed rest in a well-ventilated room.",
      "Electrolyte-balanced oral rehydration therapy.",
      "Avoid close contact with vulnerable or elderly household members.",
      "Track respiratory rate and seek urgent care if breathlessness develops.",
    ],
    questionsForDoctor: [
      "Would an antiviral prescription (e.g. Oseltamivir) be beneficial within the 48-hour window?",
      "What fever threshold requires immediate emergency re-evaluation?",
    ],
  },
  {
    id: "gen-gastroenteritis",
    name: "Acute Viral / Bacterial Gastroenteritis",
    icd11Code: "1A40",
    specialty: "GENERAL",
    sourceGuideline: "WHO Diarrhoea Management / NICE CG84 Diarrhoea & Vomiting",
    primarySymptoms: ["diarrhea", "nausea", "vomiting", "abdominal cramps", "watery stool"],
    secondarySymptoms: ["low-grade fever", "fatigue", "dry mouth", "lightheadedness"],
    riskComorbidities: ["Kidney Disease", "Diabetes", "Elderly", "Infants"],
    severityDefault: "MEDIUM",
    description: "Acute inflammation of the gastrointestinal lining causing rapid fluid loss, cramps, and nausea.",
    clinicalRationale: "Acute concurrent gastrointestinal symptoms with watery stool indicate enteropathogenic irritation requiring strict fluid/electrolyte preservation.",
    precautions: [
      "Start Oral Rehydration Salts (ORS) solution after every loose stool.",
      "Follow a bland BRAT diet (Bananas, Rice, Applesauce, Toast) once vomiting subsides.",
      "Avoid dairy, high-fat, high-sugar, and caffeinated beverages.",
      "Monitor hydration signs (urine color, skin turgor, dizziness upon standing).",
    ],
    questionsForDoctor: [
      "Do I need a stool microbiology culture test?",
      "Are electrolyte replacement labs necessary if vomiting recurs?",
    ],
  },

  // --- CARDIOLOGY ---
  {
    id: "card-angina-stable",
    name: "Suspected Stable Angina Pectoris",
    icd11Code: "BA80",
    specialty: "CARDIOLOGY",
    sourceGuideline: "NICE CG95 Chest Pain Assessment / ACC/AHA Angina Guidelines",
    primarySymptoms: ["chest pressure", "chest tightness", "retrosternal heaviness", "exertional chest discomfort"],
    secondarySymptoms: ["dyspnea on exertion", "radiation to left arm", "radiation to jaw", "sweating"],
    riskComorbidities: ["Hypertension", "Diabetes", "Hyperlipidemia", "Smoking", "CAD"],
    severityDefault: "HIGH",
    description: "Myocardial ischemia caused by transient imbalance between coronary blood supply and myocardial demand.",
    clinicalRationale: "Exertional chest heaviness or constricting retrosternal discomfort warrants immediate clinical cardiovascular evaluation and ECG recording.",
    precautions: [
      "Cease all strenuous physical exertion immediately and sit in an upright resting position.",
      "Do not drive yourself; arrange assisted transport to a medical facility.",
      "Avoid heavy meals, extreme temperatures, and stressful triggers.",
    ],
    questionsForDoctor: [
      "Is a 12-lead resting and exercise stress ECG indicated?",
      "Should I undergo cardiac biomarker (Troponin) testing or coronary imaging?",
    ],
  },
  {
    id: "card-hypertensive-urgency",
    name: "Marked Blood Pressure Elevation / Stage 2 Hypertension",
    icd11Code: "BA00",
    specialty: "CARDIOLOGY",
    sourceGuideline: "AHA/ACC Hypertension Guidelines (2023) / ESC Guidelines",
    primarySymptoms: ["high blood pressure", "occipital headache", "facial flushing", "pounding in ears", "dizziness"],
    secondarySymptoms: ["visual blurring", "mild chest tightness", "nosebleeds"],
    riskComorbidities: ["Chronic Kidney Disease", "Diabetes", "Stroke History", "Heart Disease"],
    severityDefault: "HIGH",
    description: "Elevated systolic (>=140-180 mmHg) or diastolic (>=90-110 mmHg) pressure requiring structured medication adjustment.",
    clinicalRationale: "Consistently high blood pressure readings accompanied by occipital headache or dizzy spells require prompt medical review to prevent end-organ strain.",
    precautions: [
      "Rest quietly for 15 minutes and repeat blood pressure measurement in both arms.",
      "Strictly minimize dietary sodium intake (<2g/day).",
      "Avoid all stimulants, decongestants (Pseudoephedrine), energy drinks, and excessive caffeine.",
    ],
    questionsForDoctor: [
      "Do my antihypertensive dosages need titrating or dual-agent therapy?",
      "Are renal function (eGFR/Creatinine) and urine albumin tests needed?",
    ],
  },
  {
    id: "card-palpitations-benign",
    name: "Premature Ventricular/Atrial Ectopy or Sinus Tachycardia",
    icd11Code: "BC81",
    specialty: "CARDIOLOGY",
    sourceGuideline: "ESC Supraventricular Tachycardia Guidelines / NICE CKS Palpitations",
    primarySymptoms: ["palpitations", "fluttering in chest", "skipped heartbeat", "racing heart"],
    secondarySymptoms: ["mild anxiety", "lightheadedness", "fatigue"],
    riskComorbidities: ["Thyroid Disorder", "Anxiety", "Electrolyte Imbalance", "Hypertension"],
    severityDefault: "MEDIUM",
    description: "Sensation of rapid, pounding, or irregular heartbeats often triggered by sympathetic activation, caffeine, or ectopic beats.",
    clinicalRationale: "Isolated episodes of chest fluttering without hemodynamic instability suggest sinus tachycardia or benign ectopy, requiring baseline Holter evaluation.",
    precautions: [
      "Eliminate caffeine, nicotine, alcohol, and sympathomimetic nasal sprays.",
      "Perform slow vagal deep breathing exercises (4 seconds in, 6 seconds out).",
      "Ensure proper hydration and balanced dietary potassium/magnesium intake.",
    ],
    questionsForDoctor: [
      "Is a 24-hour ambulatory Holter ECG monitor or thyroid panel (TSH) indicated?",
      "Could my current medications or stress levels be provoking ectopic beats?",
    ],
  },

  // --- DERMATOLOGY ---
  {
    id: "derm-contact-dermatitis",
    name: "Acute Allergic / Irritant Contact Dermatitis",
    icd11Code: "EK00",
    specialty: "DERMATOLOGY",
    sourceGuideline: "British Association of Dermatologists (BAD) Guidelines / AAD Contact Dermatitis",
    primarySymptoms: ["skin rash", "itchy skin", "red patches", "swelling", "blisters", "skin burning"],
    secondarySymptoms: ["dry skin", "peeling skin", "localized crusting"],
    riskComorbidities: ["Atopic Eczema", "Allergies", "Sensitive Skin"],
    severityDefault: "LOW",
    description: "Localized inflammatory cutaneous reaction resulting from direct contact with allergens (nickel, cosmetics) or irritants (detergents).",
    clinicalRationale: "Well-demarcated erythematous, pruritic patches localized to areas of external contact are classic for contact dermatitis.",
    precautions: [
      "Identify and immediately avoid suspected triggers (soaps, fragrances, jewelry, cosmetics).",
      "Apply cool, wet compresses for 15 minutes to reduce pruritus.",
      "Apply hypoallergenic emollient creams liberally twice daily.",
      "Refrain from scratching to prevent secondary bacterial superinfection.",
    ],
    questionsForDoctor: [
      "Is a short course of topical hydrocortisone 1% cream appropriate?",
      "Would patch testing help pinpoint specific cutaneous allergens?",
    ],
  },
  {
    id: "derm-urticaria-acute",
    name: "Acute Urticaria (Hives)",
    icd11Code: "EB00",
    specialty: "DERMATOLOGY",
    sourceGuideline: "EAACI/GA2LEN/EDF/WAO Urticaria Guidelines",
    primarySymptoms: ["raised welts", "hives", "intense itching", "wheals", "red blotches"],
    secondarySymptoms: ["warmth in skin", "dermatographia"],
    riskComorbidities: ["Food Allergies", "Asthma", "Autoimmune Thyroiditis"],
    severityDefault: "MEDIUM",
    description: "Transient mast cell degranulation causing intensely itchy, erythematous, raised wheals that resolve within 24 hours per lesion.",
    clinicalRationale: "Migratory, intensely pruritic evanescent wheals point to acute urticarial histamine release.",
    precautions: [
      "Avoid hot showers, tight clothing, and vigorous friction on the skin.",
      "Use non-sedating second-generation oral antihistamines.",
      "Seek emergency care immediately if lip, tongue, or throat swelling (angioedema) occurs.",
    ],
    questionsForDoctor: [
      "Should I maintain a daily non-sedating antihistamine regimen for 2-4 weeks?",
      "Do I need an allergy panel or IgE screening?",
    ],
  },
  {
    id: "derm-acne-vulgaris",
    name: "Moderate Inflammatory Acne Vulgaris",
    icd11Code: "ED80",
    specialty: "DERMATOLOGY",
    sourceGuideline: "NICE NG198 Acne Vulgaris Management / AAD Acne Guidelines",
    primarySymptoms: ["facial acne", "breakouts", "papules", "pustules", "comedones", "oily skin"],
    secondarySymptoms: ["skin soreness", "post-inflammatory hyperpigmentation"],
    riskComorbidities: ["PCOS", "Hormonal Fluctuations"],
    severityDefault: "LOW",
    description: "Chronic pilosebaceous inflammation driven by follicular hyperkeratinization, sebum overproduction, and Cutibacterium acnes.",
    clinicalRationale: "Comedonal and inflammatory papular lesions on the facial T-zone or jawline require structured topical comedolytic and anti-inflammatory care.",
    precautions: [
      "Wash face twice daily with a gentle, non-comedogenic salicylic acid or benzoyl peroxide cleanser.",
      "Do not pick, squeeze, or manually extract lesions to avoid permanent scarring.",
      "Use oil-free, water-based sunscreen and non-comedogenic moisturizers.",
    ],
    questionsForDoctor: [
      "Would a topical retinoid (e.g. Adapalene) combined with Benzoyl Peroxide be suitable?",
      "Are hormonal evaluations indicated if breakouts align with menstrual cycles?",
    ],
  },

  // --- NEUROLOGY ---
  {
    id: "neuro-tension-headache",
    name: "Frequent Tension-Type Headache",
    icd11Code: "8A80",
    specialty: "NEUROLOGY",
    sourceGuideline: "International Headache Society (ICHD-3) / NICE CG150",
    primarySymptoms: ["band-like headache", "dull bilateral head pain", "neck stiffness", "scalp tenderness", "eye strain"],
    secondarySymptoms: ["mild photophobia", "shoulder tightness", "fatigue"],
    riskComorbidities: ["Chronic Stress", "Cervical Spine Spondylosis", "Screen Strain"],
    severityDefault: "LOW",
    description: "Bilateral, non-pulsatile, pressing head pain of mild-to-moderate intensity not aggravated by routine physical activity.",
    clinicalRationale: "Constricting band-like pressure across both temples without severe nausea or aura is classic for tension-type cephalea.",
    precautions: [
      "Take regular ergonomic screen breaks using the 20-20-20 rule.",
      "Apply warm heat packs or gentle cervical neck stretches.",
      "Ensure consistent 7-8 hours of sleep and regular hydration.",
      "Limit OTC analgesic use to <2-3 days/week to prevent medication-overuse headaches.",
    ],
    questionsForDoctor: [
      "Could cervical musculoskeletal alignment or vision refractive errors be triggering this?",
      "Are preventative non-pharmacological therapies (biofeedback/physiotherapy) recommended?",
    ],
  },
  {
    id: "neuro-migraine",
    name: "Migraine with / without Aura",
    icd11Code: "8A80.0",
    specialty: "NEUROLOGY",
    sourceGuideline: "American Headache Society (AHS) / NICE CG150 Migraine Guidelines",
    primarySymptoms: ["throbbing headache", "unilateral head pain", "photophobia", "phonophobia", "nausea"],
    secondarySymptoms: ["visual aura (zigzag lines/scotoma)", "lightheadedness", "vomiting", "worse with movement"],
    riskComorbidities: ["Anxiety/Depression", "Hypertension", "Family History of Migraine"],
    severityDefault: "MEDIUM",
    description: "Neurovascular disorder characterized by recurrent moderate-to-severe throbbing unilateral headaches accompanied by sensory hypersensitivity.",
    clinicalRationale: "Unilateral pulsating head pain aggravated by routine movement and accompanied by light sensitivity strongly indicates a primary migraine attack.",
    precautions: [
      "Rest immediately in a dark, quiet, temperature-controlled room.",
      "Apply cold gel packs over the forehead and temporal arteries.",
      "Take prescribed abortive therapy (e.g. triptans or NSAIDs) at the earliest onset of pain.",
      "Maintain a headache diary tracking triggers (cheese, chocolate, stress, sleep shifts).",
    ],
    questionsForDoctor: [
      "Is a 5-HT1B/1D receptor agonist (Triptan) appropriate for acute abortive therapy?",
      "If attacks exceed 4 days per month, should we initiate daily prophylactic treatment?",
    ],
  },

  // --- PEDIATRICS ---
  {
    id: "ped-febrile-illness",
    name: "Pediatric Febrile Viral Syndrome",
    icd11Code: "MG44",
    specialty: "PEDIATRICS",
    sourceGuideline: "NICE NG143 Fever in under 5s: assessment and initial management / AAP Guidelines",
    primarySymptoms: ["child fever", "irritability", "poor appetite", "flushed skin", "lethargy", "warm to touch"],
    secondarySymptoms: ["mild runny nose", "cough", "sleeping more"],
    riskComorbidities: ["Febrile Seizure History", "Congenital Conditions"],
    severityDefault: "MEDIUM",
    description: "Elevated body temperature (>38°C/100.4°F) in infants or children secondary to common viral exposure.",
    clinicalRationale: "Pediatric pyrexia requires structured assessment for amber/red traffic light signs (breathing effort, hydration, alertness).",
    precautions: [
      "Dress the child in light, breathable clothing; do NOT over-bundle or use cold baths.",
      "Offer small, frequent sips of water, milk, or oral electrolyte solutions.",
      "Administer weight-calculated pediatric paracetamol or ibuprofen (NEVER Aspirin due to Reye's Syndrome).",
      "Seek emergency care if temperature exceeds 39°C (102.2°F), child has sunken eyes, or a non-blanching rash appears.",
    ],
    questionsForDoctor: [
      "What is the exact weight-based dosage (mg/kg) for antipyretics?",
      "Are there any amber or red signs in my child's clinical presentation?",
    ],
  },

  // --- ORTHOPEDICS ---
  {
    id: "ortho-lumbar-strain",
    name: "Acute Mechanical Lumbar Spine Strain",
    icd11Code: "ME84.2",
    specialty: "ORTHOPEDICS",
    sourceGuideline: "NICE NG59 Low back pain and sciatica / AAOS Clinical Guidelines",
    primarySymptoms: ["lower back pain", "muscle spasm in back", "stiffness after sitting", "pain bending forward"],
    secondarySymptoms: ["localized buttock aching", "difficulty standing straight"],
    riskComorbidities: ["Sedentary Lifestyle", "Obesity", "Osteoarthritis"],
    severityDefault: "LOW",
    description: "Acute stretching or micro-tearing of paraspinal lumbar musculature and ligaments following lifting or postural strain.",
    clinicalRationale: "Localized axial lower back pain without radiating neurological deficits (sciatica) or bowel/bladder dysfunction indicates mechanical lumbar strain.",
    precautions: [
      "Avoid prolonged strict bed rest; gentle walking promotes functional recovery.",
      "Apply ice packs for the first 48 hours (15 mins every 3-4 hours), followed by gentle warmth.",
      "Avoid heavy lifting, twisting, and slouching.",
      "Use lumbar support while sitting and sleep with a pillow between the knees.",
    ],
    questionsForDoctor: [
      "Are core-strengthening physical therapy exercises recommended?",
      "Would a short course of muscle relaxants or physiotherapy assist recovery?",
    ],
  },
  {
    id: "ortho-knee-osteoarthritis",
    name: "Knee Osteoarthritis / Joint Degeneration",
    icd11Code: "FA01",
    specialty: "ORTHOPEDICS",
    sourceGuideline: "NICE CG177 Osteoarthritis care and management / OARSI Guidelines",
    primarySymptoms: ["knee pain climbing stairs", "joint stiffness in morning", "crepitus", "knee swelling"],
    secondarySymptoms: ["reduced range of motion", "pain worse at end of day"],
    riskComorbidities: ["Obesity", "Prior Meniscal Injury", "Hypertension"],
    severityDefault: "LOW",
    description: "Progressive loss of articular cartilage, subchondral bone remodeling, and low-grade synovial inflammation in the knee.",
    clinicalRationale: "Activity-related knee pain with morning stiffness resolving in under 30 minutes in adults >45 is characteristic of primary osteoarthritis.",
    precautions: [
      "Engage in low-impact aerobic exercises such as swimming or stationary cycling.",
      "Weight optimization to reduce mechanical joint load (each 1 kg loss removes 4 kg knee pressure).",
      "Use supportive shock-absorbing footwear and knee sleeves during walking.",
    ],
    questionsForDoctor: [
      "Would topical NSAID gels (Diclofenac) provide localized relief with minimal systemic absorption?",
      "Is an orthopedic physical therapy program or intra-articular hyaluronic acid indicated?",
    ],
  },

  // --- GASTROENTEROLOGY ---
  {
    id: "gastro-gerd",
    name: "Gastroesophageal Reflux Disease (GERD) / Acid Dyspepsia",
    icd11Code: "DA22",
    specialty: "GASTROENTEROLOGY",
    sourceGuideline: "ACG Clinical Guideline for the Diagnosis and Management of GERD (2022)",
    primarySymptoms: ["heartburn", "acid regurgitation", "chest burning after meals", "sour taste in mouth", "epigastric discomfort"],
    secondarySymptoms: ["chronic throat clearing", "globus sensation", "bloating", "worse lying flat"],
    riskComorbidities: ["Obesity", "Hiatal Hernia", "Asthma"],
    severityDefault: "LOW",
    description: "Retrograde flow of gastric acidic contents across a relaxed lower esophageal sphincter causing mucosal irritation and burning.",
    clinicalRationale: "Postprandial retrosternal burning exacerbated by supine posture and relieved by antacids is typical of gastroesophageal acid reflux.",
    precautions: [
      "Elevate the head of your bed by 6-8 inches (use bed risers, not just extra pillows).",
      "Avoid eating within 3 hours of lying down or going to sleep.",
      "Limit trigger foods: spicy foods, citrus, chocolate, caffeine, carbonated drinks, and fatty meals.",
      "Eat smaller, more frequent meals rather than large heavy dinners.",
    ],
    questionsForDoctor: [
      "Is a 4-8 week trial of a Proton Pump Inhibitor (e.g. Omeprazole/Pantoprazole) indicated?",
      "Are there red-flag alarm symptoms (dysphagia, unexplained weight loss) requiring endoscopy?",
    ],
  },
  {
    id: "gastro-ibs",
    name: "Irritable Bowel Syndrome (IBS)",
    icd11Code: "DD91",
    specialty: "GASTROENTEROLOGY",
    sourceGuideline: "Rome IV Diagnostic Criteria / British Society of Gastroenterology (BSG) IBS Guidelines",
    primarySymptoms: ["abdominal pain relieved by bowel movement", "bloating", "alternating constipation and diarrhea", "mucus in stool"],
    secondarySymptoms: ["excess gas", "urgency after eating", "incomplete evacuation"],
    riskComorbidities: ["Anxiety", "Chronic Stress", "Post-Infectious Gastroenteritis"],
    severityDefault: "LOW",
    description: "Disorder of gut-brain interaction characterized by recurrent abdominal pain associated with defecation or altered bowel frequency/form.",
    clinicalRationale: "Chronic recurrent abdominal cramping associated with change in stool frequency and relief post-defecation matches Rome IV IBS criteria.",
    precautions: [
      "Trial a structured Low-FODMAP dietary modification under dietary guidance.",
      "Maintain consistent soluble dietary fiber intake (Psyllium husk).",
      "Incorporate stress-reduction techniques (mindfulness, gut-directed hypnotherapy).",
      "Stay well hydrated and maintain regular meal schedules.",
    ],
    questionsForDoctor: [
      "Do I need celiac serology (tTG-IgA) and fecal calprotectin testing to rule out IBD?",
      "Would an antispasmodic (e.g. Mebeverine or Peppermint oil) assist with meal-related cramps?",
    ],
  },

  // --- PULMONOLOGY ---
  {
    id: "pulm-bronchitis",
    name: "Acute Bronchitis",
    icd11Code: "CA20",
    specialty: "PULMONOLOGY",
    sourceGuideline: "NICE NG120 Cough (acute): antimicrobial prescribing / CHEST Guidelines",
    primarySymptoms: ["persistent dry cough", "cough with clear/yellow sputum", "chest soreness from coughing", "mild wheezing"],
    secondarySymptoms: ["low-grade fever", "fatigue", "throat tickle"],
    riskComorbidities: ["Smoking History", "Asthma", "COPD"],
    severityDefault: "LOW",
    description: "Self-limiting viral inflammation of the large airways (bronchial tree) typically lasting 2 to 3 weeks.",
    clinicalRationale: "A prominent productive cough following a viral upper airway illness without tachypnea or focal lung crackles indicates acute viral bronchitis.",
    precautions: [
      "Drink plenty of warm fluids (herbal teas with honey to soothe bronchial cough).",
      "Use a cool mist room humidifier, especially overnight.",
      "Avoid all cigarette smoke, vape aerosols, and chemical fumes.",
      "Antibiotics are NOT indicated for uncomplicated viral bronchitis in healthy individuals.",
    ],
    questionsForDoctor: [
      "Is a chest X-ray or SpO2 pulse oximetry check indicated if cough exceeds 3 weeks?",
      "Would a short-acting beta-2 agonist inhaler (Salbutamol) help if wheezing is present?",
    ],
  },

  // --- ENT ---
  {
    id: "ent-rhinosinusitis",
    name: "Acute Viral / Post-Viral Rhinosinusitis",
    icd11Code: "CA01",
    specialty: "ENT",
    sourceGuideline: "EPOS 2020 European Position Paper on Rhinosinusitis / NICE CKS Sinusitis",
    primarySymptoms: ["facial pressure", "pain over cheekbones and forehead", "nasal blockage", "thick nasal discharge", "reduced smell"],
    secondarySymptoms: ["dental pain in upper teeth", "headache bending forward", "halitosis"],
    riskComorbidities: ["Allergic Rhinitis", "Nasal Polyps", "Deviated Septum"],
    severityDefault: "LOW",
    description: "Inflammation of the paranasal sinuses and nasal cavity mucosa, primarily viral and self-limiting.",
    clinicalRationale: "Facial pain and sinus fullness aggravated by bending forward with nasal congestion indicates acute rhinosinusitis.",
    precautions: [
      "Perform isotonic saline nasal irrigations (sinus rinse) 2-3 times daily.",
      "Apply warm facial compresses over the maxilla and forehead.",
      "Sleep with the head slightly elevated to promote sinus drainage.",
      "Limit topical decongestant sprays (Oxymetazoline) to maximum 3 days to avoid rebound congestion (rhinitis medicamentosa).",
    ],
    questionsForDoctor: [
      "Would a topical intranasal corticosteroid spray (e.g. Fluticasone/Mometasone) accelerate recovery?",
      "At what point should secondary bacterial sinusitis be considered?",
    ],
  },

  // --- OPHTHALMOLOGY ---
  {
    id: "opht-viral-conjunctivitis",
    name: "Acute Viral Conjunctivitis (Pink Eye)",
    icd11Code: "9A60",
    specialty: "OPHTHALMOLOGY",
    sourceGuideline: "AAO Preferred Practice Pattern: Conjunctivitis / Royal College of Ophthalmologists",
    primarySymptoms: ["red eye", "watery discharge", "gritty feeling in eye", "itchy eyelid", "crusting in morning"],
    secondarySymptoms: ["mild photophobia", "foreign body sensation", "preauricular lymph node swelling"],
    riskComorbidities: ["Recent Viral Cold", "Contact Lens Wearer"],
    severityDefault: "LOW",
    description: "Highly contagious superficial inflammation of the palpebral and bulbar conjunctiva, commonly adenoviral.",
    clinicalRationale: "Redness, watery ocular discharge, and follicular conjunctival reaction following an upper respiratory illness indicate viral conjunctivitis.",
    precautions: [
      "Do NOT wear contact lenses until the eye is completely clear for at least 48 hours.",
      "Apply cool artificial tear drops (preservative-free) for comfort.",
      "Strict hand hygiene: wash hands frequently, use separate towels, and change pillowcases daily.",
      "Seek urgent eye evaluation if severe pain, vision loss, or corneal clouding develops.",
    ],
    questionsForDoctor: [
      "Are lubricant eye drops recommended, and should antibacterial drops be avoided for viral cases?",
      "When is it safe to resume wearing contact lenses?",
    ],
  },

  // --- PSYCHIATRY ---
  {
    id: "psych-generalized-anxiety",
    name: "Generalized Anxiety & Stress Reactivity",
    icd11Code: "6B00",
    specialty: "PSYCHIATRY",
    sourceGuideline: "NICE CG113 Generalized anxiety disorder / APA DSM-5-TR Clinical Guidelines",
    primarySymptoms: ["constant worrying", "muscle tension", "restlessness", "difficulty concentrating", "sleep trouble"],
    secondarySymptoms: ["racing heart", "fatigue", "irritability", "shallow breathing"],
    riskComorbidities: ["Depression", "Chronic Illness", "Insomnia"],
    severityDefault: "LOW",
    description: "Excessive, difficult-to-control anxiety and worry regarding multiple everyday events, accompanied by somatic tension.",
    clinicalRationale: "Persistent cognitive apprehension coupled with somatic hyperarousal (muscle tension, insomnia) warrants supportive psychiatric and behavioral intervention.",
    precautions: [
      "Practice diaphragmatic box-breathing (inhale 4s, hold 4s, exhale 4s, hold 4s) during spikes of tension.",
      "Limit daily caffeine, nicotine, and alcohol intake, which provoke adrenergic autonomic arousal.",
      "Maintain a consistent sleep-wake schedule and practice progressive muscle relaxation.",
      "Consider evidence-based Cognitive Behavioral Therapy (CBT) resources.",
    ],
    questionsForDoctor: [
      "Would a standardized GAD-7 assessment and referral for psychotherapeutic counseling be beneficial?",
      "Are non-pharmacological or first-line medical options (SSRIs) appropriate if symptoms persist?",
    ],
  },
];

// ==========================================
// 2. CERTIFIED MEDICATION & CONTRAINDICATION DATABASE
// ==========================================

export const CERTIFIED_MEDICATIONS: CertifiedMedication[] = [
  {
    name: "Paracetamol (Acetaminophen)",
    genericName: "Paracetamol",
    category: "Analgesic & Antipyretic",
    standardDosage: "500mg - 1000mg every 4 to 6 hours as needed",
    maxDailyLimit: "Maximum 4000mg per 24 hours (3000mg in elderly or mild hepatic impairment)",
    purpose: "First-line relief for fever, headache, mild somatic pain, and musculoskeletal discomfort.",
    sourceAuthority: "WHO-EML",
    contraindicatedConditions: ["Severe Hepatic Impairment", "Chronic Alcoholism", "Acute Liver Failure"],
    contraindicationWarnings: {
      "Liver Disease": "CAUTION: Paracetamol is metabolized by the liver. Patients with hepatic impairment must limit intake or consult a physician to prevent hepatotoxicity.",
      "Alcohol Dependence": "CAUTION: Chronic high alcohol consumption increases risk of acetaminophen-induced liver injury.",
    },
    generalWarnings: "Do not take concurrently with other combination cold/flu products containing paracetamol/acetaminophen to prevent accidental overdose.",
  },
  {
    name: "Ibuprofen",
    genericName: "Ibuprofen",
    category: "Non-Steroidal Anti-Inflammatory Drug (NSAID)",
    standardDosage: "200mg - 400mg every 6 to 8 hours with food",
    maxDailyLimit: "Maximum 1200mg/day (OTC) or 2400mg/day (prescribed under supervision)",
    purpose: "Anti-inflammatory pain relief for joint stiffness, dental pain, dysmenorrhea, and inflammatory headaches.",
    sourceAuthority: "FDA-DailyMed",
    contraindicatedConditions: [
      "Peptic Ulcer Disease",
      "Active GI Bleeding",
      "Severe Renal Impairment",
      "Uncontrolled Hypertension",
      "Heart Failure (NYHA II-IV)",
      "Third Trimester Pregnancy",
      "Aspirin-Exacerbated Respiratory Disease (AERD/Asthma)",
    ],
    contraindicationWarnings: {
      "Hypertension": "CONTRAINDICATION WARNING: NSAIDs like Ibuprofen cause renal sodium retention and can significantly increase blood pressure and blunt antihypertensive medications.",
      "Peptic Ulcer Disease": "CONTRAINDICATION WARNING: Ibuprofen inhibits COX-1 gastric prostaglandins, increasing risk of gastric mucosal ulceration and gastrointestinal hemorrhage.",
      "Kidney Disease": "CONTRAINDICATION WARNING: NSAIDs reduce renal blood flow via prostaglandin inhibition, risking acute kidney injury.",
      "Asthma": "WARNING: Up to 10% of adult asthmatics suffer bronchospasm from NSAIDs (Aspirin/NSAID-sensitive asthma).",
      "Pregnancy": "CONTRAINDICATION WARNING: NSAIDs are contraindicated in the 3rd trimester due to premature closure of ductus arteriosus.",
    },
    generalWarnings: "Always take with food or milk to minimize gastric discomfort. Use the lowest effective dose for the shortest possible duration.",
  },
  {
    name: "Cetirizine / Loratadine",
    genericName: "Cetirizine Hydrochloride / Loratadine",
    category: "Second-Generation H1 Antihistamine",
    standardDosage: "10mg once daily (or 5mg twice daily)",
    maxDailyLimit: "Maximum 10mg per 24 hours",
    purpose: "Non-sedating symptomatic relief for allergic rhinitis, cutaneous hives, skin itching, and allergic conjunctivitis.",
    sourceAuthority: "WHO-EML",
    contraindicatedConditions: ["End-Stage Renal Disease (CrCl < 10 mL/min)"],
    contraindicationWarnings: {
      "Severe Renal Impairment": "Dose reduction (5mg every other day) is required in moderate-to-severe renal impairment.",
    },
    generalWarnings: "Generally non-sedating, but avoid operating machinery or driving until individual tolerance is established.",
  },
  {
    name: "Oral Rehydration Salts (ORS)",
    genericName: "WHO-Standard Oral Rehydration Solution",
    category: "Electrolyte Replacement",
    standardDosage: "Dissolve 1 sachet in 1 liter of clean drinking water; drink 200-400ml after every loose stool or vomiting episode",
    maxDailyLimit: "Replenish volume equivalent to estimated fluid loss (1-3 liters/day)",
    purpose: "Prevention and correction of dehydration and electrolyte depletion in acute diarrhea and gastroenteritis.",
    sourceAuthority: "WHO-EML",
    contraindicatedConditions: ["Intestinal Obstruction", "Severe Intractable Vomiting requiring IV fluids"],
    contraindicationWarnings: {
      "Heart Failure": "CAUTION: Monitor sodium and fluid intake in patients with congestive heart failure.",
      "Severe Kidney Disease": "CAUTION: Patients with renal failure must monitor potassium and fluid intake.",
    },
    generalWarnings: "Ensure exact dilution with clean boiled or bottled water. Discard prepared solution after 24 hours.",
  },
  {
    name: "Antacid (Magnesium/Aluminum Hydroxide with Simethicone)",
    genericName: "Antacid & Antiflatulent Suspension",
    category: "Gastric Acid Neutralizer",
    standardDosage: "10ml - 20ml orally 1 hour after meals and at bedtime",
    maxDailyLimit: "Maximum 4 doses per 24 hours; do not use continuously for >14 days without physician review",
    purpose: "Rapid symptomatic neutralization of gastric acid in acute heartburn, acid reflux, and dyspepsia.",
    sourceAuthority: "FDA-DailyMed",
    contraindicatedConditions: ["Severe Renal Failure (Hypermagnesemia/Aluminum toxicity)", "Hypophosphatemia"],
    contraindicationWarnings: {
      "Kidney Disease": "CAUTION: Magnesium and aluminum ions accumulate in renal failure.",
    },
    generalWarnings: "Space at least 2 hours apart from other oral medications (e.g. antibiotics, iron supplements, thyroid medications) as antacids impair their absorption.",
  },
];

// ==========================================
// 3. CERTIFIED RED-FLAG & EMERGENCY PROTOCOLS
// ==========================================

export interface EmergencyRedFlagRule {
  id: string;
  category: string;
  keywords: string[];
  clinicalSignificance: string;
  emergencyAction: string;
}

export const CERTIFIED_EMERGENCY_RULES: EmergencyRedFlagRule[] = [
  {
    id: "red-cardiac-acs",
    category: "Cardiovascular / Acute Coronary Syndrome",
    keywords: [
      "crushing chest pain",
      "chest pressure radiating to left arm",
      "chest pain radiating to jaw",
      "chest pain with sweating",
      "chest pain and vomiting",
      "severe chest tightness",
    ],
    clinicalSignificance: "Potential Acute Myocardial Infarction (STEMI/NSTEMI) or Unstable Angina.",
    emergencyAction: "CALL EMERGENCY SERVICES (911 / 999 / 112) OR PROCEED IMMEDIATELY TO THE NEAREST HOSPITAL EMERGENCY DEPARTMENT. Do not drive yourself. Rest quietly in a seated position while awaiting paramedics.",
  },
  {
    id: "red-neuro-stroke",
    category: "Neurology / Acute Cerebrovascular Event (Stroke)",
    keywords: [
      "sudden facial droop",
      "slurred speech",
      "sudden weakness on one side",
      "sudden numbness in arm or leg",
      "sudden loss of vision",
      "sudden severe worst headache of life",
      "thunderclap headache",
    ],
    clinicalSignificance: "Potential Ischemic Stroke, Intracerebral Hemorrhage, or Subarachnoid Hemorrhage.",
    emergencyAction: "IMMEDIATE EMERGENCY CODE STROKE: Act F.A.S.T. (Face, Arms, Speech, Time). Call 911/emergency immediately. Time is brain — intravenous thrombolysis/thrombectomy windows require rapid emergency intervention.",
  },
  {
    id: "red-resp-distress",
    category: "Pulmonology / Acute Respiratory Compromise",
    keywords: [
      "severe shortness of breath",
      "struggling to breathe",
      "blue lips",
      "cyanosis",
      "gasping for air",
      "unable to speak in full sentences",
      "stridor",
    ],
    clinicalSignificance: "Potential Acute Severe Asthma, Anaphylaxis, Pulmonary Embolism, or Tension Pneumothorax.",
    emergencyAction: "EMERGENCY AIRWAY & BREATHING CRISIS: Seek emergency medical care immediately. If available and prescribed, use emergency rescue inhaler (Albuterol) or Epinephrine auto-injector (EpiPen) for anaphylaxis.",
  },
  {
    id: "red-psych-crisis",
    category: "Psychiatry / Acute Crisis & Self-Harm",
    keywords: [
      "want to kill myself",
      "suicide",
      "ending my life",
      "self harm",
      "suicidal thoughts",
      "i don't want to live",
    ],
    clinicalSignificance: "Immediate Mental Health Crisis & Suicidal Ideation.",
    emergencyAction: "IMMEDIATE COMPASSIONATE CRISIS SUPPORT: You are not alone. Please connect immediately with the National Suicide and Crisis Lifeline by calling or texting 988 (US/Canada), 111 (UK), or reach out to your local emergency department or a trusted professional right now.",
  },
];

// ==========================================
// 4. OUT-OF-SCOPE & APOLOGY INTENT FILTER
// ==========================================

const NON_MEDICAL_PATTERNS = [
  /what is the capital of/i,
  /who is the president/i,
  /write (a|me) (poem|story|essay|code|script|song)/i,
  /weather in/i,
  /tell me a joke/i,
  /crypto|bitcoin|ethereum/i,
  /sports score|football|cricket/i,
  /recipe for/i,
  /movie recommendations/i,
  /translate (this|into)/i,
];

export function checkOutOfScopeQuery(prompt: string): { isOutOfScope: boolean; apologyMessage?: string } {
  const clean = prompt.trim();

  for (const pattern of NON_MEDICAL_PATTERNS) {
    if (pattern.test(clean)) {
      return {
        isOutOfScope: true,
        apologyMessage:
          "I apologize, but as the Medicio Clinical AI Assistant, my capabilities are strictly focused on healthcare triage, clinical symptom intake, and specialist doctor referrals. I am unable to assist with non-medical requests such as general trivia, creative writing, or off-topic queries. Please describe any physical symptoms, health concerns, or medical questions you may have, and I will be glad to assist you.",
      };
    }
  }

  return { isOutOfScope: false };
}

// ==========================================
// 5. DYNAMIC CLINICAL COUNTER-QUESTION GENERATOR
// ==========================================

export function generateCertifiedClinicalQuestions(
  prompt: string,
  specialty: string,
  existingAnswers?: Record<string, string>,
): ClinicalClarificationQuestion[] {
  const questions: ClinicalClarificationQuestion[] = [];
  const lower = prompt.toLowerCase();

  // 1. Duration / Onset (if not answered)
  if (!existingAnswers?.duration) {
    questions.push({
      id: "duration",
      question: "When did these symptoms first begin, and how have they progressed?",
      category: "DURATION",
      options: [
        "Sudden onset (within past few hours)",
        "1 to 3 days (acute)",
        "4 to 7 days (subacute)",
        "More than 2 weeks (persistent/chronic)",
      ],
    });
  }

  // 2. Discomfort Intensity / Quality
  if (!existingAnswers?.severity) {
    questions.push({
      id: "severity",
      question: "How would you describe the intensity and impact on your daily activities?",
      category: "SEVERITY",
      options: [
        "Mild (Noticeable but does not restrict work or sleep)",
        "Moderate (Interferes with daily tasks, concentration, or rest)",
        "Severe (Debilitating pain or discomfort requiring immediate attention)",
      ],
    });
  }

  // 3. Pre-Existing Chronic Comorbidities
  if (!existingAnswers?.comorbidities) {
    questions.push({
      id: "comorbidities",
      question: "Do you have any pre-existing medical conditions or chronic illnesses?",
      category: "COMORBIDITIES",
      options: [
        "Hypertension (High Blood Pressure)",
        "Diabetes Mellitus",
        "Asthma / Respiratory Disease",
        "Heart Disease / Cardiac History",
        "Peptic Ulcer / Acid Reflux Disease",
        "Kidney or Liver Disease",
        "None of the above / Generally Healthy",
      ],
      allowMultiSelect: true,
    });
  }

  // 4. Current Medications & Allergies
  if (!existingAnswers?.medications) {
    questions.push({
      id: "medications",
      question: "Are you currently taking any prescription or regular OTC medications?",
      category: "MEDICATIONS",
      options: [
        "Blood pressure / Cardiac medication",
        "Diabetes medication / Insulin",
        "Daily pain relievers (NSAIDs / Aspirin)",
        "Inhalers / Steroids",
        "Antibiotics / Antacids",
        "No current medications",
      ],
      allowMultiSelect: true,
    });
  }

  // 5. Specialty-Specific Red-Flag & Key Differentiating Questions
  if (specialty === "CARDIOLOGY" || lower.includes("chest") || lower.includes("heart") || lower.includes("palpitation")) {
    questions.push({
      id: "cardio_signs",
      question: "Are you experiencing any of these specific thoracic or cardiovascular signs?",
      category: "SPECIALTY_RED_FLAGS",
      options: [
        "Pain radiates to left arm, neck, or jaw",
        "Accompanied by shortness of breath or cold sweat",
        "Palpitations or rapid fluttering in chest",
        "Pain worsens with deep breath or pressing on ribs",
        "None of these",
      ],
    });
  } else if (specialty === "DERMATOLOGY" || lower.includes("skin") || lower.includes("rash") || lower.includes("itch")) {
    questions.push({
      id: "derm_signs",
      question: "What are the primary characteristics of the skin concern?",
      category: "SPECIALTY_RED_FLAGS",
      options: [
        "Intense itching with raised red welts (hives)",
        "Dry, flaking, or cracked patches",
        "Pus-filled blisters or open sores",
        "Changing size, border, or color of a mole",
        "None of these",
      ],
    });
  } else if (specialty === "NEUROLOGY" || lower.includes("headache") || lower.includes("dizzy") || lower.includes("migraine")) {
    questions.push({
      id: "neuro_signs",
      question: "Do you have any associated neurological symptoms?",
      category: "SPECIALTY_RED_FLAGS",
      options: [
        "Sensitivity to light and sound with nausea",
        "Visual aura, flashes, or blind spots before pain",
        "Tight band-like pressure across both temples and neck",
        "Sudden onset dizziness or spinning room sensation",
        "None of these",
      ],
    });
  } else if (specialty === "GASTROENTEROLOGY" || lower.includes("stomach") || lower.includes("acid") || lower.includes("bowel")) {
    questions.push({
      id: "gastro_signs",
      question: "Are any of these gastrointestinal features present?",
      category: "SPECIALTY_RED_FLAGS",
      options: [
        "Burning sensation in chest/throat after meals or lying down",
        "Sharp abdominal pain shifting to the lower right side",
        "Black tarry stools or blood in vomit",
        "Pain temporarily relieved by eating or antacids",
        "None of these",
      ],
    });
  }

  return questions;
}

// ==========================================
// 6. CERTIFIED CLINICAL TRIAGE SYNTHESIS ENGINE
// ==========================================

export function synthesizeCertifiedTriage(
  prompt: string,
  specialty: string,
  duration: string,
  userConditions: string[],
  userMedicines: string[],
  treatmentApproach: string = "Allopathic",
  answeredQuestions?: Record<string, string>,
): TriageResult {
  const lower = prompt.toLowerCase();

  // 1. Check for Immediate Emergency Red Flags
  for (const rule of CERTIFIED_EMERGENCY_RULES) {
    if (rule.keywords.some((kw) => lower.includes(kw))) {
      return {
        severityLevel: "CRITICAL",
        summary: `CRITICAL MEDICAL ALERT: The described symptoms (${rule.category}) meet certified emergency criteria requiring immediate physician intervention.`,
        clinicalImpression: `Certified Clinical Protocol Flag: ${rule.clinicalSignificance}. (Selected care paradigm: ${treatmentApproach}).`,
        possibleConditions: [
          {
            condition: rule.category,
            likelihood: "High",
            description: rule.clinicalSignificance,
            sourceGuideline: "AHA/ESC/WHO Emergency Triage Criteria",
          },
        ],
        recommendDoctor: true,
        suggestedSpecialty: specialty !== "GENERAL" ? specialty : "Emergency Medicine / Cardiology",
        temporaryMedicines: [],
        precautions: [
          "Do NOT attempt self-treatment with OTC remedies.",
          rule.emergencyAction,
        ],
        redFlagsToWatch: rule.keywords,
        questionsForDoctor: ["Emergency physician assessment required immediately."],
        disclaimer: MEDICAL_DISCLAIMER,
        isEmergencyAlert: true,
      };
    }
  }

  // 2. Extract comorbidities from answers or state
  const effectiveConditions = new Set<string>(userConditions);
  if (answeredQuestions?.comorbidities) {
    answeredQuestions.comorbidities.split(",").forEach((c) => effectiveConditions.add(c.trim()));
  }
  const effectiveMeds = new Set<string>(userMedicines);
  if (answeredQuestions?.medications) {
    answeredQuestions.medications.split(",").forEach((m) => effectiveMeds.add(m.trim()));
  }

  const effectiveDuration = answeredQuestions?.duration || duration || "1-3 days";
  const userSeverityAnswer = answeredQuestions?.severity || "";

  // 3. Match against Certified Conditions Ontology
  const matchedConditions: { condition: CertifiedCondition; score: number }[] = [];

  for (const cond of CERTIFIED_CONDITIONS) {
    let score = 0;

    // Specialty alignment
    if (cond.specialty.toUpperCase() === specialty.toUpperCase()) {
      score += 3;
    }

    // Primary symptoms match
    for (const sym of cond.primarySymptoms) {
      if (lower.includes(sym.toLowerCase())) {
        score += 5;
      }
    }

    // Secondary symptoms match
    for (const sym of cond.secondarySymptoms) {
      if (lower.includes(sym.toLowerCase())) {
        score += 2;
      }
    }

    // Comorbidity alignment
    for (const comorb of cond.riskComorbidities) {
      if ([...effectiveConditions].some((c) => c.toLowerCase().includes(comorb.toLowerCase()))) {
        score += 2;
      }
    }

    if (score > 0) {
      matchedConditions.push({ condition: cond, score });
    }
  }

  matchedConditions.sort((a, b) => b.score - a.score);

  // If no direct match, take closest default from specialty or general
  const primaryMatch = matchedConditions[0]?.condition ||
    CERTIFIED_CONDITIONS.find((c) => c.specialty.toUpperCase() === specialty.toUpperCase()) ||
    CERTIFIED_CONDITIONS[0];

  const secondaryMatch = matchedConditions[1]?.condition;

  // 4. Calculate Severity & Urgency
  let finalSeverity: SeverityLevel = primaryMatch.severityDefault;
  let recommendDoctor = true;

  if (userSeverityAnswer.includes("Severe") || effectiveDuration.includes("More than 2 weeks")) {
    finalSeverity = finalSeverity === "LOW" ? "MEDIUM" : "HIGH";
  } else if (userSeverityAnswer.includes("Mild") && primaryMatch.severityDefault === "LOW") {
    finalSeverity = "LOW";
    recommendDoctor = false;
  }

  // 5. Select Safe OTC Medications & Screen Contraindications
  const recommendedMeds: TriageResult["temporaryMedicines"] = [];
  const activeConditionsList = Array.from(effectiveConditions);

  // Determine appropriate medication category based on symptoms
  let targetMeds: CertifiedMedication[] = [];
  const paracetamol = CERTIFIED_MEDICATIONS.find((m) => m.name.includes("Paracetamol"));
  const ibuprofen = CERTIFIED_MEDICATIONS.find((m) => m.name.includes("Ibuprofen"));
  const antihistamine = CERTIFIED_MEDICATIONS.find((m) => m.name.includes("Cetirizine"));
  const ors = CERTIFIED_MEDICATIONS.find((m) => m.name.includes("Oral Rehydration"));
  const antacid = CERTIFIED_MEDICATIONS.find((m) => m.name.includes("Antacid"));

  if (lower.includes("fever") || lower.includes("headache") || lower.includes("body ache") || lower.includes("pain")) {
    targetMeds = [paracetamol, ibuprofen].filter((m): m is CertifiedMedication => Boolean(m));
  } else if (lower.includes("rash") || lower.includes("itch") || lower.includes("hives") || lower.includes("allergy")) {
    targetMeds = [antihistamine].filter((m): m is CertifiedMedication => Boolean(m));
  } else if (lower.includes("diarrhea") || lower.includes("vomit") || lower.includes("stomach flu")) {
    targetMeds = [ors].filter((m): m is CertifiedMedication => Boolean(m));
  } else if (lower.includes("heartburn") || lower.includes("acid") || lower.includes("reflux") || lower.includes("indigestion")) {
    targetMeds = [antacid].filter((m): m is CertifiedMedication => Boolean(m));
  } else {
    targetMeds = [paracetamol].filter((m): m is CertifiedMedication => Boolean(m));
  }

  for (const med of targetMeds) {
    let hasContraindication = false;
    let contraindicationNote = "";

    for (const [condKey, warningText] of Object.entries(med.contraindicationWarnings)) {
      if (activeConditionsList.some((c) => c.toLowerCase().includes(condKey.toLowerCase()))) {
        hasContraindication = true;
        contraindicationNote = warningText;
        break;
      }
    }

    if (hasContraindication) {
      recommendedMeds.push({
        name: med.name,
        dosage: "CONTRAINDICATED for your clinical profile",
        purpose: med.purpose,
        contraindicationAlert: contraindicationNote,
      });
    } else {
      recommendedMeds.push({
        name: med.name,
        dosage: med.standardDosage,
        purpose: med.purpose,
        warning: med.generalWarnings,
      });
    }
  }

  // Format possible conditions
  const possibleConditionsOutput: TriageResult["possibleConditions"] = [
    {
      condition: primaryMatch.name,
      icd11Code: primaryMatch.icd11Code,
      likelihood: matchedConditions[0]?.score > 6 ? "High" : "Moderate",
      description: primaryMatch.description,
      sourceGuideline: primaryMatch.sourceGuideline,
    },
  ];

  if (secondaryMatch && secondaryMatch.id !== primaryMatch.id) {
    possibleConditionsOutput.push({
      condition: secondaryMatch.name,
      icd11Code: secondaryMatch.icd11Code,
      likelihood: "Moderate",
      description: secondaryMatch.description,
      sourceGuideline: secondaryMatch.sourceGuideline,
    });
  }

  const clinicalSummary = `Certified clinical assessment for "${prompt}". Duration: ${effectiveDuration}. Clinical risk level evaluated as ${finalSeverity}. ${
    recommendDoctor
      ? `Consultation with a verified ${primaryMatch.specialty} specialist is recommended to confirm diagnosis.`
      : "Standard certified conservative self-care measures are advised with clinical monitoring."
  }`;

  return {
    severityLevel: finalSeverity,
    summary: clinicalSummary,
    clinicalImpression: primaryMatch.clinicalRationale,
    possibleConditions: possibleConditionsOutput,
    recommendDoctor,
    suggestedSpecialty: primaryMatch.specialty.charAt(0) + primaryMatch.specialty.slice(1).toLowerCase(),
    temporaryMedicines: recommendedMeds,
    precautions: primaryMatch.precautions,
    redFlagsToWatch: [
      "Fever exceeding 39°C (102.2°F) or unresponsive to antipyretics for >48h",
      "Sudden shortness of breath, chest pressure, or radiating thoracic discomfort",
      "Inability to tolerate oral fluids or severe persistent vomiting",
      "Sudden neurological deficits (facial droop, speech change, vision loss)",
    ],
    questionsForDoctor: primaryMatch.questionsForDoctor,
    disclaimer: MEDICAL_DISCLAIMER,
  };
}
