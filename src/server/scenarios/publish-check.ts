// Pure checks run before a scenario can go to review or be published.

type S = { id: string; title: string; isStart: boolean; isTerminal: boolean };
type R = { fromStateId: string | null; toStateId: string | null; required: boolean; points: number; outcome: string };

export function publishProblems(input: { states: S[]; actions: unknown[]; rules: R[] }): string[] {
  const problems: string[] = [];
  const { states, actions, rules } = input;

  const starts = states.filter((s) => s.isStart);
  if (starts.length !== 1) problems.push("Mark exactly one state as the starting state.");
  if (!states.some((s) => s.isTerminal)) problems.push("Add at least one end state.");
  if (actions.length < 3) problems.push("Add at least three actions to the menu.");
  if (!rules.some((r) => r.required && r.points > 0)) {
    problems.push("Mark at least one positive rule as required, so the scenario has a maximum score.");
  }

  // Every end state must be reachable from the start.
  if (starts.length === 1) {
    const reachable = new Set([starts[0].id]);
    let grew = true;
    while (grew) {
      grew = false;
      for (const r of rules) {
        if (!r.toStateId || reachable.has(r.toStateId)) continue;
        if (r.fromStateId === null || reachable.has(r.fromStateId)) {
          reachable.add(r.toStateId);
          grew = true;
        }
      }
    }
    for (const s of states) {
      if (!reachable.has(s.id)) problems.push(`No rule leads to "${s.title}".`);
    }
  }

  return problems;
}
