// Local development seed. Every person and organization here is fictional.
//
// Test accounts. Locally they share DEV_PASSWORD below. On any deployed
// environment set SEED_PASSWORD instead: the seed refuses to publish the
// documented dev password on a public server.
//   admin@imedica.test        Imedica administrator
//   physician@imedica.test    physician, author of the scenarios
//   reviewer@imedica.test     second physician (publishes; two-person rule)
//   instructor@lakeshore.test training lead at Lakeshore Paramedic Services
//   medic1..medic6@lakeshore.test  paramedics
import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

import { PrismaClient } from "../src/generated/prisma/client";
import type { ActionCategory, Outcome, ParamedicLevel, ScenarioCategory } from "../src/generated/prisma/enums";
import { experienceBucket, keyedHash, weekStart } from "../src/server/privacy/hash";

export const DEV_PASSWORD = "Imedica-dev-2026";

const seedPassword = process.env.SEED_PASSWORD || DEV_PASSWORD;
const deployed = process.env.NODE_ENV === "production" || Boolean(process.env.RAILWAY_ENVIRONMENT);
if (deployed && seedPassword === DEV_PASSWORD) {
  throw new Error("Set SEED_PASSWORD before seeding a deployed environment.");
}

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });
const secret = process.env.DEIDENTIFICATION_SECRET!;
if (!secret || secret.length < 32) throw new Error("Set DEIDENTIFICATION_SECRET in .env first.");

type StateDef = { key: string; title: string; narrative: string; vitals: Record<string, unknown>; isStart?: boolean; isTerminal?: boolean; debrief?: string };
type ActionDef = { key: string; category: ActionCategory; label: string; detail?: string };
type RuleDef = {
  from: string | null;
  action: string;
  outcome: Outcome;
  points: number;
  to?: string;
  within?: number;
  rationale: string;
  feedback?: string;
  required?: boolean;
  priority?: number;
};
type ScenarioDef = {
  slug: string;
  title: string;
  summary: string;
  dispatch: string;
  category: ScenarioCategory;
  difficulty: "FOUNDATIONAL" | "INTERMEDIATE" | "ADVANCED";
  timeLimitSec: number;
  learningGoals: string[];
  protocolSource: string;
  status: "DRAFT" | "IN_REVIEW" | "PUBLISHED";
  states: StateDef[];
  actions: ActionDef[];
  feedback: { key: string; title: string; body: string; reference?: string }[];
  rules: RuleDef[];
};

