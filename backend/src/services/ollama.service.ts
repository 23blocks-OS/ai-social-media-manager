import axios from 'axios';
import { logger } from '../utils/logger';

export interface OllamaMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OllamaGenerateOptions {
  model: string;
  messages: OllamaMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

export interface OllamaResponse {
  model: string;
  created_at: string;
  message: {
    role: string;
    content: string;
  };
  done: boolean;
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  eval_count?: number;
  eval_duration?: number;
}

export class OllamaService {
  private baseUrl: string;
  private timeout: number;
  private isAvailable: boolean = false;

  constructor() {
    this.baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
    this.timeout = parseInt(process.env.OLLAMA_TIMEOUT || '60000', 10);
    this.checkAvailability();
  }

  /**
   * Check if Ollama is available
   */
  private async checkAvailability(): Promise<void> {
    try {
      const response = await axios.get(`${this.baseUrl}/api/tags`, {
        timeout: 5000,
      });
      this.isAvailable = response.status === 200;
      logger.info('Ollama service is available');
    } catch (error) {
      this.isAvailable = false;
      logger.warn('Ollama service is not available. Local LLM features will be disabled.');
    }
  }

  /**
   * Get available models from Ollama
   */
  async getAvailableModels(): Promise<string[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/api/tags`, {
        timeout: 5000,
      });
      return response.data.models?.map((m: any) => m.name) || [];
    } catch (error) {
      logger.error('Failed to fetch Ollama models:', error);
      return [];
    }
  }

  /**
   * Check if a specific model is available
   */
  async isModelAvailable(modelName: string): Promise<boolean> {
    const models = await this.getAvailableModels();
    return models.includes(modelName);
  }

  /**
   * Generate text using Ollama
   */
  async generate(options: OllamaGenerateOptions): Promise<string> {
    if (!this.isAvailable) {
      await this.checkAvailability();
      if (!this.isAvailable) {
        throw new Error('Ollama service is not available. Please ensure Ollama is running.');
      }
    }

    try {
      const response = await axios.post<OllamaResponse>(
        `${this.baseUrl}/api/chat`,
        {
          model: options.model,
          messages: options.messages,
          stream: options.stream ?? false,
          options: {
            temperature: options.temperature ?? 0.7,
            num_predict: options.max_tokens ?? 2000,
          },
        },
        {
          timeout: this.timeout,
        }
      );

      return response.data.message.content;
    } catch (error: any) {
      logger.error('Ollama generation failed:', error);

      if (error.code === 'ECONNREFUSED') {
        throw new Error('Cannot connect to Ollama. Please ensure Ollama is running on ' + this.baseUrl);
      }

      if (error.response?.status === 404) {
        throw new Error(`Model "${options.model}" not found. Please pull the model first: ollama pull ${options.model}`);
      }

      throw new Error(`Ollama generation failed: ${error.message}`);
    }
  }

  /**
   * Generate a personalized email using Ollama
   */
  async generatePersonalizedEmail(params: {
    recipientName: string;
    recipientEmail: string;
    recipientProfile?: any;
    campaignGoal: string;
    baseTemplate: string;
    personalizationInstructions?: string;
    interactionHistory?: string[];
    socialContext?: any;
    model?: string;
    temperature?: number;
  }): Promise<{ subject: string; body: string }> {
    const {
      recipientName,
      recipientEmail,
      recipientProfile,
      campaignGoal,
      baseTemplate,
      personalizationInstructions,
      interactionHistory,
      socialContext,
      model = 'llama3',
      temperature = 0.7,
    } = params;

    // Build context about the recipient
    let recipientContext = `Recipient: ${recipientName || 'there'} (${recipientEmail})`;

    if (recipientProfile) {
      if (recipientProfile.company) recipientContext += `\nCompany: ${recipientProfile.company}`;
      if (recipientProfile.jobTitle) recipientContext += `\nJob Title: ${recipientProfile.jobTitle}`;
      if (recipientProfile.location) recipientContext += `\nLocation: ${recipientProfile.location}`;
      if (recipientProfile.bio) recipientContext += `\nBio: ${recipientProfile.bio}`;
    }

    if (socialContext) {
      recipientContext += '\n\nSocial Media Activity:';
      if (socialContext.recentPosts) {
        recipientContext += `\n- Recent posts: ${socialContext.recentPosts.slice(0, 3).join(', ')}`;
      }
      if (socialContext.interests) {
        recipientContext += `\n- Interests: ${socialContext.interests.join(', ')}`;
      }
    }

    if (interactionHistory && interactionHistory.length > 0) {
      recipientContext += `\n\nPrevious Interactions:\n${interactionHistory.slice(0, 5).join('\n')}`;
    }

    const systemPrompt = `You are an expert email marketing copywriter. Your task is to create personalized, engaging emails that feel authentic and tailored to each recipient.

Key principles:
- Write in a natural, conversational tone
- Personalize based on the recipient's profile, interests, and interactions
- Make the email feel like it was written specifically for this person
- Keep the email concise and focused on the campaign goal
- Include a clear call-to-action
- Avoid generic marketing speak

${personalizationInstructions || ''}`;

    const userPrompt = `Create a personalized email for the following campaign:

Campaign Goal: ${campaignGoal}

${recipientContext}

Base Template/Structure:
${baseTemplate}

Please generate:
1. A personalized subject line (max 60 characters)
2. The email body with appropriate personalization

Format your response as:
SUBJECT: [subject line]

BODY:
[email body]`;

    try {
      const response = await this.generate({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature,
        max_tokens: 1500,
      });

      // Parse the response
      const subjectMatch = response.match(/SUBJECT:\s*(.+)/i);
      const bodyMatch = response.match(/BODY:\s*([\s\S]+)/i);

      if (!subjectMatch || !bodyMatch) {
        throw new Error('Failed to parse Ollama response');
      }

      return {
        subject: subjectMatch[1].trim(),
        body: bodyMatch[1].trim(),
      };
    } catch (error) {
      logger.error('Failed to generate personalized email with Ollama:', error);
      throw error;
    }
  }

  /**
   * Pull a model from Ollama
   */
  async pullModel(modelName: string): Promise<void> {
    try {
      logger.info(`Pulling Ollama model: ${modelName}`);
      await axios.post(
        `${this.baseUrl}/api/pull`,
        { name: modelName },
        { timeout: 300000 } // 5 minutes timeout for pulling
      );
      logger.info(`Successfully pulled Ollama model: ${modelName}`);
    } catch (error) {
      logger.error(`Failed to pull Ollama model ${modelName}:`, error);
      throw error;
    }
  }

  /**
   * Test the connection to Ollama
   */
  async testConnection(): Promise<boolean> {
    await this.checkAvailability();
    return this.isAvailable;
  }

  /**
   * Get service status
   */
  getStatus(): {
    available: boolean;
    baseUrl: string;
    recommendedModels: string[];
  } {
    return {
      available: this.isAvailable,
      baseUrl: this.baseUrl,
      recommendedModels: [
        'llama3',
        'llama3:8b',
        'llama3:70b',
        'mistral',
        'mixtral',
        'neural-chat',
      ],
    };
  }
}

export const ollamaService = new OllamaService();
