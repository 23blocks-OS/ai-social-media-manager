import axios from 'axios';
import { logger } from '../utils/logger';
import { prisma } from '../lib/prisma';

export interface WhatsAppSendOptions {
  to: string; // Phone number in E.164 format
  templateName?: string;
  templateLanguage?: string;
  templateVariables?: Record<string, string>;
  message?: string;
  mediaUrl?: string;
}

export interface WhatsAppTemplateComponent {
  type: 'HEADER' | 'BODY' | 'FOOTER' | 'BUTTONS';
  format?: 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT';
  text?: string;
  buttons?: Array<{
    type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER';
    text: string;
    url?: string;
    phone_number?: string;
  }>;
}

export interface WhatsAppTemplate {
  name: string;
  language: string;
  category: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION';
  components: WhatsAppTemplateComponent[];
}

export class WhatsAppService {
  private provider: 'META_CLOUD_API' | 'TWILIO' | null = null;
  private config: any = null;

  constructor() {
    this.initializeProvider();
  }

  /**
   * Initialize WhatsApp provider based on environment
   */
  private initializeProvider() {
    // Check for Meta Cloud API configuration
    if (process.env.WHATSAPP_PHONE_NUMBER_ID && process.env.WHATSAPP_ACCESS_TOKEN) {
      this.provider = 'META_CLOUD_API';
      this.config = {
        phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
        businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID,
        accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
        apiVersion: process.env.WHATSAPP_API_VERSION || 'v18.0',
      };
      logger.info('WhatsApp service initialized with Meta Cloud API');
    }
    // Check for Twilio configuration
    else if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      this.provider = 'TWILIO';
      this.config = {
        accountSid: process.env.TWILIO_ACCOUNT_SID,
        authToken: process.env.TWILIO_AUTH_TOKEN,
        phoneNumber: process.env.TWILIO_WHATSAPP_NUMBER,
      };
      logger.info('WhatsApp service initialized with Twilio');
    } else {
      logger.warn('WhatsApp service not configured. Set Meta Cloud API or Twilio credentials.');
    }
  }

  /**
   * Send a WhatsApp message
   */
  async sendMessage(options: WhatsAppSendOptions, userId: string): Promise<string> {
    if (!this.provider) {
      throw new Error('WhatsApp service is not configured');
    }

    try {
      if (this.provider === 'META_CLOUD_API') {
        return await this.sendWithMetaCloudAPI(options);
      } else if (this.provider === 'TWILIO') {
        return await this.sendWithTwilio(options);
      }

      throw new Error('Invalid WhatsApp provider');
    } catch (error: any) {
      logger.error('Failed to send WhatsApp message:', error);
      throw error;
    }
  }

  /**
   * Send message using Meta Cloud API
   */
  private async sendWithMetaCloudAPI(options: WhatsAppSendOptions): Promise<string> {
    const { phoneNumberId, accessToken, apiVersion } = this.config;

    const url = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`;

    let payload: any;

    if (options.templateName) {
      // Send template message
      const components = [];

      if (options.templateVariables) {
        // Build components with variables
        const bodyParameters = Object.values(options.templateVariables).map((value) => ({
          type: 'text',
          text: value,
        }));

        if (bodyParameters.length > 0) {
          components.push({
            type: 'body',
            parameters: bodyParameters,
          });
        }
      }

      payload = {
        messaging_product: 'whatsapp',
        to: options.to,
        type: 'template',
        template: {
          name: options.templateName,
          language: {
            code: options.templateLanguage || 'en',
          },
          components: components.length > 0 ? components : undefined,
        },
      };
    } else if (options.message) {
      // Send text message (only within 24-hour window)
      payload = {
        messaging_product: 'whatsapp',
        to: options.to,
        type: 'text',
        text: {
          body: options.message,
        },
      };
    } else if (options.mediaUrl) {
      // Send media message
      const mediaType = this.getMediaType(options.mediaUrl);
      payload = {
        messaging_product: 'whatsapp',
        to: options.to,
        type: mediaType,
        [mediaType]: {
          link: options.mediaUrl,
        },
      };
    } else {
      throw new Error('Either templateName, message, or mediaUrl must be provided');
    }

    const response = await axios.post(url, payload, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    const messageId = response.data.messages?.[0]?.id;
    if (!messageId) {
      throw new Error('No message ID returned from WhatsApp');
    }

    logger.info(`WhatsApp message sent successfully: ${messageId}`);
    return messageId;
  }

  /**
   * Send message using Twilio
   */
  private async sendWithTwilio(options: WhatsAppSendOptions): Promise<string> {
    const { accountSid, authToken, phoneNumber } = this.config;

    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

    const params = new URLSearchParams();
    params.append('From', `whatsapp:${phoneNumber}`);
    params.append('To', `whatsapp:${options.to}`);

    if (options.message) {
      params.append('Body', options.message);
    } else if (options.templateName && options.message) {
      // Twilio uses Content SID for templates
      params.append('ContentSid', options.templateName);
      if (options.templateVariables) {
        params.append('ContentVariables', JSON.stringify(options.templateVariables));
      }
    } else {
      throw new Error('Message text is required for Twilio');
    }

    if (options.mediaUrl) {
      params.append('MediaUrl', options.mediaUrl);
    }

    const response = await axios.post(url, params, {
      auth: {
        username: accountSid,
        password: authToken,
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const messageId = response.data.sid;
    logger.info(`WhatsApp message sent via Twilio: ${messageId}`);
    return messageId;
  }

  /**
   * Create a WhatsApp message template (Meta Cloud API only)
   */
  async createTemplate(userId: string, template: WhatsAppTemplate): Promise<any> {
    if (this.provider !== 'META_CLOUD_API') {
      throw new Error('Template creation is only supported with Meta Cloud API');
    }

    const { businessAccountId, accessToken, apiVersion } = this.config;

    const url = `https://graph.facebook.com/${apiVersion}/${businessAccountId}/message_templates`;

    const payload = {
      name: template.name,
      language: template.language,
      category: template.category,
      components: template.components,
    };

    try {
      const response = await axios.post(url, payload, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      logger.info(`WhatsApp template created: ${template.name}`);
      return response.data;
    } catch (error: any) {
      logger.error('Failed to create WhatsApp template:', error.response?.data || error);
      throw new Error(
        `Template creation failed: ${error.response?.data?.error?.message || error.message}`
      );
    }
  }

  /**
   * Get template status (Meta Cloud API only)
   */
  async getTemplateStatus(templateName: string): Promise<string> {
    if (this.provider !== 'META_CLOUD_API') {
      throw new Error('Template status check is only supported with Meta Cloud API');
    }

    const { businessAccountId, accessToken, apiVersion } = this.config;

    const url = `https://graph.facebook.com/${apiVersion}/${businessAccountId}/message_templates`;

    try {
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        params: {
          name: templateName,
        },
      });

      const template = response.data.data?.[0];
      return template?.status || 'UNKNOWN';
    } catch (error) {
      logger.error('Failed to get template status:', error);
      return 'UNKNOWN';
    }
  }

  /**
   * Handle WhatsApp webhook
   */
  async handleWebhook(body: any): Promise<void> {
    try {
      if (this.provider === 'META_CLOUD_API') {
        await this.handleMetaCloudAPIWebhook(body);
      } else if (this.provider === 'TWILIO') {
        await this.handleTwilioWebhook(body);
      }
    } catch (error) {
      logger.error('Failed to handle WhatsApp webhook:', error);
    }
  }

  /**
   * Handle Meta Cloud API webhook
   */
  private async handleMetaCloudAPIWebhook(body: any): Promise<void> {
    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;

    if (!value) return;

    // Handle status updates
    if (value.statuses) {
      for (const status of value.statuses) {
        await this.updateMessageStatus(
          status.id,
          status.status,
          status.timestamp,
          status.errors?.[0]
        );
      }
    }

    // Handle incoming messages (for replies/opt-ins)
    if (value.messages) {
      for (const message of value.messages) {
        await this.handleIncomingMessage(message, value.contacts?.[0]);
      }
    }
  }

  /**
   * Handle Twilio webhook
   */
  private async handleTwilioWebhook(body: any): Promise<void> {
    const messageId = body.MessageSid;
    const status = body.MessageStatus;
    const timestamp = body.Timestamp;

    if (messageId && status) {
      await this.updateMessageStatus(messageId, this.mapTwilioStatus(status), timestamp);
    }
  }

  /**
   * Update message status in database
   */
  private async updateMessageStatus(
    whatsappMessageId: string,
    status: string,
    timestamp?: string,
    error?: any
  ): Promise<void> {
    try {
      const updates: any = {
        status: this.mapStatusToEnum(status),
      };

      if (status === 'sent') {
        updates.sentAt = timestamp ? new Date(parseInt(timestamp) * 1000) : new Date();
      } else if (status === 'delivered') {
        updates.deliveredAt = timestamp ? new Date(parseInt(timestamp) * 1000) : new Date();
      } else if (status === 'read') {
        updates.readAt = timestamp ? new Date(parseInt(timestamp) * 1000) : new Date();
      } else if (status === 'failed') {
        updates.failedAt = new Date();
        updates.errorCode = error?.code?.toString();
        updates.errorMessage = error?.title || error?.message;
      }

      await prisma.whatsAppMessage.updateMany({
        where: { whatsappMessageId },
        data: updates,
      });

      // Update campaign statistics
      const message = await prisma.whatsAppMessage.findFirst({
        where: { whatsappMessageId },
        select: { campaignId: true },
      });

      if (message?.campaignId) {
        await this.updateCampaignStats(message.campaignId);
      }
    } catch (error) {
      logger.error('Failed to update message status:', error);
    }
  }

  /**
   * Handle incoming message (opt-in, reply, etc.)
   */
  private async handleIncomingMessage(message: any, contact: any): Promise<void> {
    const phoneNumber = message.from;
    const messageText = message.text?.body;

    // Check for opt-in keywords
    if (messageText && this.isOptInMessage(messageText)) {
      await this.handleOptIn(phoneNumber, contact?.profile?.name);
    }

    // Log incoming message as interaction
    const dbContact = await prisma.contact.findFirst({
      where: { phone: phoneNumber },
    });

    if (dbContact) {
      await prisma.contactInteraction.create({
        data: {
          contactId: dbContact.id,
          interactionType: 'whatsapp_reply',
          platform: 'WHATSAPP',
          interactionData: message,
          summary: messageText || 'Media received',
        },
      });
    }
  }

  /**
   * Check if message is an opt-in
   */
  private isOptInMessage(message: string): boolean {
    const optInKeywords = ['yes', 'subscribe', 'opt in', 'join', 'start'];
    const lowerMessage = message.toLowerCase().trim();
    return optInKeywords.some((keyword) => lowerMessage.includes(keyword));
  }

  /**
   * Handle WhatsApp opt-in
   */
  private async handleOptIn(phoneNumber: string, name?: string): Promise<void> {
    try {
      await prisma.contact.updateMany({
        where: { phone: phoneNumber },
        data: {
          whatsappOptIn: true,
          whatsappOptInDate: new Date(),
        },
      });

      logger.info(`WhatsApp opt-in recorded for ${phoneNumber}`);
    } catch (error) {
      logger.error('Failed to record opt-in:', error);
    }
  }

  /**
   * Update campaign statistics
   */
  private async updateCampaignStats(campaignId: string): Promise<void> {
    const stats = await prisma.whatsAppMessage.groupBy({
      by: ['status'],
      where: { campaignId },
      _count: { status: true },
    });

    const updates: any = {
      messagesSent: 0,
      messagesDelivered: 0,
      messagesRead: 0,
      messagesFailed: 0,
    };

    for (const stat of stats) {
      const count = stat._count.status;
      if (['SENT', 'DELIVERED', 'READ'].includes(stat.status)) {
        updates.messagesSent += count;
      }
      if (['DELIVERED', 'READ'].includes(stat.status)) {
        updates.messagesDelivered += count;
      }
      if (stat.status === 'READ') {
        updates.messagesRead += count;
      }
      if (stat.status === 'FAILED') {
        updates.messagesFailed += count;
      }
    }

    await prisma.whatsAppCampaign.update({
      where: { id: campaignId },
      data: updates,
    });
  }

  /**
   * Map status string to enum
   */
  private mapStatusToEnum(status: string): string {
    const statusMap: Record<string, string> = {
      queued: 'QUEUED',
      sending: 'SENDING',
      sent: 'SENT',
      delivered: 'DELIVERED',
      read: 'READ',
      failed: 'FAILED',
      undelivered: 'FAILED',
    };

    return statusMap[status.toLowerCase()] || 'PENDING';
  }

  /**
   * Map Twilio status to our enum
   */
  private mapTwilioStatus(status: string): string {
    const statusMap: Record<string, string> = {
      queued: 'queued',
      sending: 'sending',
      sent: 'sent',
      delivered: 'delivered',
      read: 'read',
      failed: 'failed',
      undelivered: 'failed',
    };

    return statusMap[status] || 'pending';
  }

  /**
   * Get media type from URL
   */
  private getMediaType(url: string): string {
    const extension = url.split('.').pop()?.toLowerCase();

    if (['jpg', 'jpeg', 'png', 'webp'].includes(extension || '')) {
      return 'image';
    } else if (['mp4', 'avi', 'mov'].includes(extension || '')) {
      return 'video';
    } else if (['pdf', 'doc', 'docx'].includes(extension || '')) {
      return 'document';
    }

    return 'document';
  }

  /**
   * Validate phone number format (E.164)
   */
  validatePhoneNumber(phone: string): boolean {
    // E.164 format: +[country code][number]
    const e164Regex = /^\+[1-9]\d{1,14}$/;
    return e164Regex.test(phone);
  }

  /**
   * Format phone number to E.164
   */
  formatPhoneNumber(phone: string, countryCode: string = '+1'): string {
    // Remove all non-digit characters
    let cleaned = phone.replace(/\D/g, '');

    // If it doesn't start with country code, add it
    if (!cleaned.startsWith(countryCode.replace('+', ''))) {
      cleaned = countryCode.replace('+', '') + cleaned;
    }

    return '+' + cleaned;
  }

  /**
   * Get service status
   */
  getStatus(): { provider: string | null; configured: boolean } {
    return {
      provider: this.provider,
      configured: this.provider !== null,
    };
  }

  /**
   * Verify webhook signature (Meta Cloud API)
   */
  verifyWebhookSignature(signature: string, body: string): boolean {
    if (this.provider !== 'META_CLOUD_API') {
      return true; // Twilio has its own verification
    }

    const appSecret = process.env.WHATSAPP_APP_SECRET;
    if (!appSecret) {
      logger.warn('WHATSAPP_APP_SECRET not set, skipping signature verification');
      return true;
    }

    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', appSecret)
      .update(body)
      .digest('hex');

    return signature === `sha256=${expectedSignature}`;
  }
}

export const whatsappService = new WhatsAppService();
