// Turns EMSDialog records (Hugging Face: Xueren/EMSDialogue-Datasets) into
// call rows. Pure, so it's testable without the network or a database.

export const EMSDIALOG = {
  page: "https://huggingface.co/datasets/Xueren/EMSDialogue-Datasets",
  // 1,000 synthetic calls, one JSON file each.
  syntheticTree: "https://huggingface.co/api/datasets/Xueren/EMSDialogue-Datasets/tree/main/EMSDialog-synthetic",
  syntheticFile: (name: string) =>
    `https://huggingface.co/datasets/Xueren/EMSDialogue-Datasets/resolve/main/EMSDialog-synthetic/${encodeURIComponent(name)}`,
  // The de-identified real calls, served as rows (at most 100 per request).
  realRows: (split: "train" | "test", offset: number) =>
    `https://datasets-server.huggingface.co/rows?dataset=Xueren/EMSDialogue-Datasets&config=default&split=${split}&offset=${offset}&length=100`,
  licence: "CC BY-NC 4.0",
} as const;

export type Turn = { role: string; text: string };
export type CallRow = { source: string; sourceKey: string; protocol: string; turns: Turn[]; turnCount: number };

const MAX_TURNS = 400;

function clean(value: unknown, max: number): string {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, max) : "";
}

/** "medical - chest pain - cardiac suspected (protocol 2 - 1)" → "Medical - chest pain - cardiac suspected" */
export function protocolName(value: unknown): string {
  const first = Array.isArray(value) ? value.find((v) => typeof v === "string") : value;
  const name = clean(first, 200).replace(/\s*\(protocol[^)]*\)\s*$/i, "");
  return name ? name.charAt(0).toUpperCase() + name.slice(1) : "Unknown";
}

/** One call, or null when it has no usable dialogue. */
export function toCallRow(record: unknown, source: string, sourceKey: string): CallRow | null {
  if (!record || typeof record !== "object") return null;
  const r = record as { protocol?: unknown; dialogue?: unknown };
  if (!Array.isArray(r.dialogue)) return null;
  const turns: Turn[] = [];
  for (const t of r.dialogue.slice(0, MAX_TURNS)) {
    if (!t || typeof t !== "object") continue;
    const { role, utterance } = t as { role?: unknown; utterance?: unknown };
    const text = clean(utterance, 1000);
    if (text) turns.push({ role: clean(role, 60) || "Unknown", text });
  }
  if (turns.length < 4) return null;
  return { source, sourceKey: sourceKey.slice(0, 120), protocol: protocolName(r.protocol), turns, turnCount: turns.length };
}

/** The synthetic call files listed in the dataset's tree. */
export function syntheticFiles(tree: unknown): string[] {
  if (!Array.isArray(tree)) throw new Error("EMSDialog: expected a file list.");
  return tree
    .filter((f): f is { type: string; path: string } => !!f && typeof f === "object" && "path" in f && "type" in f)
    .filter((f) => f.type === "file" && /\/\d{6}\.json$/.test(f.path))
    .map((f) => f.path.split("/").pop()!);
}

/** The transcript as the model reads it: one line per turn. */
export function transcript(turns: Turn[]): string {
  return turns.map((t) => `${t.role}: ${t.text}`).join("\n");
}
