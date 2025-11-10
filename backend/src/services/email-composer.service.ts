import { AIModelType } from '@prisma/client';
import { ollamaService } from './ollama.service';
import { openaiService } from './openai.service';
import { anthropicService } from './anthropic.service';
import { prisma } from '../lib/prisma';
import { logger } from '../utils/logger';

export interface PersonalizationContext {
  contact: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    fullName?: string;
    company?: string;
    jobTitle?: string;
    location?: string;
    profileData?: any;
    customFields?: any;
  };
  campaign: {
    id: string;
    name: string;
    subjectTemplate: string;
    campaignGoal?: string;
    personalizationInstructions?: string;
    personalizationLevel: string;
    includeSocialContext: boolean;
    includeInteractionHistory: boolean;
  };
  socialContext?: {
    recentPosts?: string[];
    interests?: string[];
    followerCount?: number;
    platform?: string;
  };
  interactionHistory?: {
    type: string;
    summary: string;
    occurredAt: Date;
  }[];
}

export interface GeneratedEmail {
  subject: string;
  body: string;
  htmlBody?: string;
  generationTimeMs: number;
}

export class EmailComposerService {
  /**
   * Generate a personalized email for a contact in a campaign
   */
  async generatePersonalizedEmail(
    context: PersonalizationContext,
    aiModelType: AIModelType,
    aiModelName: string
  ): Promise<GeneratedEmail> {
    const startTime = Date.now();

    try {
      logger.info(`Generating email for ${context.contact.email} using ${aiModelType}/${aiModelName}`);

      let result: { subject: string; body: string };

      switch (aiModelType) {
        case 'LOCAL_LLM':
          result = await this.generateWithOllama(context, aiModelName);
          break;
        case 'OPENAI':
          result = await this.generateWithOpenAI(context, aiModelName);
          break;
        case 'ANTHROPIC':
          result = await this.generateWithAnthropic(context, aiModelName);
          break;
        default:
          throw new Error(`Unsupported AI model type: ${aiModelType}`);
      }

      const generationTimeMs = Date.now() - startTime;

      // Convert markdown/plain text to HTML
      const htmlBody = this.convertToHTML(result.body);

      return {
        subject: result.subject,
        body: result.body,
        htmlBody,
        generationTimeMs,
      };
    } catch (error) {
      logger.error('Failed to generate personalized email:', error);
      throw error;
    }
  }

  /**
   * Generate email using Ollama (local LLM)
   */
  private async generateWithOllama(
    context: PersonalizationContext,
    modelName: string
  ): Promise<{ subject: string; body: string }> {
    // Build recipient profile
    const recipientProfile = {
      company: context.contact.company,
      jobTitle: context.contact.jobTitle,
      location: context.contact.location,
      bio: context.contact.profileData?.bio,
      ...context.contact.customFields,
    };

    // Build interaction history strings
    const interactionHistory = context.campaign.includeInteractionHistory
      ? context.interactionHistory?.map((i) => `${i.type}: ${i.summary}`)
      : undefined;

    // Build social context
    const socialContext = context.campaign.includeSocialContext ? context.socialContext : undefined;

    // Determine temperature based on personalization level
    const temperature = this.getTemperatureForLevel(context.campaign.personalizationLevel);

    return await ollamaService.generatePersonalizedEmail({
      recipientName: context.contact.fullName || context.contact.firstName || context.contact.email,
      recipientEmail: context.contact.email,
      recipientProfile,
      campaignGoal: context.campaign.campaignGoal || context.campaign.name,
      baseTemplate: context.campaign.subjectTemplate,
      personalizationInstructions: context.campaign.personalizationInstructions,
      interactionHistory,
      socialContext,
      model: modelName,
      temperature,
    });
  }

  /**
   * Generate email using OpenAI
   */
  private async generateWithOpenAI(
    context: PersonalizationContext,
    modelName: string
  ): Promise<{ subject: string; body: string }> {
    const systemPrompt = this.buildSystemPrompt(context);
    const userPrompt = this.buildUserPrompt(context);
    const temperature = this.getTemperatureForLevel(context.campaign.personalizationLevel);

    const response = await openaiService.generateText({
      model: modelName,
      systemPrompt,
      prompt: userPrompt,
      temperature,
      maxTokens: 1500,
    });

    return this.parseEmailResponse(response);
  }

