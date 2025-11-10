import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { logger } from '../utils/logger';
import { whatsappService } from '../services/whatsapp.service';
import { emailComposerService } from '../services/email-composer.service';
import { AIModelType, CampaignStatus } from '@prisma/client';

export class WhatsAppController {
  /**
   * Get WhatsApp configuration for user
   */
  async getConfig(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;

      const config = await prisma.whatsAppConfig.findUnique({
        where: { userId },
      });

      if (!config) {
        return res.json({
          configured: false,
          provider: null,
        });
      }

      // Don't send sensitive data to client
      res.json({
        configured: config.isActive,
        provider: config.provider,
        phoneNumber: config.twilioPhoneNumber || config.phoneNumberId,
        lastVerifiedAt: config.lastVerifiedAt,
      });
    } catch (error) {
      logger.error('Failed to get WhatsApp config:', error);
      res.status(500).json({ error: 'Failed to get configuration' });
    }
  }

  /**
   * Save or update WhatsApp configuration
   */
  async saveConfig(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const {
        provider,
        phoneNumberId,
        businessAccountId,
        accessToken,
        twilioAccountSid,
        twilioAuthToken,
        twilioPhoneNumber,
        webhookVerifyToken,
      } = req.body;

      if (!provider || !['META_CLOUD_API', 'TWILIO'].includes(provider)) {
        return res.status(400).json({ error: 'Invalid provider' });
      }

      const config = await prisma.whatsAppConfig.upsert({
        where: { userId },
        create: {
          userId,
          provider,
          phoneNumberId,
          businessAccountId,
          accessToken,
          twilioAccountSid,
          twilioAuthToken,
          twilioPhoneNumber,
          webhookVerifyToken,
          isActive: true,
          lastVerifiedAt: new Date(),
        },
        update: {
          provider,
          phoneNumberId,
          businessAccountId,
          accessToken,
          twilioAccountSid,
          twilioAuthToken,
          twilioPhoneNumber,
          webhookVerifyToken,
          isActive: true,
          lastVerifiedAt: new Date(),
        },
      });

      res.json({
        success: true,
        message: 'WhatsApp configuration saved successfully',
      });
    } catch (error) {
      logger.error('Failed to save WhatsApp config:', error);
      res.status(500).json({ error: 'Failed to save configuration' });
    }
  }

  /**
   * List WhatsApp templates
   */
  async getTemplates(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const { status } = req.query;

      const where: any = { userId };
      if (status) {
        where.status = status as string;
      }

      const templates = await prisma.whatsAppTemplate.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      });

      res.json({ templates });
    } catch (error) {
      logger.error('Failed to get templates:', error);
      res.status(500).json({ error: 'Failed to get templates' });
    }
  }

  /**
   * Create a WhatsApp template
   */
  async createTemplate(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const {
        name,
        language = 'en',
        category,
        headerType,
        headerContent,
        bodyText,
        footerText,
        buttons,
      } = req.body;

      if (!name || !category || !bodyText) {
        return res.status(400).json({ error: 'Name, category, and body text are required' });
      }

      // Create template in database
      const template = await prisma.whatsAppTemplate.create({
        data: {
          userId,
          name,
          language,
          category,
          headerType,
          headerContent,
          bodyText,
          footerText,
          buttons,
          status: 'PENDING',
          templateContent: bodyText,
        },
      });

      // Submit to WhatsApp for approval
      try {
        const components: any[] = [];

        if (headerType && headerContent) {
          components.push({
            type: 'HEADER',
            format: headerType,
            text: headerContent,
          });
        }

        components.push({
          type: 'BODY',
          text: bodyText,
        });

        if (footerText) {
          components.push({
            type: 'FOOTER',
            text: footerText,
          });
        }

        if (buttons && buttons.length > 0) {
          components.push({
            type: 'BUTTONS',
            buttons,
          });
        }

        const result = await whatsappService.createTemplate(userId, {
          name,
          language,
          category,
          components,
        });

        // Update with WhatsApp ID
        await prisma.whatsAppTemplate.update({
          where: { id: template.id },
          data: { whatsappId: result.id },
        });
      } catch (error: any) {
        logger.error('Failed to submit template to WhatsApp:', error);
        await prisma.whatsAppTemplate.update({
          where: { id: template.id },
          data: {
            status: 'REJECTED',
            rejectionReason: error.message,
          },
        });
      }

      res.status(201).json(template);
    } catch (error) {
      logger.error('Failed to create template:', error);
      res.status(500).json({ error: 'Failed to create template' });
    }
  }

  /**
   * Get WhatsApp campaigns
   */
  async getCampaigns(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const { page = '1', limit = '20', status } = req.query;

      const pageNum = parseInt(page as string, 10);
      const limitNum = Math.min(parseInt(limit as string, 10), 100);
      const skip = (pageNum - 1) * limitNum;

      const where: any = { userId };
      if (status) {
        where.status = status as CampaignStatus;
      }

      const [campaigns, total] = await Promise.all([
        prisma.whatsAppCampaign.findMany({
          where,
          include: {
            template: {
              select: {
                name: true,
                status: true,
              },
            },
            _count: {
              select: {
                messages: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limitNum,
        }),
        prisma.whatsAppCampaign.count({ where }),
      ]);

      res.json({
        campaigns,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      });
    } catch (error) {
      logger.error('Failed to get campaigns:', error);
      res.status(500).json({ error: 'Failed to get campaigns' });
    }
  }

  /**
   * Create WhatsApp campaign
   */
  async createCampaign(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const {
        name,
        description,
        templateId,
        targetTags,
        personalizationInstructions,
        aiModelType = 'LOCAL_LLM',
        aiModelName = 'llama3',
      } = req.body;

      if (!name || !templateId) {
        return res.status(400).json({ error: 'Name and template are required' });
      }

      // Verify template exists and is approved
      const template = await prisma.whatsAppTemplate.findFirst({
        where: { id: templateId, userId },
      });

      if (!template) {
        return res.status(404).json({ error: 'Template not found' });
      }

      if (template.status !== 'APPROVED') {
        return res
          .status(400)
          .json({ error: 'Template must be approved before creating campaign' });
      }

      const campaign = await prisma.whatsAppCampaign.create({
        data: {
          userId,
          name,
          description,
          templateId,
          targetTags: targetTags || [],
          personalizationInstructions,
          aiModelType: aiModelType as AIModelType,
          aiModelName,
          status: 'DRAFT',
        },
        include: {
          template: true,
        },
      });

      res.status(201).json(campaign);
    } catch (error) {
      logger.error('Failed to create campaign:', error);
      res.status(500).json({ error: 'Failed to create campaign' });
    }
  }

  /**
   * Add contacts to campaign
   */
  async addContacts(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;
      const { contactIds, tags } = req.body;

      const campaign = await prisma.whatsAppCampaign.findFirst({
        where: { id, userId },
      });

      if (!campaign) {
        return res.status(404).json({ error: 'Campaign not found' });
      }

      let contacts = [];

      if (contactIds && contactIds.length > 0) {
        contacts = await prisma.contact.findMany({
          where: {
            userId,
            id: { in: contactIds },
            whatsappOptIn: true, // IMPORTANT: Only contacts who opted in!
            phone: { not: null },
          },
        });
      } else if (tags && tags.length > 0) {
        contacts = await prisma.contact.findMany({
          where: {
            userId,
            whatsappOptIn: true,
            phone: { not: null },
            tags: {
              some: {
                tag: { in: tags },
              },
            },
          },
        });
      } else {
        return res.status(400).json({ error: 'Either contactIds or tags must be provided' });
      }

      // Filter contacts with valid phone numbers
      const validContacts = contacts.filter(
        (c) => c.phone && whatsappService.validatePhoneNumber(c.phone)
      );

      logger.info(
        `Found ${validContacts.length} valid WhatsApp contacts out of ${contacts.length}`
      );

      // Update campaign total contacts
      await prisma.whatsAppCampaign.update({
        where: { id },
        data: { totalContacts: validContacts.length },
      });

      res.json({
        message: `Added ${validContacts.length} contacts to campaign`,
        added: validContacts.length,
        totalContacts: validContacts.length,
      });
    } catch (error) {
      logger.error('Failed to add contacts to campaign:', error);
      res.status(500).json({ error: 'Failed to add contacts to campaign' });
    }
  }

  /**
   * Send WhatsApp campaign
   */
  async sendCampaign(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;
      const { testPhone } = req.body;

      const campaign = await prisma.whatsAppCampaign.findFirst({
        where: { id, userId },
        include: {
          template: true,
        },
      });

      if (!campaign) {
        return res.status(404).json({ error: 'Campaign not found' });
      }

      if (campaign.status !== 'DRAFT' && campaign.status !== 'READY') {
        return res.status(400).json({ error: 'Campaign cannot be sent in current status' });
      }

      // Send test message
      if (testPhone) {
        try {
          const messageId = await whatsappService.sendMessage(
            {
              to: testPhone,
              templateName: campaign.template.name,
              templateLanguage: campaign.template.language,
            },
            userId
          );

          return res.json({
            success: true,
            message: 'Test message sent successfully',
            messageId,
          });
        } catch (error: any) {
          return res.status(500).json({ error: `Failed to send test: ${error.message}` });
        }
      }

      // Start sending campaign
      await prisma.whatsAppCampaign.update({
        where: { id },
        data: {
          status: 'SENDING',
          startedAt: new Date(),
        },
      });

      // Send messages in background
      this.sendCampaignInBackground(id, userId, campaign.template);

      res.json({
        success: true,
        message: 'Campaign sending started',
      });
    } catch (error) {
      logger.error('Failed to send campaign:', error);
      res.status(500).json({ error: 'Failed to send campaign' });
    }
  }

  /**
   * Send campaign messages in background
   */
  private async sendCampaignInBackground(
    campaignId: string,
    userId: string,
    template: any
  ): Promise<void> {
    try {
      // Get all contacts for this campaign
      const campaign = await prisma.whatsAppCampaign.findUnique({
        where: { id: campaignId },
        include: {
          template: true,
        },
      });

      if (!campaign) return;

      // Get contacts by tags
      const contacts = await prisma.contact.findMany({
        where: {
          userId,
          whatsappOptIn: true,
          phone: { not: null },
          ...(campaign.targetTags.length > 0
            ? {
                tags: {
                  some: {
                    tag: { in: campaign.targetTags },
                  },
                },
              }
            : {}),
        },
      });

      logger.info(`Sending WhatsApp campaign to ${contacts.length} contacts`);

      for (const contact of contacts) {
        try {
          if (!contact.phone) continue;

          // Format phone number
          const phoneNumber = whatsappService.formatPhoneNumber(
            contact.phone,
            contact.phoneCountryCode || '+1'
          );

          // Extract variables from template
          const variables: Record<string, string> = {};
          if (contact.firstName) variables['1'] = contact.firstName;
          if (contact.company) variables['2'] = contact.company;

          // Send message
          const messageId = await whatsappService.sendMessage(
            {
              to: phoneNumber,
              templateName: template.name,
              templateLanguage: template.language,
              templateVariables: variables,
            },
            userId
          );

          // Save message to database
          await prisma.whatsAppMessage.create({
            data: {
              campaignId,
              contactId: contact.id,
              userId,
              phoneNumber,
              messageContent: template.bodyText,
              templateName: template.name,
              templateVariables: variables,
              status: 'SENT',
              whatsappMessageId: messageId,
              sentAt: new Date(),
            },
          });

          // Update campaign stats
          await prisma.whatsAppCampaign.update({
            where: { id: campaignId },
            data: {
              messagesSent: { increment: 1 },
            },
          });

          // Rate limiting: 80 messages per second for Meta Cloud API
          await new Promise((resolve) => setTimeout(resolve, 15));
        } catch (error) {
          logger.error(`Failed to send WhatsApp to ${contact.email}:`, error);

          // Log failed message
          await prisma.whatsAppMessage.create({
            data: {
              campaignId,
              contactId: contact.id,
              userId,
              phoneNumber: contact.phone || '',
              messageContent: template.bodyText,
              templateName: template.name,
              status: 'FAILED',
              errorMessage: (error as Error).message,
              failedAt: new Date(),
            },
          });

          await prisma.whatsAppCampaign.update({
            where: { id: campaignId },
            data: {
              messagesFailed: { increment: 1 },
            },
          });
        }
      }

      // Mark campaign as completed
      await prisma.whatsAppCampaign.update({
        where: { id: campaignId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      });

      logger.info(`WhatsApp campaign ${campaignId} completed`);
    } catch (error) {
      logger.error(`Failed to send campaign ${campaignId}:`, error);
    }
  }

  /**
   * Get campaign analytics
   */
  async getCampaignAnalytics(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;

      const campaign = await prisma.whatsAppCampaign.findFirst({
        where: { id, userId },
        include: {
          template: {
            select: {
              name: true,
              status: true,
            },
          },
        },
      });

      if (!campaign) {
        return res.status(404).json({ error: 'Campaign not found' });
      }

      const analytics = {
        campaign: {
          id: campaign.id,
          name: campaign.name,
          status: campaign.status,
          template: campaign.template.name,
          createdAt: campaign.createdAt,
          startedAt: campaign.startedAt,
          completedAt: campaign.completedAt,
        },
        stats: {
          totalContacts: campaign.totalContacts,
          messagesSent: campaign.messagesSent,
          messagesDelivered: campaign.messagesDelivered,
          messagesRead: campaign.messagesRead,
          messagesFailed: campaign.messagesFailed,
        },
        rates: {
          deliveryRate:
            campaign.messagesSent > 0
              ? (campaign.messagesDelivered / campaign.messagesSent) * 100
              : 0,
          readRate:
            campaign.messagesDelivered > 0
              ? (campaign.messagesRead / campaign.messagesDelivered) * 100
              : 0,
          failureRate:
            campaign.messagesSent > 0 ? (campaign.messagesFailed / campaign.messagesSent) * 100 : 0,
        },
      };

      res.json(analytics);
    } catch (error) {
      logger.error('Failed to get campaign analytics:', error);
      res.status(500).json({ error: 'Failed to get campaign analytics' });
    }
  }

  /**
   * Handle WhatsApp webhook
   */
  async handleWebhook(req: Request, res: Response) {
    try {
      // Verify webhook (for setup)
      if (req.query['hub.mode'] === 'subscribe') {
        const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || 'your-verify-token';

        if (req.query['hub.verify_token'] === verifyToken) {
          return res.send(req.query['hub.challenge']);
        } else {
          return res.status(403).send('Forbidden');
        }
      }

      // Handle webhook events
      await whatsappService.handleWebhook(req.body);

      res.sendStatus(200);
    } catch (error) {
      logger.error('Failed to handle WhatsApp webhook:', error);
      res.sendStatus(500);
    }
  }
}

export const whatsappController = new WhatsAppController();