const stemi: ScenarioDef = {
  slug: "inferior-stemi-rv-involvement",
  title: "Inferior STEMI with right ventricular involvement",
  summary: "Crushing chest pain in a 58-year-old man. Find the STEMI, protect the pressure, and get him to the cath lab.",
  dispatch: "Priority 4. 58-year-old male, chest pain for 40 minutes, sweating. Conscious and breathing. Caller is his wife.",
  category: "CARDIAC",
  difficulty: "INTERMEDIATE",
  timeLimitSec: 900,
  learningGoals: [
    "Acquire and interpret a 12-lead within ten minutes",
    "Recognise when nitroglycerin is contraindicated",
    "Activate a STEMI bypass to a PCI centre",
  ],
  protocolSource: "Ontario ALS Patient Care Standards — Cardiac Ischemia; STEMI Hospital Destination",
  status: "PUBLISHED",
  states: [
    {
      key: "arrival",
      title: "On scene",
      narrative: "He's sitting on the kitchen floor against the cupboards, pale and diaphoretic, a fist pressed to his sternum. Pain is 9/10, radiating to the jaw. No allergies. Takes atorvastatin.",
      vitals: { hr: 108, sbp: 94, dbp: 60, rr: 22, spo2: 95, gcs: 15, glucose: 7.1, rhythm: "stemi", skin: "Pale, diaphoretic" },
      isStart: true,
    },
    {
      key: "stemi",
      title: "Inferior STEMI identified",
      narrative: "The 12-lead shows 3 mm ST elevation in II, III and aVF with reciprocal depression in I and aVL. He's still pale and grey.",
      vitals: { hr: 106, sbp: 96, dbp: 62, rr: 22, spo2: 95, gcs: 15, rhythm: "stemi", skin: "Pale, diaphoretic" },
    },
    {
      key: "hypotensive",
      title: "Pressure falling",
      narrative: "Two minutes later he's confused and clammy. 'I feel like I'm going to pass out.'",
      vitals: { hr: 124, sbp: 71, dbp: 40, rr: 26, spo2: 93, gcs: 14, rhythm: "tachycardia", skin: "Grey, cold" },
    },
    {
      key: "bypass",
      title: "STEMI bypass accepted",
      narrative: "The PCI centre accepts the bypass and the cath lab is being activated. He's packaged on the stretcher.",
      vitals: { hr: 102, sbp: 98, dbp: 64, rr: 20, spo2: 96, gcs: 15, rhythm: "stemi", skin: "Pale" },
    },
    {
      key: "handover_pci",
      title: "Handover at the cath lab",
      narrative: "You hand over to the interventional team with the 12-lead, times and medications given.",
      vitals: { hr: 98, sbp: 102, dbp: 66, rr: 18, spo2: 97, gcs: 15, rhythm: "stemi" },
      isTerminal: true,
      debrief: "Door-to-balloon time starts with your 12-lead. Early ASA, no nitrates with a soft pressure, and a direct bypass are what move survival in inferior STEMI.",
    },
    {
      key: "handover_ed",
      title: "Handover at a non-PCI emergency department",
      narrative: "The nearest ED takes him. The physician starts arranging a transfer to the PCI centre.",
      vitals: { hr: 104, sbp: 96, dbp: 62, rr: 20, spo2: 95, gcs: 15, rhythm: "stemi" },
      isTerminal: true,
      debrief: "With a confirmed STEMI, the closest emergency department isn't the right destination. The inter-facility transfer adds time the heart muscle doesn't have.",
    },
    {
      key: "arrest",
      title: "Cardiac arrest",
      narrative: "He slumps sideways. No pulse. The monitor shows ventricular fibrillation.",
      vitals: { hr: 0, sbp: 0, dbp: 0, rr: 0, spo2: null, gcs: 3, rhythm: "vfib", skin: "Mottled" },
      isTerminal: true,
      debrief: "A second dose of nitroglycerin in a hypotensive right-ventricular infarct removed the preload the heart depended on. This run ends here so the lesson is the one that sticks.",
    },
  ],
  actions: [
    { key: "ecg", category: "ASSESSMENT", label: "Acquire 12-lead ECG" },
    { key: "v4r", category: "ASSESSMENT", label: "Right-sided leads (V4R)" },
    { key: "vitals", category: "ASSESSMENT", label: "Reassess vital signs" },
    { key: "o2", category: "BREATHING", label: "Oxygen, non-rebreather", detail: "15 L/min" },
    { key: "asa", category: "MEDICATION", label: "Acetylsalicylic acid", detail: "162 mg chewed" },
    { key: "nitro", category: "MEDICATION", label: "Nitroglycerin", detail: "0.4 mg SL" },
    { key: "fluid", category: "CIRCULATION", label: "IV access and fluid bolus", detail: "0.9% NaCl 250 mL" },
    { key: "bypass", category: "COMMUNICATION", label: "Call STEMI bypass to the PCI centre" },
    { key: "pci", category: "TRANSPORT", label: "Load and transport to the PCI centre" },
    { key: "nearest", category: "TRANSPORT", label: "Load and transport to the nearest ED" },
  ],
  feedback: [
    {
      key: "rv",
      title: "Inferior MI and the right ventricle",
      body: "Up to half of inferior MIs involve the right ventricle, which depends on preload to keep cardiac output up. Nitrates and opioids drop preload and can cause profound hypotension. Right-sided leads (V4R) help confirm it; fluid is the treatment for the low pressure.",
      reference: "ALS PCS — Cardiac Ischemia Medical Directive, contraindications",
    },
    {
      key: "bypass",
      title: "Why the bypass matters",
      body: "A STEMI patient taken straight to a PCI-capable centre avoids an inter-facility transfer. Calling ahead lets the cath lab activate while you're still driving.",
      reference: "ALS PCS — STEMI Hospital Destination Standard",
    },
  ],
  rules: [
    { from: "arrival", action: "ecg", outcome: "CORRECT", points: 20, to: "stemi", within: 600, required: true, rationale: "A 12-lead within ten minutes of contact is the first priority in suspected ACS." },
    { from: null, action: "asa", outcome: "CORRECT", points: 15, required: true, rationale: "Suspected ACS with no allergy or active bleed: give ASA early." },
    { from: null, action: "vitals", outcome: "ACCEPTABLE", points: 2, rationale: "Frequent reassessment is good practice; the pressure here is the number to watch." },
    { from: null, action: "o2", outcome: "SUBOPTIMAL", points: 0, rationale: "SpO₂ is 95%. Routine oxygen isn't indicated in ACS when saturation is normal." },
    { from: "stemi", action: "v4r", outcome: "CORRECT", points: 5, rationale: "Right-sided leads in an inferior STEMI look for RV involvement before any nitrate.", feedback: "rv" },
    { from: "arrival", action: "nitro", outcome: "HARMFUL", points: -15, to: "hypotensive", rationale: "Systolic is 94. Nitroglycerin is contraindicated under 100 mmHg.", feedback: "rv" },
    { from: "stemi", action: "nitro", outcome: "HARMFUL", points: -15, to: "hypotensive", rationale: "Inferior STEMI with a systolic under 100: nitrates can crash an RV-dependent pressure.", feedback: "rv" },
    { from: "hypotensive", action: "nitro", outcome: "CRITICAL", points: -30, to: "arrest", priority: 1, rationale: "A second nitrate in a hypotensive RV infarct removed the preload the heart depended on.", feedback: "rv" },
    { from: "hypotensive", action: "fluid", outcome: "CORRECT", points: 10, to: "stemi", within: 180, rationale: "Fluid restores preload in RV involvement. This was the right recovery.", feedback: "rv" },
    { from: null, action: "fluid", outcome: "ACCEPTABLE", points: 2, rationale: "IV access is reasonable; a bolus with a borderline pressure is defensible." },
    { from: "stemi", action: "bypass", outcome: "CORRECT", points: 20, to: "bypass", required: true, rationale: "Confirmed STEMI: call the bypass so the cath lab activates while you drive.", feedback: "bypass" },
    { from: "arrival", action: "bypass", outcome: "SUBOPTIMAL", points: 0, rationale: "A bypass needs a 12-lead that meets STEMI criteria. Get the ECG first." },
    { from: "bypass", action: "pci", outcome: "CORRECT", points: 20, to: "handover_pci", required: true, rationale: "Accepted bypass: transport directly to the PCI centre." },
    { from: "stemi", action: "pci", outcome: "ACCEPTABLE", points: 10, to: "handover_pci", rationale: "Right destination, but without calling ahead the cath lab wasn't ready.", feedback: "bypass" },
    { from: "arrival", action: "pci", outcome: "SUBOPTIMAL", points: 0, to: "handover_pci", rationale: "Transport without a 12-lead means the receiving team can't prepare." },
    { from: null, action: "nearest", outcome: "SUBOPTIMAL", points: -5, to: "handover_ed", rationale: "A STEMI belongs at a PCI centre; the nearest ED adds a transfer.", feedback: "bypass" },
  ],
};