  /**
   * Generate email using Anthropic Claude
   */
  private async generateWithAnthropic(
    context: PersonalizationContext,
    modelName: string
  ): Promise<{ subject: string; body: string }> {
    const systemPrompt = this.buildSystemPrompt(context);
    const userPrompt = this.buildUserPrompt(context);
    const temperature = this.getTemperatureForLevel(context.campaign.personalizationLevel);

    const response = await anthropicService.generateText({
      model: modelName,
      systemPrompt,
      prompt: userPrompt,
      temperature,
      maxTokens: 1500,
    });

    return this.parseEmailResponse(response);
  }

  /**
   * Build system prompt for email generation
   */
  private buildSystemPrompt(context: PersonalizationContext): string {
    const level = context.campaign.personalizationLevel.toUpperCase();

    let prompt = `You are an expert email marketing copywriter. Your task is to create personalized, engaging emails that feel authentic and tailored to each recipient.

Key principles:
- Write in a natural, conversational tone
- Personalize based on the recipient's profile, interests, and interactions
- Make the email feel like it was written specifically for this person
- Keep the email concise and focused on the campaign goal
- Include a clear call-to-action
- Avoid generic marketing speak
`;

    if (level === 'HIGH') {
      prompt += `
- Personalization Level: HIGH
- Reference specific details from their profile and recent activity
- Make meaningful connections between their interests and your message
- Use natural, context-specific personalization throughout`;
    } else if (level === 'MEDIUM') {
      prompt += `
- Personalization Level: MEDIUM
- Include key personalization elements (name, company, role)
- Reference relevant interests or activities when appropriate
- Balance personalization with message clarity`;
    } else {
      prompt += `
- Personalization Level: LOW
- Use basic personalization (name, company)
- Focus on clear, concise messaging
- Keep it professional and to the point`;
    }

    if (context.campaign.personalizationInstructions) {
      prompt += `\n\nAdditional Instructions:\n${context.campaign.personalizationInstructions}`;
    }

    return prompt;
  }

  /**
   * Build user prompt with recipient context
   */
  private buildUserPrompt(context: PersonalizationContext): string {
    const { contact, campaign, socialContext, interactionHistory } = context;

    let prompt = `Create a personalized email for the following campaign:

Campaign: ${campaign.name}
Goal: ${campaign.campaignGoal || 'Engage the recipient'}

Recipient Information:
- Name: ${contact.fullName || contact.firstName || 'there'}
- Email: ${contact.email}`;

    if (contact.company) prompt += `\n- Company: ${contact.company}`;
    if (contact.jobTitle) prompt += `\n- Job Title: ${contact.jobTitle}`;
    if (contact.location) prompt += `\n- Location: ${contact.location}`;

    if (contact.profileData?.bio) {
      prompt += `\n- Bio: ${contact.profileData.bio}`;
    }

    if (socialContext && campaign.includeSocialContext) {
      prompt += `\n\nSocial Media Context:`;
      if (socialContext.platform) prompt += `\n- Platform: ${socialContext.platform}`;
      if (socialContext.followerCount) prompt += `\n- Followers: ${socialContext.followerCount}`;
      if (socialContext.interests?.length) {
        prompt += `\n- Interests: ${socialContext.interests.join(', ')}`;
      }
      if (socialContext.recentPosts?.length) {
        prompt += `\n- Recent activity: ${socialContext.recentPosts.slice(0, 3).join('; ')}`;
      }
    }

    if (interactionHistory?.length && campaign.includeInteractionHistory) {
      prompt += `\n\nPrevious Interactions:`;
      interactionHistory.slice(0, 5).forEach((interaction) => {
        prompt += `\n- ${interaction.type}: ${interaction.summary}`;
      });
    }

    if (contact.customFields) {
      const customFieldEntries = Object.entries(contact.customFields);
      if (customFieldEntries.length > 0) {
        prompt += `\n\nAdditional Information:`;
        customFieldEntries.forEach(([key, value]) => {
          prompt += `\n- ${key}: ${value}`;
        });
      }
    }

    prompt += `\n\nBase Template/Structure:
${campaign.subjectTemplate}

Please generate:
1. A personalized subject line (max 60 characters, engaging and relevant)
2. The email body (concise, personalized, with clear call-to-action)

Format your response EXACTLY as:
SUBJECT: [subject line]

BODY:
[email body]`;

    return prompt;
  }

