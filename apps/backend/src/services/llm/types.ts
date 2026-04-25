export interface EnhanceFeedbackInput {
  decision: {
    actionType: string;
    actionValue?: string;
    timestamp: string;
    timeFromStart: number;
    isCorrect: boolean | null;
    pointsAwarded: number;
    feedbackKey: string | null;
  };
  scenario: {
    title: string;
    category: string;
  };
  state: {
    name: string;
    vitals: {
      HR: number;
      BP: string;
      SpO2: number | null;
      RR: number;
      Temp: number | null;
      ECG: string | null;
    };
  };
  ruleFeedback: string;
}

export type FeedbackEnhancementInput = EnhanceFeedbackInput;

export interface EnhanceFeedbackOutput {
  enhancedFeedback: string;
  tokensUsed: number;
  latencyMs: number;
  model: string;
}

export interface ClaudeServiceConfig {
  apiKey: string;
  model: string;
  maxTokens: number;
  timeoutMs: number;
}
