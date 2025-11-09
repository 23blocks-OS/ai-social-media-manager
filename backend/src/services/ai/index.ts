import { AIProvider } from './base';
import { OpenAIService } from './openai';
import { AnthropicService } from './anthropic';

interface BrandContext {
  name?: string;
  brandVoice?: string;
  toneAttributes?: any;
  writingStyle?: string;
  values?: string[];
  keywords?: string[];
  hashtags?: string[];
  dosList?: string[];
  dontsList?: string[];
  targetAudience?: string;
}

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

  private buildBrandSystemPrompt(brandContext?: BrandContext): string {
    if (!brandContext) {
      return 'You are a helpful social media content creator. Create engaging, professional content.';
    }

    let prompt = `You are creating social media content for ${brandContext.name || 'a brand'}.

BRAND IDENTITY:`;

    if (brandContext.brandVoice) {
      prompt += `\n- Voice: ${brandContext.brandVoice}`;
    }

    if (brandContext.toneAttributes && Array.isArray(brandContext.toneAttributes)) {
      prompt += `\n- Tone: ${brandContext.toneAttributes.join(', ')}`;
    }

    if (brandContext.writingStyle) {
      prompt += `\n- Writing Style: ${brandContext.writingStyle}`;
    }

    if (brandContext.values && brandContext.values.length > 0) {
      prompt += `\n- Core Values: ${brandContext.values.join(', ')}`;
    }

    if (brandContext.targetAudience) {
      prompt += `\n- Target Audience: ${brandContext.targetAudience}`;
    }

    if (brandContext.keywords && brandContext.keywords.length > 0) {
      prompt += `\n\nIMPORTANT KEYWORDS: ${brandContext.keywords.join(', ')}`;
    }

    if (brandContext.dosList && brandContext.dosList.length > 0) {
      prompt += `\n\nDO:`;
      brandContext.dosList.forEach(item => {
        prompt += `\n- ${item}`;
      });
    }

    if (brandContext.dontsList && brandContext.dontsList.length > 0) {
      prompt += `\n\nDON'T:`;
      brandContext.dontsList.forEach(item => {
        prompt += `\n- ${item}`;
      });
    }

    prompt += `\n\nCreate content that aligns with this brand identity.`;

    return prompt;
  }

  async generateContent(prompt: string, options?: any) {
    const systemPrompt = this.buildBrandSystemPrompt(options?.brandContext);
    return this.provider.generateContent(prompt, {
      ...options,
      systemPrompt: options?.systemPrompt || systemPrompt
    });
  }

  async analyzeSentiment(text: string) {
    return this.provider.analyzeSentiment(text);
  }

  async generateHashtags(content: string, brandContext?: BrandContext) {
    let hashtags = await this.provider.generateHashtags(content);

    // Add brand hashtags if available
    if (brandContext?.hashtags && brandContext.hashtags.length > 0) {
      hashtags = [...new Set([...hashtags, ...brandContext.hashtags])];
    }

    return hashtags;
  }

  async improveContent(content: string, instructions?: string, brandContext?: BrandContext) {
    const systemPrompt = this.buildBrandSystemPrompt(brandContext);
    return this.provider.improveContent(content, instructions);
  }

  async generateReply(commentText: string, postContext: string, brandContext?: BrandContext): Promise<string> {
    const systemPrompt = brandContext
      ? this.buildBrandSystemPrompt(brandContext)
      : 'You are a helpful, professional brand representative.';

    const prompt = `Generate a friendly, professional reply to this comment on social media.

Post context: ${postContext}
Comment: ${commentText}

Generate only the reply text, without any explanation or preamble.`;

    return this.provider.generateContent(prompt, {
      systemPrompt,
      temperature: 0.8,
      maxTokens: 200
    });
  }
}

export default AIService;
