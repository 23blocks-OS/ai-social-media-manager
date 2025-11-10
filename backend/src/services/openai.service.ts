import OpenAI from 'openai';
import { logger } from '../utils/logger';

export interface OpenAIGenerateOptions {
  model: string;
  systemPrompt: string;
  prompt: string;
  temperature?: number;
  maxTokens?: number;
}

class OpenAIService {
  private client: OpenAI | null = null;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      this.client = new OpenAI({ apiKey });
      logger.info('OpenAI service initialized');
    } else {
      logger.warn('OpenAI API key not found. OpenAI features will be disabled.');
    }
  }

  async generateText(options: OpenAIGenerateOptions): Promise<string> {
    if (!this.client) {
      throw new Error('OpenAI is not configured. Please set OPENAI_API_KEY environment variable.');
    }

    try {
      const response = await this.client.chat.completions.create({
        model: options.model || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: options.systemPrompt },
          { role: 'user', content: options.prompt },
        ],
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 2000,
      });

      return response.choices[0]?.message?.content || '';
    } catch (error: any) {
      logger.error('OpenAI generation failed:', error);
      throw new Error(`OpenAI generation failed: ${error.message}`);
    }
  }

  isAvailable(): boolean {
    return this.client !== null;
  }
}

export const openaiService = new OpenAIService();