const anaphylaxis: ScenarioDef = {
  slug: "anaphylaxis-wasp-sting",
  title: "Anaphylaxis after a wasp sting",
  summary: "A 24-year-old woman with stridor and a falling pressure ten minutes after a sting. Epinephrine first, everything else second.",
  dispatch: "Priority 4. 24-year-old female, stung by a wasp at a park, now short of breath. Friend says her lips are swelling.",
  category: "ALLERGIC",
  difficulty: "FOUNDATIONAL",
  timeLimitSec: 600,
  learningGoals: ["Give IM epinephrine without delay", "Support airway and perfusion", "Know when to repeat epinephrine"],
  protocolSource: "Ontario ALS Patient Care Standards — Moderate to Severe Allergic Reaction",
  status: "PUBLISHED",
  states: [
    {
      key: "arrival",
      title: "On scene",
      narrative: "She's sitting forward on a park bench, hives across her chest and neck, lips swollen. Audible stridor. 'My throat is closing.'",
      vitals: { hr: 128, sbp: 84, dbp: 50, rr: 30, spo2: 89, gcs: 15, rhythm: "tachycardia", skin: "Flushed, urticaria" },
      isStart: true,
    },
    {
      key: "partial",
      title: "Partial response",
      narrative: "Five minutes after the first dose the stridor is quieter but still there. She's anxious and still flushed.",
      vitals: { hr: 118, sbp: 92, dbp: 56, rr: 26, spo2: 92, gcs: 15, rhythm: "tachycardia", skin: "Flushed" },
    },
    {
      key: "improving",
      title: "Improving",
      narrative: "Stridor has settled. She can speak in full sentences and the hives are fading.",
      vitals: { hr: 104, sbp: 108, dbp: 66, rr: 20, spo2: 96, gcs: 15, rhythm: "sinus", skin: "Pink" },
    },
    {
      key: "handover",
      title: "Handover in the emergency department",
      narrative: "You hand over with the time of each epinephrine dose and her response.",
      vitals: { hr: 98, sbp: 112, dbp: 70, rr: 18, spo2: 97, gcs: 15, rhythm: "sinus" },
      isTerminal: true,
      debrief: "Early IM epinephrine is the treatment for anaphylaxis. Antihistamines and bronchodilators help symptoms but don't replace it.",
    },
    {
      key: "arrest",
      title: "Cardiac arrest",
      narrative: "Seconds after the IV push her heart rate spikes to 200 and she loses consciousness. Pulseless ventricular tachycardia.",
      vitals: { hr: 0, sbp: 0, dbp: 0, rr: 0, spo2: null, gcs: 3, rhythm: "vfib" },
      isTerminal: true,
      debrief: "Undiluted IV epinephrine at the cardiac-arrest dose in a patient with a pulse can cause lethal arrhythmias. Anaphylaxis gets IM epinephrine.",
    },
  ],
  actions: [
    { key: "epi_im", category: "MEDICATION", label: "Epinephrine IM", detail: "0.5 mg (1 mg/mL), lateral thigh" },
    { key: "epi_iv", category: "MEDICATION", label: "Epinephrine IV push", detail: "1 mg (0.1 mg/mL)" },
    { key: "dph", category: "MEDICATION", label: "Diphenhydramine", detail: "50 mg IM" },
    { key: "salb", category: "MEDICATION", label: "Salbutamol", detail: "5 mg nebulized" },
    { key: "o2", category: "BREATHING", label: "Oxygen, non-rebreather", detail: "15 L/min" },
    { key: "position", category: "CIRCULATION", label: "Position of comfort, legs raised if tolerated" },
    { key: "fluid", category: "CIRCULATION", label: "IV access and fluid bolus", detail: "0.9% NaCl 20 mL/kg" },
    { key: "transport", category: "TRANSPORT", label: "Load and transport to the nearest ED" },
  ],
  feedback: [
    {
      key: "epi",
      title: "Epinephrine is the treatment",
      body: "In anaphylaxis, IM epinephrine reverses airway swelling and vasodilation. Give it as soon as you recognise the reaction, and repeat after five minutes if there's no improvement.",
      reference: "ALS PCS — Moderate to Severe Allergic Reaction Medical Directive",
    },
  ],
  rules: [
    { from: "arrival", action: "epi_im", outcome: "CORRECT", points: 30, to: "partial", within: 120, required: true, rationale: "Stridor and hypotension: IM epinephrine immediately.", feedback: "epi" },
    { from: "partial", action: "epi_im", outcome: "CORRECT", points: 15, to: "improving", required: true, rationale: "No full response after five minutes: repeat the IM dose.", feedback: "epi" },
    { from: "improving", action: "epi_im", outcome: "SUBOPTIMAL", points: 0, rationale: "She's improving. A further dose isn't indicated now." },
    { from: null, action: "epi_iv", outcome: "CRITICAL", points: -40, to: "arrest", priority: 1, rationale: "IV push epinephrine at arrest dosing in a patient with a pulse can cause fatal arrhythmia." },
    { from: "arrival", action: "dph", outcome: "SUBOPTIMAL", points: 0, rationale: "Antihistamines don't treat airway compromise. Epinephrine comes first.", feedback: "epi" },
    { from: null, action: "dph", outcome: "ACCEPTABLE", points: 3, rationale: "A reasonable adjunct once epinephrine is on board." },
    { from: "arrival", action: "salb", outcome: "SUBOPTIMAL", points: 0, rationale: "Stridor is upper airway. Salbutamol doesn't help it; epinephrine does." },
    { from: null, action: "salb", outcome: "ACCEPTABLE", points: 2, rationale: "Can help residual wheeze after epinephrine." },
    { from: null, action: "o2", outcome: "CORRECT", points: 5, rationale: "SpO₂ is low. High-flow oxygen is indicated." },
    { from: null, action: "position", outcome: "CORRECT", points: 5, rationale: "Positioning supports perfusion; let her sit up if lying flat worsens the breathing." },
    { from: null, action: "fluid", outcome: "ACCEPTABLE", points: 5, rationale: "Fluid supports a low pressure after epinephrine." },
    { from: "improving", action: "transport", outcome: "CORRECT", points: 15, to: "handover", required: true, rationale: "Improving after epinephrine: transport for observation; biphasic reactions happen." },
    { from: "partial", action: "transport", outcome: "ACCEPTABLE", points: 8, to: "handover", rationale: "Transporting is right, but a second dose before leaving would have been stronger.", feedback: "epi" },
    { from: "arrival", action: "transport", outcome: "HARMFUL", points: -10, to: "handover", rationale: "Leaving without epinephrine delays the only treatment that reverses the airway swelling.", feedback: "epi" },
  ],
};