  /**
   * Parse email response from AI
   */
  private parseEmailResponse(response: string): { subject: string; body: string } {
    const subjectMatch = response.match(/SUBJECT:\s*(.+)/i);
    const bodyMatch = response.match(/BODY:\s*([\s\S]+)/i);

    if (!subjectMatch || !bodyMatch) {
      // Fallback: try to split by double newline
      const parts = response.split('\n\n');
      if (parts.length >= 2) {
        return {
          subject: parts[0].replace(/^SUBJECT:\s*/i, '').trim(),
          body: parts.slice(1).join('\n\n').replace(/^BODY:\s*/i, '').trim(),
        };
      }
      throw new Error('Failed to parse AI response. Expected SUBJECT: and BODY: format.');
    }

    return {
      subject: subjectMatch[1].trim(),
      body: bodyMatch[1].trim(),
    };
  }

  /**
   * Convert plain text to HTML
   */
  private convertToHTML(text: string): string {
    // Simple conversion: paragraphs and line breaks
    const paragraphs = text
      .split('\n\n')
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    const html = paragraphs.map((p) => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('\n');

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    p { margin: 0 0 1em 0; }
    a { color: #0066cc; text-decoration: none; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
${html}
</body>
</html>`;
  }

  /**
   * Get temperature based on personalization level
   */
  private getTemperatureForLevel(level: string): number {
    switch (level.toUpperCase()) {
      case 'HIGH':
        return 0.8;
      case 'MEDIUM':
        return 0.7;
      case 'LOW':
        return 0.6;
      default:
        return 0.7;
    }
  }

  /**
   * Batch generate emails for multiple contacts
   */
  async batchGenerateEmails(
    campaignId: string,
    contactIds: string[],
    aiModelType: AIModelType,
    aiModelName: string,
    onProgress?: (processed: number, total: number) => void
  ): Promise<Map<string, GeneratedEmail>> {
    const results = new Map<string, GeneratedEmail>();
    const total = contactIds.length;

    for (let i = 0; i < contactIds.length; i++) {
      const contactId = contactIds[i];

      try {
        // Fetch contact with relations
        const contact = await prisma.contact.findUnique({
          where: { id: contactId },
          include: {
            tags: true,
            interactions: {
              orderBy: { occurredAt: 'desc' },
              take: 10,
            },
          },
        });

        if (!contact) {
          logger.warn(`Contact ${contactId} not found, skipping`);
          continue;
        }

        // Fetch campaign
        const campaign = await prisma.emailCampaign.findUnique({
          where: { id: campaignId },
        });

        if (!campaign) {
          throw new Error(`Campaign ${campaignId} not found`);
        }

        // Build context
        const context: PersonalizationContext = {
          contact: {
            id: contact.id,
            email: contact.email,
            firstName: contact.firstName || undefined,
            lastName: contact.lastName || undefined,
            fullName: contact.fullName || undefined,
            company: contact.company || undefined,
            jobTitle: contact.jobTitle || undefined,
            location: contact.location || undefined,
            profileData: contact.profileData || undefined,
            customFields: contact.customFields || undefined,
          },
          campaign: {
            id: campaign.id,
            name: campaign.name,
            subjectTemplate: campaign.subjectTemplate,
            campaignGoal: campaign.campaignGoal || undefined,
            personalizationInstructions: campaign.personalizationInstructions || undefined,
            personalizationLevel: campaign.personalizationLevel,
            includeSocialContext: campaign.includeSocialContext,
            includeInteractionHistory: campaign.includeInteractionHistory,
          },
          socialContext: contact.profileData?.socialContext,
          interactionHistory: contact.interactions.map((i) => ({
            type: i.interactionType,
            summary: i.summary || '',
            occurredAt: i.occurredAt,
          })),
        };

        // Generate email
        const generatedEmail = await this.generatePersonalizedEmail(context, aiModelType, aiModelName);

        results.set(contactId, generatedEmail);

        // Report progress
        if (onProgress) {
          onProgress(i + 1, total);
        }

        // Small delay to avoid overwhelming the AI service
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        logger.error(`Failed to generate email for contact ${contactId}:`, error);
        // Continue with next contact
      }
    }

    return results;
  }
}

export const emailComposerService = new EmailComposerService();
