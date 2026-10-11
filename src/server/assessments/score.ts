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

type Point = { who: string; value: number };

/**
 * Before/after change over the people who have both. Each person counts once
 * (their last value per phase); means are compared before rounding.
 */
export function pairedChange(pre: Point[], post: Point[]) {
  const before = new Map(pre.map((p) => [p.who, p.value]));
  const after = new Map(post.map((p) => [p.who, p.value]));
  const both = [...before.keys()].filter((who) => after.has(who));
  if (!both.length) return { people: 0, preAvg: null, postAvg: null, delta: null, relativePct: null };

  const mean = (m: Map<string, number>) => both.reduce((sum, who) => sum + m.get(who)!, 0) / both.length;
  const preMean = mean(before);
  const postMean = mean(after);
  return {
    people: both.length,
    preAvg: Math.round(preMean),
    postAvg: Math.round(postMean),
    delta: Math.round(postMean - preMean),
    relativePct: preMean > 0 ? Math.round(((postMean - preMean) / preMean) * 100) : null,
  };
}
