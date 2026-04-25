import type { EnhanceFeedbackInput } from '../types.js';

export function buildFeedbackEnhancementPrompt(input: EnhanceFeedbackInput): string {
  const { decision, scenario, state, ruleFeedback } = input;

  const vitalsStr = `HR ${state.vitals.HR}, BP ${state.vitals.BP}, SpO2 ${
    state.vitals.SpO2 ?? 'N/A'
  }%, RR ${state.vitals.RR}, Temp ${state.vitals.Temp ?? 'N/A'} C, ECG ${
    state.vitals.ECG ?? 'N/A'
  }`;

  const actionStr = decision.actionValue
    ? `${decision.actionType} (${decision.actionValue})`
    : decision.actionType;

  const correctnessLabel =
    decision.isCorrect === null ? 'neutral' : decision.isCorrect ? 'correct' : 'incorrect';

  return `You are an expert Emergency Medicine physician providing educational feedback to a paramedic who just completed a training scenario.

**Scenario:** ${scenario.title}
**Category:** ${scenario.category}
**Patient State:** ${state.name}
**Vitals:** ${vitalsStr}

**Paramedic Action:** ${actionStr}
**Timestamp:** ${decision.timestamp} (${decision.timeFromStart}s from start)

**Evaluation:** ${correctnessLabel}
**Points Awarded:** ${decision.pointsAwarded > 0 ? '+' : ''}${decision.pointsAwarded}
**Immediate Feedback:** "${ruleFeedback}"

---

Your task is to provide a detailed, educational explanation (150-200 words) that:

1. **Explains WHY** this decision was ${correctnessLabel}
2. **Discusses the clinical reasoning** behind the action
3. **References relevant guidelines** (AHA, ILCOR, Canadian resuscitation protocols)
4. **Explains the physiological impact** on the patient
5. **Provides constructive guidance** for improvement (if applicable)

**Guidelines:**
- Be encouraging but honest
- Use precise medical terminology with brief explanations for paramedics
- Include specific data when available
- Keep it concise and actionable (150-200 words)
- DO NOT contradict the immediate feedback evaluation
- DO NOT recommend medication dosages outside standard protocols
- DO NOT make assumptions about information not provided in the scenario
- Focus on education, not just praise or criticism

Write the enhanced explanation now:`;
}
