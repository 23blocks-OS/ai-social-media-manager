import nodemailer from 'nodemailer';
import { logger } from '../utils/logger';
import { prisma } from '../lib/prisma';

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text: string;
  campaignContactId?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
  }>;
}

export class EmailSendingService {
  private transporter: nodemailer.Transporter | null = null;
  private isConfigured: boolean = false;

  constructor() {
    this.initialize();
  }

  /**
   * Initialize email transporter
   */
  private initialize() {
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT;
    const smtpUser = process.env.SMTP_USER;
    const smtpPassword = process.env.SMTP_PASSWORD;
    const smtpFrom = process.env.SMTP_FROM || process.env.SMTP_USER;

    if (!smtpHost || !smtpUser || !smtpPassword) {
      logger.warn('SMTP configuration not found. Email sending will be disabled.');
      return;
    }

    try {
      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: parseInt(smtpPort || '587', 10),
        secure: smtpPort === '465', // true for 465, false for other ports
        auth: {
          user: smtpUser,
          pass: smtpPassword,
        },
      });

      this.isConfigured = true;
      logger.info('Email sending service initialized');
    } catch (error) {
      logger.error('Failed to initialize email transporter:', error);
    }
  }

  /**
   * Send an email
   */
  async sendEmail(options: SendEmailOptions): Promise<void> {
    if (!this.isConfigured || !this.transporter) {
      throw new Error('Email service is not configured. Please set SMTP environment variables.');
    }

    try {
      const info = await this.transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
        attachments: options.attachments,
        // Add tracking pixel
        headers: options.campaignContactId
          ? {
              'X-Campaign-Contact-ID': options.campaignContactId,
            }
          : undefined,
      });

      logger.info(`Email sent to ${options.to}: ${info.messageId}`);

      // Track email sent
      if (options.campaignContactId) {
        await this.trackEmailEvent(options.campaignContactId, 'sent', {
          messageId: info.messageId,
          response: info.response,
        });
      }
    } catch (error: any) {
      logger.error(`Failed to send email to ${options.to}:`, error);

      // Track failure
      if (options.campaignContactId) {
        await this.trackEmailEvent(options.campaignContactId, 'failed', {
          error: error.message,
        });
      }

      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  /**
   * Send bulk emails with rate limiting
   */
  async sendBulkEmails(
    emails: SendEmailOptions[],
    rateLimit: number = 10, // emails per second
    onProgress?: (sent: number, total: number) => void
  ): Promise<{ sent: number; failed: number }> {
    const delayMs = 1000 / rateLimit;
    let sent = 0;
    let failed = 0;

    for (let i = 0; i < emails.length; i++) {
      try {
        await this.sendEmail(emails[i]);
        sent++;
      } catch (error) {
        logger.error(`Failed to send bulk email ${i + 1}/${emails.length}:`, error);
        failed++;
      }

      if (onProgress) {
        onProgress(i + 1, emails.length);
      }

      // Rate limiting
      if (i < emails.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }

    return { sent, failed };
  }

  /**
   * Track email events (sent, delivered, opened, clicked, etc.)
   */
  private async trackEmailEvent(
    campaignContactId: string,
    eventType: string,
    eventData?: any
  ): Promise<void> {
    try {
      await prisma.emailTracking.create({
        data: {
          campaignContactId,
          eventType,
          eventData,
        },
      });

      // Update campaign contact status based on event
      const updates: any = {};

      switch (eventType) {
        case 'sent':
          updates.status = 'SENT';
          updates.sentAt = new Date();
          break;
        case 'delivered':
          updates.status = 'DELIVERED';
          updates.deliveredAt = new Date();
          break;
        case 'opened':
          if (!updates.openedAt) {
            updates.openedAt = new Date();
          }
          break;
        case 'clicked':
          if (!updates.clickedAt) {
            updates.clickedAt = new Date();
          }
          break;
        case 'bounced':
          updates.status = 'BOUNCED';
          updates.bouncedAt = new Date();
          break;
        case 'failed':
          updates.status = 'FAILED';
          break;
        case 'unsubscribed':
          updates.status = 'UNSUBSCRIBED';
          updates.unsubscribedAt = new Date();
          break;
      }

      if (Object.keys(updates).length > 0) {
        await prisma.campaignContact.update({
          where: { id: campaignContactId },
          data: updates,
        });

        // Update campaign statistics
        const campaignContact = await prisma.campaignContact.findUnique({
          where: { id: campaignContactId },
          select: { campaignId: true },
        });

        if (campaignContact) {
          await this.updateCampaignStats(campaignContact.campaignId);
        }
      }
    } catch (error) {
      logger.error('Failed to track email event:', error);
    }
  }

  /**
   * Update campaign statistics
   */
  private async updateCampaignStats(campaignId: string): Promise<void> {
    const stats = await prisma.campaignContact.groupBy({
      by: ['status'],
      where: { campaignId },
      _count: { status: true },
    });

    const updates: any = {
      emailsSent: 0,
      emailsDelivered: 0,
      emailsOpened: 0,
      emailsClicked: 0,
      emailsBounced: 0,
      emailsFailed: 0,
    };

    for (const stat of stats) {
      const count = stat._count.status;
      switch (stat.status) {
        case 'SENT':
        case 'DELIVERED':
        case 'OPENED':
        case 'CLICKED':
          updates.emailsSent += count;
          break;
      }

      switch (stat.status) {
        case 'DELIVERED':
        case 'OPENED':
        case 'CLICKED':
          updates.emailsDelivered += count;
          break;
      }

      if (stat.status === 'OPENED' || stat.status === 'CLICKED') {
        updates.emailsOpened += count;
      }

      if (stat.status === 'CLICKED') {
        updates.emailsClicked += count;
      }

      if (stat.status === 'BOUNCED') {
        updates.emailsBounced += count;
      }

      if (stat.status === 'FAILED') {
        updates.emailsFailed += count;
      }
    }

    await prisma.emailCampaign.update({
      where: { id: campaignId },
      data: updates,
    });
  }

  /**
   * Test email configuration
   */
  async testConnection(): Promise<boolean> {
    if (!this.transporter) {
      return false;
    }

    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      logger.error('Email connection test failed:', error);
      return false;
    }
  }

  /**
   * Get service status
   */
  getStatus(): { configured: boolean; smtpHost?: string; smtpFrom?: string } {
    return {
      configured: this.isConfigured,
      smtpHost: process.env.SMTP_HOST,
      smtpFrom: process.env.SMTP_FROM || process.env.SMTP_USER,
    };
  }

  /**
   * Handle email tracking webhook (for services like SendGrid, AWS SES)
   */
  async handleWebhook(eventType: string, data: any): Promise<void> {
    try {
      const campaignContactId = data.campaignContactId || data.headers?.['X-Campaign-Contact-ID'];

      if (!campaignContactId) {
        logger.warn('Webhook received without campaign contact ID');
        return;
      }

      await this.trackEmailEvent(campaignContactId, eventType, data);
    } catch (error) {
      logger.error('Failed to handle email webhook:', error);
    }
  }
}

export const emailSendingService = new EmailSendingService();
