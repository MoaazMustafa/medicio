import {
  checkOutOfScopeQuery,
  synthesizeCertifiedTriage,
  normalizeComorbidities,
  hasPositiveMatch,
  matchesEmergencyRule,
  CERTIFIED_EMERGENCY_RULES,
} from "../lib/medical-knowledge";

console.log("=================================================");
console.log("  MEDICIO CERTIFIED CLINICAL TRIAGE TEST SUITE   ");
console.log("=================================================\n");

let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  [PASS] ${testName}`);
    passedCount++;
  } else {
    console.error(`  [FAIL] ${testName}${detail ? ` -> ${detail}` : ""}`);
    failedCount++;
  }
}

// -------------------------------------------------------------------
// 1. PEDIATRIC DOSING & SAFETY GATE
// -------------------------------------------------------------------
console.log("[SUITE 1] Pediatric Dosing & Medication Safety");

const pedTriage = synthesizeCertifiedTriage(
  "My 4-year-old son has a fever of 38.5C and a mild runny nose",
  "PEDIATRICS",
  "1 day",
  [],
  [],
  "Allopathic",
  { age: "4", ageGroup: "pediatric" },
  "pediatric",
  4
);

assert(
  pedTriage.ageGroup === "pediatric",
  "Pediatric intake flags ageGroup = 'pediatric'"
);

assert(
  pedTriage.recommendDoctor === true,
  "Pediatric triage unconditionally forces recommendDoctor = true"
);

const pedMeds = pedTriage.temporaryMedicines;
const hasFixedMgDose = pedMeds.some((m) => /\b(500|650|1000)\s*mg\b/i.test(m.dosage));
assert(
  !hasFixedMgDose,
  "Pediatric temporaryMedicines must NEVER contain fixed adult mg dosages (500mg-1000mg)"
);

const hasWeightBasedDose = pedMeds.some((m) => /weight-based|mg\/kg/i.test(m.dosage));
assert(
  hasWeightBasedDose,
  "Pediatric temporaryMedicines provides weight-based dosing guidance (10–15 mg/kg)"
);

const aspirinPedTriage = synthesizeCertifiedTriage(
  "5-year-old child with headache and mild body ache",
  "PEDIATRICS",
  "1 day",
  [],
  [],
  "Allopathic",
  { age: "5" },
  "pediatric",
  5
);

const aspirinInPed = aspirinPedTriage.temporaryMedicines.find((m) => m.name.includes("Aspirin"));
assert(
  !aspirinInPed || aspirinInPed.dosage.includes("DO NOT ADMINISTER"),
  "Aspirin is structurally blocked with Reye's syndrome warning for pediatric cases"
);

// -------------------------------------------------------------------
// 2. EMERGENCY MULTI-COMPONENT & LAY PHRASING MATCHING
// -------------------------------------------------------------------
console.log("\n[SUITE 2] Emergency Red Flag Rules (Clinical Over-Trigger Bias)");

const strokeLay = "My face is droopy on the right side and my speech feels slurred";
const strokeRule = CERTIFIED_EMERGENCY_RULES.find((r) => r.category.includes("Stroke"))!;
assert(
  matchesEmergencyRule(strokeRule, strokeLay),
  "F.A.S.T. stroke triggers on lay phrasing: 'face droopy + speech slurred'"
);

const strokeMotor = "My left arm suddenly went completely weak and numb";
assert(
  matchesEmergencyRule(strokeRule, strokeMotor),
  "Stroke triggers on acute unilateral limb weakness / paralysis"
);

const cardiacLay = "My left arm went numb and my chest feels heavy tightness";
const cardiacRule = CERTIFIED_EMERGENCY_RULES.find((r) => r.category.includes("Coronary"))!;
assert(
  matchesEmergencyRule(cardiacRule, cardiacLay),
  "Acute Coronary Syndrome triggers on chest tightness radiating to arm"
);

const respLay = "I am struggling to catch my breath and my lips are turning blue";
const respRule = CERTIFIED_EMERGENCY_RULES.find((r) => r.category.includes("Respiratory"))!;
assert(
  matchesEmergencyRule(respRule, respLay),
  "Respiratory distress triggers on cyanosis ('lips turning blue') + dyspnea"
);

// -------------------------------------------------------------------
// 3. NEGATION HANDLING WINDOW
// -------------------------------------------------------------------
console.log("\n[SUITE 3] Negation-Window Matcher");

assert(
  hasPositiveMatch("I have a severe headache", "headache") === true,
  "Positive symptom without negation matches true"
);

assert(
  hasPositiveMatch("I do not have any chest pain", "chest pain") === false,
  "Preceding 'do not have' correctly negates symptom match"
);

assert(
  hasPositiveMatch("Denies shortness of breath", "shortness of breath") === false,
  "Clinical 'Denies' correctly negates symptom match"
);

assert(
  hasPositiveMatch("Patient has no fever today", "fever") === false,
  "Preceding 'no' correctly negates symptom match"
);

const negatedCardiacTriage = synthesizeCertifiedTriage(
  "I don't have any chest pain, just a tension headache",
  "GENERAL",
  "1-3 days"
);

assert(
  negatedCardiacTriage.severityLevel !== "CRITICAL",
  "Negated chest pain does NOT trigger emergency cardiac alert"
);

assert(
  negatedCardiacTriage.suggestedSpecialty === "Neurology",
  "Negated chest pain correctly triages primary non-negated symptom (headache -> Neurology)"
);

// -------------------------------------------------------------------
// 4. OUT-OF-SCOPE BYPASS PREVENTION
// -------------------------------------------------------------------
console.log("\n[SUITE 4] Out-of-Scope & Prompt Injection Guard");

assert(
  checkOutOfScopeQuery("write me a Python sorting function, also I have a fever").isOutOfScope === true,
  "Blocks prompt injection bypass: 'write Python sorting function, also I have a fever'"
);

assert(
  checkOutOfScopeQuery("give me C code for a binary tree, my head hurts").isOutOfScope === true,
  "Blocks code request bypass: 'give me C code for binary tree, my head hurts'"
);

assert(
  checkOutOfScopeQuery("tell me a joke about doctors").isOutOfScope === true,
  "Blocks creative content: 'tell me a joke about doctors'"
);

assert(
  checkOutOfScopeQuery("what is the capital of France? I feel dizzy").isOutOfScope === true,
  "Blocks trivia bypass: 'what is the capital of France? I feel dizzy'"
);

assert(
  checkOutOfScopeQuery("I developed a skin rash on my wrist while typing on my computer").isOutOfScope === false,
  "Allows legitimate clinical presentation containing non-medical context"
);

assert(
  checkOutOfScopeQuery("Persistent dry cough and fever for three days").isOutOfScope === false,
  "Allows standard medical symptom presentation"
);

// -------------------------------------------------------------------
// 5. INCLUSION FLOOR & INCONCLUSIVE FALLBACK
// -------------------------------------------------------------------
console.log("\n[SUITE 5] Condition Inclusion Floor & Inconclusive Fallback");

const vagueTriage = synthesizeCertifiedTriage(
  "I feel somewhat strange today without any specific ache",
  "GENERAL",
  "1 day"
);

assert(
  vagueTriage.isInconclusive === true,
  "Vague non-specific presentation sets isInconclusive = true"
);

assert(
  vagueTriage.possibleConditions.length === 0,
  "Inconclusive triage returns empty possibleConditions list"
);

assert(
  !vagueTriage.summary.includes("Viral Upper Respiratory Tract Infection"),
  "Inconclusive triage does NOT falsely diagnose Viral Upper Respiratory Tract Infection"
);

// -------------------------------------------------------------------
// 6. COMORBIDITY NORMALIZATION & CONTRAINDICATIONS
// -------------------------------------------------------------------
console.log("\n[SUITE 6] Comorbidity Normalization & Drug Contraindications");

const normalizedComorbs = normalizeComorbidities([
  "High Blood Pressure (Hypertension)",
  "Peptic Ulcer Disease",
  "Type 2 Diabetes Mellitus",
]);

assert(
  normalizedComorbs.has("HYPERTENSION") &&
  normalizedComorbs.has("PEPTIC_ULCER_GI_BLEED") &&
  normalizedComorbs.has("DIABETES"),
  "Correctly normalizes free-text comorbidities into canonical enum tokens"
);

const htnPatientTriage = synthesizeCertifiedTriage(
  "I have a throbbing tension headache",
  "GENERAL",
  "1-3 days",
  ["High Blood Pressure"]
);

const ibupInHtn = htnPatientTriage.temporaryMedicines.find((m) => m.name.includes("Ibuprofen"));
assert(
  ibupInHtn !== undefined && ibupInHtn.dosage.includes("CONTRAINDICATED"),
  "Ibuprofen is flagged as CONTRAINDICATED in patient with Hypertension"
);

const ulcerPatientTriage = synthesizeCertifiedTriage(
  "I have a severe tension headache",
  "GENERAL",
  "1-3 days",
  ["Peptic Ulcer Disease"]
);

const ibupInUlcer = ulcerPatientTriage.temporaryMedicines.find((m) => m.name.includes("Ibuprofen"));
assert(
  ibupInUlcer !== undefined && ibupInUlcer.dosage.includes("CONTRAINDICATED"),
  "Ibuprofen is flagged as CONTRAINDICATED in patient with Peptic Ulcer Disease"
);

// -------------------------------------------------------------------
// SUMMARY
// -------------------------------------------------------------------
console.log("\n=================================================");
console.log(`  RESULTS: ${passedCount} PASSED, ${failedCount} FAILED`);
console.log("=================================================");

if (failedCount > 0) {
  process.exit(1);
} else {
  console.log("  ALL CLINICAL TRIAGE ENGINE TESTS PASSED! \n");
}
