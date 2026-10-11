// Pure scoring and readiness checks for pre/post assessments.

export const MIN_QUESTIONS = 5;

type Question = { id: string; correctIndex: number };

/** Percentage of questions answered correctly; unanswered counts as wrong. */
export function quizScore(questions: Question[], answers: Record<string, number>): number | null {
  if (!questions.length) return null;
  const correct = questions.filter((q) => answers[q.id] === q.correctIndex).length;
  return Math.round((correct / questions.length) * 100);
}

type DraftQuestion = { options: string[]; correctIndex: number };

/** What still stands between an assessment and review. Empty means ready. */
export function assessmentProblems(input: {
  scenarioIds: string[];
  publishedScenarioIds: Set<string>;
  questions: DraftQuestion[];
}): string[] {
  const problems: string[] = [];
  const { scenarioIds, publishedScenarioIds, questions } = input;

  if (!scenarioIds.length) problems.push("Add at least one published scenario.");
  else if (scenarioIds.some((id) => !publishedScenarioIds.has(id))) {
    problems.push("One of the scenarios is no longer published. Remove it or republish it.");
  }

  if (questions.length < MIN_QUESTIONS) {
    problems.push(`Add at least ${MIN_QUESTIONS} quiz questions (${questions.length} so far).`);
  }
  questions.forEach((q, i) => {
    if (!Number.isInteger(q.correctIndex) || q.correctIndex < 0 || q.correctIndex >= q.options.length) {
      problems.push(`Question ${i + 1} needs a correct answer chosen from its options.`);
    }
  });

  return problems;
}
