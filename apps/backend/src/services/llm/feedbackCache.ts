import * as crypto from 'node:crypto';

import type { FeedbackEnhancementInput } from './types.js';

const cache = new Map<string, string>();

export function getCacheKey(input: FeedbackEnhancementInput): string {
  return crypto
    .createHash('sha256')
    .update(
      JSON.stringify({
        action: {
          type: input.decision.actionType,
          value: input.decision.actionValue ?? null,
        },
        state: input.state.name,
        timeRange: Math.floor(input.decision.timeFromStart / 30),
        vitals: input.state.vitals,
      }),
    )
    .digest('hex');
}

export function getCachedFeedback(key: string): string | null {
  return cache.get(key) ?? null;
}

export function cacheFeedback(key: string, feedback: string): void {
  cache.set(key, feedback);
}
