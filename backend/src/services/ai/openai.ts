import OpenAI from 'openai';
import { AIProvider, AIGenerationOptions, SentimentAnalysis } from './base';
import logger from '../../utils/logger';

export class OpenAIService implements AIProvider {
  private client: OpenAI;
  private model: string;

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.model = process.env.OPENAI_MODEL || 'gpt-4-turbo-preview';
  }

  async generateContent(prompt: string, options?: AIGenerationOptions): Promise<string> {
    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: options?.systemPrompt || 'You are a helpful social media content creator. Create engaging, professional content.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: options?.temperature || 0.7,
        max_tokens: options?.maxTokens || 2000,
      });

      return response.choices[0]?.message?.content || '';
    } catch (error) {
      logger.error('OpenAI content generation error:', error);
      throw error;
    }
  }

  async analyzeSentiment(text: string): Promise<SentimentAnalysis> {
    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'Analyze the sentiment of the following text. Respond with a JSON object containing: sentiment (positive/negative/neutral), score (-1 to 1), and confidence (0 to 1).'
          },
          {
            role: 'user',
            content: text
          }
        ],
        temperature: 0.3,
        max_tokens: 100,
      });

      const content = response.choices[0]?.message?.content || '{}';
      return JSON.parse(content);
    } catch (error) {
      logger.error('OpenAI sentiment analysis error:', error);
      throw error;
    }
  }

  async generateHashtags(content: string): Promise<string[]> {
    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'Generate 5-10 relevant hashtags for the given social media content. Return only the hashtags as a JSON array, without the # symbol.'
          },
          {
            role: 'user',
            content: content
          }
        ],
        temperature: 0.7,
        max_tokens: 200,
      });

      const content_str = response.choices[0]?.message?.content || '[]';
      return JSON.parse(content_str);
    } catch (error) {
      logger.error('OpenAI hashtag generation error:', error);
      throw error;
    }
  }

  async improveContent(content: string, instructions?: string): Promise<string> {
    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are a social media expert. Improve the given content to make it more engaging and effective.'
          },
          {
            role: 'user',
            content: `Original content: ${content}\n\nInstructions: ${instructions || 'Make it more engaging and professional'}`
          }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      });

      return response.choices[0]?.message?.content || content;
    } catch (error) {
      logger.error('OpenAI content improvement error:', error);
      throw error;
    }
  }
}
