export type AQuestion = {
  id: string;
  order: number;
  stem: string;
  options: string[];
  correctIndex: number;
  rationale: string;
  reference: string | null;
};

export type ScenarioOption = { id: string; title: string; category: string; difficulty: string };

export type EditorAssessment = {
  id: string;
  title: string;
  summary: string;
  status: "DRAFT" | "IN_REVIEW" | "PUBLISHED" | "ARCHIVED";
  scenarioIds: string[];
  authorId: string;
  questions: AQuestion[];
  problems: string[];
};