const hypoglycemia: ScenarioDef = {
  slug: "hypoglycemia-altered-loc",
  title: "Hypoglycemia with altered level of consciousness",
  summary: "A 67-year-old with type 2 diabetes found confused by his daughter. Check the sugar before anything else.",
  dispatch: "Priority 3. 67-year-old male, confused and sweaty. Daughter says he skipped lunch. Known diabetic.",
  category: "METABOLIC",
  difficulty: "FOUNDATIONAL",
  timeLimitSec: 600,
  learningGoals: ["Check capillary glucose in every altered patient", "Choose the right route for dextrose or glucagon"],
  protocolSource: "Ontario ALS Patient Care Standards — Hypoglycemia",
  status: "IN_REVIEW",
  states: [
    {
      key: "arrival",
      title: "On scene",
      narrative: "He's on the couch, diaphoretic, mumbling and not following commands. Airway is clear.",
      vitals: { hr: 102, sbp: 148, dbp: 86, rr: 18, spo2: 97, gcs: 12, glucose: 2.1, rhythm: "sinus", skin: "Cool, diaphoretic" },
      isStart: true,
    },
    {
      key: "low",
      title: "Glucose 2.1 mmol/L",
      narrative: "The glucometer reads 2.1 mmol/L. He can't safely swallow.",
      vitals: { hr: 102, sbp: 148, dbp: 86, rr: 18, spo2: 97, gcs: 12, glucose: 2.1, rhythm: "sinus" },
    },
    {
      key: "recovered",
      title: "Awake and oriented",
      narrative: "Ten minutes later he's alert and embarrassed, asking for a sandwich.",
      vitals: { hr: 88, sbp: 140, dbp: 82, rr: 16, spo2: 98, gcs: 15, glucose: 6.4, rhythm: "sinus" },
      isTerminal: true,
      debrief: "Every altered patient gets a glucose check. Treat with the route the patient can safely take.",
    },
  ],
  actions: [
    { key: "glucose", category: "ASSESSMENT", label: "Capillary blood glucose" },
    { key: "oral", category: "MEDICATION", label: "Oral glucose gel", detail: "15 g" },
    { key: "d10", category: "MEDICATION", label: "Dextrose 10% IV", detail: "250 mL (25 g)" },
    { key: "glucagon", category: "MEDICATION", label: "Glucagon IM", detail: "1 mg" },
    { key: "o2", category: "BREATHING", label: "Oxygen, non-rebreather", detail: "15 L/min" },
  ],
  feedback: [],
  rules: [
    { from: "arrival", action: "glucose", outcome: "CORRECT", points: 20, to: "low", within: 180, required: true, rationale: "Altered and diabetic: check the sugar first." },
    { from: "arrival", action: "oral", outcome: "HARMFUL", points: -10, rationale: "GCS 12 and not following commands: oral glucose is an aspiration risk." },
    { from: "low", action: "oral", outcome: "HARMFUL", points: -10, rationale: "He can't protect his airway. Oral glucose is contraindicated." },
    { from: "low", action: "d10", outcome: "CORRECT", points: 20, to: "recovered", required: true, rationale: "IV dextrose is the fastest reliable route when the patient can't swallow." },
    { from: "low", action: "glucagon", outcome: "ACCEPTABLE", points: 12, to: "recovered", rationale: "Glucagon IM is right when IV access isn't possible; slower to work." },
    { from: "arrival", action: "d10", outcome: "SUBOPTIMAL", points: 0, rationale: "Confirm the glucose before treating." },
    { from: null, action: "o2", outcome: "SUBOPTIMAL", points: 0, rationale: "SpO₂ is 97%. Oxygen isn't indicated." },
  ],
};

