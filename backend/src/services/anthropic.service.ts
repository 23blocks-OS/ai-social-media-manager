import Anthropic from '@anthropic-ai/sdk';
import { logger } from '../utils/logger';

export interface AnthropicGenerateOptions {
  model: string;
  systemPrompt: string;
  prompt: string;
  temperature?: number;
  maxTokens?: number;
}

class AnthropicService {
  private client: Anthropic | null = null;

  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (apiKey) {
      this.client = new Anthropic({ apiKey });
      logger.info('Anthropic service initialized');
    } else {
      logger.warn('Anthropic API key not found. Claude features will be disabled.');
    }
  }

  async generateText(options: AnthropicGenerateOptions): Promise<string> {
    if (!this.client) {
      throw new Error('Anthropic is not configured. Please set ANTHROPIC_API_KEY environment variable.');
    }

    try {
      const response = await this.client.messages.create({
        model: options.model || 'claude-3-5-sonnet-20241022',
        max_tokens: options.maxTokens ?? 2000,
        temperature: options.temperature ?? 0.7,
        system: options.systemPrompt,
        messages: [{ role: 'user', content: options.prompt }],
      });

      const content = response.content[0];
      if (content.type === 'text') {
        return content.text;
      }

      return '';
    } catch (error: any) {
      logger.error('Anthropic generation failed:', error);
      throw new Error(`Anthropic generation failed: ${error.message}`);
    }
  }

  isAvailable(): boolean {
    return this.client !== null;
  }
}

export const anthropicService = new AnthropicService();
