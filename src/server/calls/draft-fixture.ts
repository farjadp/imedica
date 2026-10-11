// A well-formed draft, as Claude returns it, for tests.
import type { Draft } from "./draft-shape";

const vitals = { hr: 110, sbp: 92, dbp: 60, rr: 22, spo2: 94, etco2: null, gcs: 15, glucose: null, temp: null, rhythm: "stemi" as const, skin: "Pale" };

export const sampleDraft: Draft = {
  title: "Chest pain at the curling club",
  summary: "A 61-year-old with crushing chest pain and a soft pressure.",
  dispatch: "Priority 4. 61-year-old male, chest pain, conscious and breathing.",
  category: "CARDIAC",
  difficulty: "INTERMEDIATE",
  timeLimitMinutes: 15,
  learningGoals: ["Get a 12-lead within ten minutes", "Hold nitro when systolic is under 100"],
  states: [
    { key: "arrival", title: "On scene", narrative: "He is pale and sweating.", vitals, isStart: true, isTerminal: false, debrief: null },
    { key: "handover", title: "At the PCI centre", narrative: "Care handed over.", vitals, isStart: false, isTerminal: true, debrief: "Good call." },
  ],
  actions: [
    { key: "ecg", category: "ASSESSMENT", label: "Acquire 12-lead ECG", detail: null },
    { key: "asa", category: "MEDICATION", label: "Acetylsalicylic acid", detail: "162 mg chewed" },
    { key: "nitro", category: "MEDICATION", label: "Nitroglycerin", detail: "0.4 mg SL" },
    { key: "pci", category: "TRANSPORT", label: "Transport to the PCI centre", detail: null },
  ],
  rules: [
    { from: "arrival", action: "ecg", outcome: "CORRECT", points: 20, to: null, withinSeconds: 600, rationale: "A 12-lead finds the STEMI.", required: true },
    { from: null, action: "nitro", outcome: "HARMFUL", points: -15, to: null, withinSeconds: null, rationale: "Systolic under 100.", required: false },
    { from: "arrival", action: "pci", outcome: "CORRECT", points: 20, to: "handover", withinSeconds: null, rationale: "STEMI bypass.", required: true },
    { from: "arrival", action: "ghost", outcome: "CORRECT", points: 5, to: null, withinSeconds: null, rationale: "Not on the menu.", required: false },
  ],
  reviewerNotes: ["Vitals weren't in the transcript; chosen to fit the story."],
};
