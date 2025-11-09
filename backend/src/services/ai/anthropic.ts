import Anthropic from '@anthropic-ai/sdk';
import { AIProvider, AIGenerationOptions, SentimentAnalysis } from './base';
import logger from '../../utils/logger';

export class AnthropicService implements AIProvider {
  private client: Anthropic;
  private model: string;

  constructor() {
    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
    this.model = process.env.ANTHROPIC_MODEL || 'claude-3-opus-20240229';
  }

  async generateContent(prompt: string, options?: AIGenerationOptions): Promise<string> {
    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: options?.maxTokens || 2000,
        temperature: options?.temperature || 0.7,
        system: options?.systemPrompt || 'You are a helpful social media content creator. Create engaging, professional content.',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      const content = response.content[0];
      return content.type === 'text' ? content.text : '';
    } catch (error) {
      logger.error('Anthropic content generation error:', error);
      throw error;
    }
  }

  async analyzeSentiment(text: string): Promise<SentimentAnalysis> {
    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 200,
        temperature: 0.3,
        system: 'Analyze the sentiment of the following text. Respond with a JSON object containing: sentiment (positive/negative/neutral), score (-1 to 1), and confidence (0 to 1).',
        messages: [
          {
            role: 'user',
            content: text
          }
        ]
      });

      const content = response.content[0];
      const result = content.type === 'text' ? content.text : '{}';
      return JSON.parse(result);
    } catch (error) {
      logger.error('Anthropic sentiment analysis error:', error);
      throw error;
    }
  }

  async generateHashtags(content: string): Promise<string[]> {
    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 200,
        temperature: 0.7,
        system: 'Generate 5-10 relevant hashtags for the given social media content. Return only the hashtags as a JSON array, without the # symbol.',
        messages: [
          {
            role: 'user',
            content: content
          }
        ]
      });

      const result = response.content[0];
      const hashtags = result.type === 'text' ? result.text : '[]';
      return JSON.parse(hashtags);
    } catch (error) {
      logger.error('Anthropic hashtag generation error:', error);
      throw error;
    }
  }

  async improveContent(content: string, instructions?: string): Promise<string> {
    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 1000,
        temperature: 0.7,
        system: 'You are a social media expert. Improve the given content to make it more engaging and effective.',
        messages: [
          {
            role: 'user',
            content: `Original content: ${content}\n\nInstructions: ${instructions || 'Make it more engaging and professional'}`
          }
        ]
      });

      const result = response.content[0];
      return result.type === 'text' ? result.text : content;
    } catch (error) {
      logger.error('Anthropic content improvement error:', error);
      throw error;
    }
  }
}