async function upsertScenario(def: ScenarioDef, authorId: string, reviewerId: string) {
  await db.scenario.deleteMany({ where: { slug: def.slug } });
  const scenario = await db.scenario.create({
    data: {
      slug: def.slug,
      title: def.title,
      summary: def.summary,
      dispatch: def.dispatch,
      category: def.category,
      difficulty: def.difficulty,
      timeLimitSec: def.timeLimitSec,
      learningGoals: def.learningGoals,
      protocolSource: def.protocolSource,
      status: def.status,
      authorId,
      reviewerId: def.status === "PUBLISHED" ? reviewerId : null,
      publishedAt: def.status === "PUBLISHED" ? new Date() : null,
    },
  });

  const stateIds = new Map<string, string>();
  for (const [order, s] of def.states.entries()) {
    const row = await db.scenarioState.create({
      data: {
        scenarioId: scenario.id,
        order,
        title: s.title,
        narrative: s.narrative,
        vitals: s.vitals as object,
        isStart: s.isStart ?? false,
        isTerminal: s.isTerminal ?? false,
        debrief: s.debrief ?? null,
      },
    });
    stateIds.set(s.key, row.id);
  }
  const actionIds = new Map<string, string>();
  for (const [order, a] of def.actions.entries()) {
    const row = await db.scenarioAction.create({
      data: { scenarioId: scenario.id, order, category: a.category, label: a.label, detail: a.detail ?? null },
    });
    actionIds.set(a.key, row.id);
  }
  const feedbackIds = new Map<string, string>();
  for (const f of def.feedback) {
    const row = await db.feedbackTemplate.create({
      data: { scenarioId: scenario.id, title: f.title, body: f.body, reference: f.reference ?? null },
    });
    feedbackIds.set(f.key, row.id);
  }
  for (const r of def.rules) {
    await db.scenarioRule.create({
      data: {
        scenarioId: scenario.id,
        fromStateId: r.from ? stateIds.get(r.from)! : null,
        actionId: actionIds.get(r.action)!,
        outcome: r.outcome,
        points: r.points,
        toStateId: r.to ? stateIds.get(r.to)! : null,
        withinSec: r.within ?? null,
        rationale: r.rationale,
        feedbackId: r.feedback ? feedbackIds.get(r.feedback)! : null,
        priority: r.priority ?? 100,
        required: r.required ?? false,
      },
    });
  }
  return scenario;
}

