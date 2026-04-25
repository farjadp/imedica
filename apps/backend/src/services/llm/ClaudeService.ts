import Anthropic from '@anthropic-ai/sdk';

import { buildFeedbackEnhancementPrompt } from './prompts/feedbackEnhancement.js';
import type {
  ClaudeServiceConfig,
  EnhanceFeedbackInput,
  EnhanceFeedbackOutput,
} from './types.js';

export class ClaudeService {
  private readonly client: Anthropic;
  private readonly config: ClaudeServiceConfig;

  constructor(config: ClaudeServiceConfig) {
    this.config = config;
    this.client = new Anthropic({
      apiKey: config.apiKey,
    });
  }

  async enhanceFeedback(input: EnhanceFeedbackInput): Promise<EnhanceFeedbackOutput> {
    const startTime = Date.now();

    try {
      const prompt = buildFeedbackEnhancementPrompt(input);

      const response = await this.client.messages.create(
        {
          model: this.config.model,
          max_tokens: this.config.maxTokens,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
        },
        {
          timeout: this.config.timeoutMs,
        },
      );

      const firstContentBlock = response.content[0];
      const enhancedFeedback =
        firstContentBlock?.type === 'text' ? firstContentBlock.text : '';
      const latencyMs = Date.now() - startTime;
      const tokensUsed = response.usage.input_tokens + response.usage.output_tokens;

      return {
        enhancedFeedback,
        tokensUsed,
        latencyMs,
        model: response.model,
      };
    } catch (error) {
      console.error('ClaudeService.enhanceFeedback error:', error);

      throw new Error(
        `Failed to generate enhanced feedback: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.client.messages.create(
        {
          model: this.config.model,
          max_tokens: 10,
          messages: [{ role: 'user', content: 'test' }],
        },
        {
          timeout: this.config.timeoutMs,
        },
      );
      return true;
    } catch {
      return false;
    }
  }
}

let claudeServiceInstance: ClaudeService | null = null;

export function getClaudeService(): ClaudeService {
  if (!claudeServiceInstance) {
    const config: ClaudeServiceConfig = {
      apiKey: process.env['ANTHROPIC_API_KEY'] ?? '',
      model: process.env['ANTHROPIC_MODEL'] ?? 'claude-sonnet-4-20250514',
      maxTokens: Number.parseInt(process.env['ANTHROPIC_MAX_TOKENS'] ?? '1000', 10),
      timeoutMs: Number.parseInt(process.env['ANTHROPIC_TIMEOUT_MS'] ?? '5000', 10),
    };

    if (!config.apiKey) {
      throw new Error('ANTHROPIC_API_KEY is not set in environment variables');
    }

    claudeServiceInstance = new ClaudeService(config);
  }

  return claudeServiceInstance;
}
