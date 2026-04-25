import { getClaudeService } from './ClaudeService.js';
import { cacheFeedback, getCachedFeedback, getCacheKey } from './feedbackCache.js';
import { validateLLMOutput } from './outputValidator.js';
import type { FeedbackEnhancementInput } from './types.js';

export type FeedbackSource = 'cache' | 'llm' | 'fallback';

export interface GenerateEnhancedFeedbackResult {
  feedback: string;
  source: FeedbackSource;
}

export async function generateEnhancedFeedback(
  input: FeedbackEnhancementInput,
): Promise<GenerateEnhancedFeedbackResult> {
  const cacheKey = getCacheKey(input);
  const cached = getCachedFeedback(cacheKey);

  if (cached) {
    return { feedback: cached, source: 'cache' };
  }

  try {
    const claudeService = getClaudeService();
    const llmResult = await claudeService.enhanceFeedback(input);
    const validation = validateLLMOutput(llmResult.enhancedFeedback, input);

    if (!validation.valid) {
      console.error('LLM validation failed:', validation.errors);
      return { feedback: getTemplateFeedback(input), source: 'fallback' };
    }

    cacheFeedback(cacheKey, llmResult.enhancedFeedback);
    return { feedback: llmResult.enhancedFeedback, source: 'llm' };
  } catch (error) {
    console.error('Enhanced feedback generation failed:', error);
    return { feedback: getTemplateFeedback(input), source: 'fallback' };
  }
}

function getTemplateFeedback(input: FeedbackEnhancementInput): string {
  const action = input.decision.actionValue
    ? `${input.decision.actionType} (${input.decision.actionValue})`
    : input.decision.actionType;

  if (input.decision.isCorrect) {
    return `Your decision to ${action} was correct and aligned with clinical guidelines. ${input.ruleFeedback}`;
  }

  if (input.decision.isCorrect === false) {
    return `Consider reviewing the guidelines for ${input.scenario.category} management before choosing ${action}. ${input.ruleFeedback}`;
  }

  return `Your decision to ${action} has been recorded for review. ${input.ruleFeedback}`;
}
