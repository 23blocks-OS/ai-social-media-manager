import { AIProvider } from './base';
import { OpenAIService } from './openai';
import { AnthropicService } from './anthropic';

export class AIService {
  private provider: AIProvider;

  constructor(providerName?: string) {
    const provider = providerName || process.env.DEFAULT_AI_PROVIDER || 'openai';

    if (provider === 'anthropic') {
      this.provider = new AnthropicService();
    } else {
      this.provider = new OpenAIService();
    }
  }

  async generateContent(prompt: string, options?: any) {
    return this.provider.generateContent(prompt, options);
  }

  async analyzeSentiment(text: string) {
    return this.provider.analyzeSentiment(text);
  }

  async generateHashtags(content: string) {
    return this.provider.generateHashtags(content);
  }

  async improveContent(content: string, instructions?: string) {
    return this.provider.improveContent(content, instructions);
  }

  async generateReply(commentText: string, postContext: string): Promise<string> {
    const prompt = `Generate a friendly, professional reply to this comment on social media.

Post context: ${postContext}
Comment: ${commentText}

Generate only the reply text, without any explanation or preamble.`;

    return this.provider.generateContent(prompt, {
      temperature: 0.8,
      maxTokens: 200
    });
  }
}

export default AIService;