async function main() {
  const passwordHash = await bcrypt.hash(seedPassword, 12);

  const org = await db.organization.upsert({
    where: { slug: "lakeshore-paramedic-services" },
    update: {},
    create: { name: "Lakeshore Paramedic Services", slug: "lakeshore-paramedic-services", type: "EMS_SERVICE", province: "ON", seatLimit: 40 },
  });

  const people: {
    email: string;
    firstName: string;
    lastName: string;
    role: "ADMIN" | "PHYSICIAN" | "INSTRUCTOR" | "PARAMEDIC";
    org?: boolean;
    level?: ParamedicLevel;
    years?: number;
  }[] = [
    { email: "admin@imedica.test", firstName: "Avery", lastName: "Admin", role: "ADMIN" },
    { email: "physician@imedica.test", firstName: "Jordan", lastName: "Hale", role: "PHYSICIAN" },
    { email: "reviewer@imedica.test", firstName: "Priya", lastName: "Raman", role: "PHYSICIAN" },
    { email: "instructor@lakeshore.test", firstName: "Morgan", lastName: "Leclerc", role: "INSTRUCTOR", org: true },
    { email: "medic1@lakeshore.test", firstName: "Sam", lastName: "Okafor", role: "PARAMEDIC", org: true, level: "PCP", years: 3 },
    { email: "medic2@lakeshore.test", firstName: "Riley", lastName: "Tremblay", role: "PARAMEDIC", org: true, level: "ACP", years: 9 },
    { email: "medic3@lakeshore.test", firstName: "Casey", lastName: "Nguyen", role: "PARAMEDIC", org: true, level: "PCP", years: 1 },
    { email: "medic4@lakeshore.test", firstName: "Taylor", lastName: "Singh", role: "PARAMEDIC", org: true, level: "PCP", years: 6 },
    { email: "medic5@lakeshore.test", firstName: "Jamie", lastName: "Côté", role: "PARAMEDIC", org: true, level: "ACP", years: 14 },
    { email: "medic6@lakeshore.test", firstName: "Alex", lastName: "Morrison", role: "PARAMEDIC", org: true, level: "PCP", years: 2 },
  ];

  const users = new Map<string, { id: string; level: ParamedicLevel | null; years: number | null }>();
  for (const p of people) {
    const u = await db.user.upsert({
      where: { email: p.email },
      update: { role: p.role, passwordHash },
      create: {
        email: p.email,
        passwordHash,
        firstName: p.firstName,
        lastName: p.lastName,
        role: p.role,
        organizationId: p.org ? org.id : null,
        level: p.level ?? null,
        yearsExperience: p.years ?? null,
      },
    });
    users.set(p.email, { id: u.id, level: p.level ?? null, years: p.years ?? null });
  }

  const author = users.get("physician@imedica.test")!.id;
  const reviewer = users.get("reviewer@imedica.test")!.id;
  const s1 = await upsertScenario(stemi, author, reviewer);
  const s2 = await upsertScenario(anaphylaxis, author, reviewer);
  await upsertScenario(hypoglycemia, author, reviewer);

  // De-identified history so the instructor view has something to show.
  // Toxicology has only three people, so it stays below the k-anonymity floor.
  await db.analyticsSession.deleteMany({});
  const cohortKey = keyedHash(secret, "cohort", org.id);
  const medics = [...users.entries()].filter(([email]) => email.startsWith("medic"));
  const now = new Date();
  let seed = 11;
  const rand = () => ((seed = (seed * 9301 + 49297) % 233280), seed / 233280);

  const plan: { category: ScenarioCategory; scenarioId: string; who: number; base: number }[] = [
    { category: "CARDIAC", scenarioId: s1.id, who: 6, base: 68 },
    { category: "ALLERGIC", scenarioId: s2.id, who: 6, base: 81 },
    { category: "RESPIRATORY", scenarioId: "seed-respiratory", who: 5, base: 74 },
    { category: "TOXICOLOGY", scenarioId: "seed-toxicology", who: 3, base: 55 },
  ];
  for (const p of plan) {
    for (const [, m] of medics.slice(0, p.who)) {
      for (let week = 0; week < 10; week += 1 + Math.floor(rand() * 3)) {
        const score = Math.max(20, Math.min(100, Math.round(p.base + (10 - week) * 1.2 + (rand() - 0.5) * 22)));
        const harmful = score < 60 && rand() > 0.4 ? 1 : 0;
        const when = new Date(now.getTime() - week * 7 * 864e5);
        await db.analyticsSession.create({
          data: {
            anonymousHash: keyedHash(secret, "user", m.id),
            cohortKey,
            scenarioId: p.scenarioId,
            category: p.category,
            difficulty: "INTERMEDIATE",
            level: m.level,
            experienceBucket: experienceBucket(m.years),
            scorePct: score,
            durationSec: 420 + Math.floor(rand() * 360),
            outcome: "COMPLETED",
            harmfulCount: harmful,
            missedRequired: score < 70 ? 1 : 0,
            completedWeek: weekStart(when),
            decisions: {
              create: [
                { actionCategory: "ASSESSMENT", outcome: "CORRECT", secondsInState: 40 + Math.floor(rand() * 120) },
                { actionCategory: "MEDICATION", outcome: harmful ? "HARMFUL" : score > 75 ? "CORRECT" : "SUBOPTIMAL", secondsInState: 30 + Math.floor(rand() * 90) },
                { actionCategory: "TRANSPORT", outcome: score > 65 ? "CORRECT" : "ACCEPTABLE", secondsInState: 20 + Math.floor(rand() * 60) },
              ],
            },
          },
        });
      }
    }
  }

  console.log(`Seeded ${people.length} users, 3 scenarios and de-identified history for ${org.name}.`);
  console.log(seedPassword === DEV_PASSWORD ? `All test accounts use the password: ${DEV_PASSWORD}` : "All test accounts use SEED_PASSWORD.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
