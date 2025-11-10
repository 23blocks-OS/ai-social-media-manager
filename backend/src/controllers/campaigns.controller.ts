import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { AIModelType, CampaignStatus, EmailStatus } from '@prisma/client';
import { logger } from '../utils/logger';
import { emailComposerService } from '../services/email-composer.service';
import { emailSendingService } from '../services/email-sending.service';

export class CampaignsController {
  /**
   * Get all campaigns for the authenticated user
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
        prisma.emailCampaign.findMany({
          where,
          include: {
            _count: {
              select: {
                campaignContacts: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limitNum,
        }),
        prisma.emailCampaign.count({ where }),
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
      logger.error('Failed to fetch campaigns:', error);
      res.status(500).json({ error: 'Failed to fetch campaigns' });
    }
  }

  /**
   * Get a single campaign by ID
   */
  async getCampaign(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;

      const campaign = await prisma.emailCampaign.findFirst({
        where: { id, userId },
        include: {
          templates: true,
          campaignContacts: {
            include: {
              contact: {
                select: {
                  id: true,
                  email: true,
                  fullName: true,
                  company: true,
                },
              },
            },
            orderBy: { createdAt: 'desc' },
            take: 100,
          },
        },
      });

      if (!campaign) {
        return res.status(404).json({ error: 'Campaign not found' });
      }

      res.json(campaign);
    } catch (error) {
      logger.error('Failed to fetch campaign:', error);
      res.status(500).json({ error: 'Failed to fetch campaign' });
    }
  }

  /**
   * Create a new campaign
   */
  async createCampaign(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const {
        name,
        description,
        subjectTemplate,
        campaignGoal,
        targetTags,
        aiModelType = 'LOCAL_LLM',
        aiModelName = 'llama3',
        personalizationInstructions,
        personalizationLevel = 'MEDIUM',
        includeSocialContext = true,
        includeInteractionHistory = true,
        baseTemplate,
      } = req.body;

      if (!name || !subjectTemplate) {
        return res.status(400).json({ error: 'Name and subject template are required' });
      }

      const campaign = await prisma.emailCampaign.create({
        data: {
          userId,
          name,
          description,
          subjectTemplate,
          campaignGoal,
          targetTags: targetTags || [],
          aiModelType: aiModelType as AIModelType,
          aiModelName,
          personalizationInstructions,
          personalizationLevel,
          includeSocialContext,
          includeInteractionHistory,
          status: 'DRAFT',
          templates: baseTemplate
            ? {
                create: {
                  templateName: 'default',
                  baseTemplate,
                },
              }
            : undefined,
        },
        include: {
          templates: true,
        },
      });

      res.status(201).json(campaign);
    } catch (error) {
      logger.error('Failed to create campaign:', error);
      res.status(500).json({ error: 'Failed to create campaign' });
    }
  }

  /**
   * Update a campaign
   */
  async updateCampaign(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;
      const {
        name,
        description,
        subjectTemplate,
        campaignGoal,
        targetTags,
        aiModelType,
        aiModelName,
        personalizationInstructions,
        personalizationLevel,
        includeSocialContext,
        includeInteractionHistory,
        status,
      } = req.body;

      const existing = await prisma.emailCampaign.findFirst({
        where: { id, userId },
      });

      if (!existing) {
        return res.status(404).json({ error: 'Campaign not found' });
      }

      // Don't allow editing campaigns that are sending or completed
      if (['SENDING', 'COMPLETED'].includes(existing.status)) {
        return res.status(400).json({ error: 'Cannot edit campaign that is sending or completed' });
      }

      const campaign = await prisma.emailCampaign.update({
        where: { id },
        data: {
          name,
          description,
          subjectTemplate,
          campaignGoal,
          targetTags,
          aiModelType: aiModelType as AIModelType | undefined,
          aiModelName,
          personalizationInstructions,
          personalizationLevel,
          includeSocialContext,
          includeInteractionHistory,
          status: status as CampaignStatus | undefined,
        },
        include: {
          templates: true,
        },
      });

      res.json(campaign);
    } catch (error) {
      logger.error('Failed to update campaign:', error);
      res.status(500).json({ error: 'Failed to update campaign' });
    }
  }

  /**
   * Delete a campaign
   */
  async deleteCampaign(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;

      const campaign = await prisma.emailCampaign.findFirst({
        where: { id, userId },
      });

      if (!campaign) {
        return res.status(404).json({ error: 'Campaign not found' });
      }

      // Don't allow deleting campaigns that are sending
      if (campaign.status === 'SENDING') {
        return res.status(400).json({ error: 'Cannot delete campaign that is currently sending' });
      }

      await prisma.emailCampaign.delete({
        where: { id },
      });

      res.json({ message: 'Campaign deleted successfully' });
    } catch (error) {
      logger.error('Failed to delete campaign:', error);
      res.status(500).json({ error: 'Failed to delete campaign' });
    }
  }

  /**
   * Add contacts to a campaign
   */
  async addContacts(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;
      const { contactIds, tags } = req.body;

      const campaign = await prisma.emailCampaign.findFirst({
        where: { id, userId },
      });

      if (!campaign) {
        return res.status(404).json({ error: 'Campaign not found' });
      }

      let contacts = [];

      if (contactIds && contactIds.length > 0) {
        // Add specific contacts
        contacts = await prisma.contact.findMany({
          where: {
            userId,
            id: { in: contactIds },
            isSubscribed: true,
          },
        });
      } else if (tags && tags.length > 0) {
        // Add contacts by tags
        contacts = await prisma.contact.findMany({
          where: {
            userId,
            isSubscribed: true,
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

      // Create campaign contacts
      const campaignContacts = await Promise.all(
        contacts.map((contact) =>
          prisma.campaignContact.upsert({
            where: {
              campaignId_contactId: {
                campaignId: id,
                contactId: contact.id,
              },
            },
            create: {
              campaignId: id,
              contactId: contact.id,
              status: 'PENDING',
            },
            update: {},
          })
        )
      );

      // Update campaign total contacts
      const totalContacts = await prisma.campaignContact.count({
        where: { campaignId: id },
      });

      await prisma.emailCampaign.update({
        where: { id },
        data: { totalContacts },
      });

      res.json({
        message: `Added ${campaignContacts.length} contacts to campaign`,
        added: campaignContacts.length,
        totalContacts,
      });
    } catch (error) {
      logger.error('Failed to add contacts to campaign:', error);
      res.status(500).json({ error: 'Failed to add contacts to campaign' });
    }
  }

  /**
   * Generate personalized emails for campaign
   */
  async generateEmails(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;

      const campaign = await prisma.emailCampaign.findFirst({
        where: { id, userId },
      });

      if (!campaign) {
        return res.status(404).json({ error: 'Campaign not found' });
      }

      // Update status to generating
      await prisma.emailCampaign.update({
        where: { id },
        data: { status: 'GENERATING', startedAt: new Date() },
      });

      // Get all pending contacts
      const pendingContacts = await prisma.campaignContact.findMany({
        where: {
          campaignId: id,
          status: 'PENDING',
        },
        select: { contactId: true },
      });

      const contactIds = pendingContacts.map((cc) => cc.contactId);

      logger.info(`Generating emails for ${contactIds.length} contacts in campaign ${id}`);

      // Generate emails in background (in a real app, use a job queue)
      this.generateEmailsInBackground(id, contactIds, campaign.aiModelType, campaign.aiModelName);

      res.json({
        message: 'Email generation started',
        totalContacts: contactIds.length,
      });
    } catch (error) {
      logger.error('Failed to start email generation:', error);
      res.status(500).json({ error: 'Failed to start email generation' });
    }
  }

  /**
   * Generate emails in background
   */
  private async generateEmailsInBackground(
    campaignId: string,
    contactIds: string[],
    aiModelType: AIModelType,
    aiModelName: string
  ) {
    try {
      const results = await emailComposerService.batchGenerateEmails(
        campaignId,
        contactIds,
        aiModelType,
        aiModelName,
        async (processed, total) => {
          // Update progress
          logger.info(`Email generation progress: ${processed}/${total}`);
        }
      );

      // Save generated emails
      for (const [contactId, email] of results.entries()) {
        await prisma.campaignContact.update({
          where: {
            campaignId_contactId: {
              campaignId,
              contactId,
            },
          },
          data: {
            personalizedSubject: email.subject,
            personalizedContent: email.body,
            htmlContent: email.htmlBody,
            status: 'GENERATED',
            aiGenerationTimeMs: email.generationTimeMs,
          },
        });
      }

      // Update campaign status
      const generatedCount = await prisma.campaignContact.count({
        where: { campaignId, status: 'GENERATED' },
      });

      await prisma.emailCampaign.update({
        where: { id: campaignId },
        data: {
          status: 'READY',
          emailsGenerated: generatedCount,
        },
      });

      logger.info(`Successfully generated ${generatedCount} emails for campaign ${campaignId}`);
    } catch (error) {
      logger.error(`Failed to generate emails for campaign ${campaignId}:`, error);

      await prisma.emailCampaign.update({
        where: { id: campaignId },
        data: { status: 'DRAFT' },
      });
    }
  }

  /**
   * Send campaign emails
   */
  async sendCampaign(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;
      const { testEmail } = req.body;

      const campaign = await prisma.emailCampaign.findFirst({
        where: { id, userId },
      });

      if (!campaign) {
        return res.status(404).json({ error: 'Campaign not found' });
      }

      if (campaign.status !== 'READY') {
        return res.status(400).json({ error: 'Campaign must be in READY status to send' });
      }

      // If test email is provided, send to test email only
      if (testEmail) {
        const testContact = await prisma.campaignContact.findFirst({
          where: { campaignId: id, status: 'GENERATED' },
          include: { contact: true },
        });

        if (!testContact) {
          return res.status(400).json({ error: 'No generated emails found' });
        }

        await emailSendingService.sendEmail({
          to: testEmail,
          subject: testContact.personalizedSubject || 'Test Email',
          html: testContact.htmlContent || testContact.personalizedContent || 'No content',
          text: testContact.personalizedContent || '',
        });

        return res.json({ message: 'Test email sent successfully' });
      }

      // Start sending campaign
      await prisma.emailCampaign.update({
        where: { id },
        data: { status: 'SENDING' },
      });

      // Send emails in background
      this.sendCampaignInBackground(id);

      res.json({ message: 'Campaign sending started' });
    } catch (error) {
      logger.error('Failed to send campaign:', error);
      res.status(500).json({ error: 'Failed to send campaign' });
    }
  }

  /**
   * Send campaign emails in background
   */
  private async sendCampaignInBackground(campaignId: string) {
    try {
      const contacts = await prisma.campaignContact.findMany({
        where: {
          campaignId,
          status: { in: ['GENERATED', 'QUEUED'] },
        },
        include: { contact: true },
      });

      logger.info(`Sending ${contacts.length} emails for campaign ${campaignId}`);

      for (const campaignContact of contacts) {
        try {
          await emailSendingService.sendEmail({
            to: campaignContact.contact.email,
            subject: campaignContact.personalizedSubject || 'No subject',
            html: campaignContact.htmlContent || campaignContact.personalizedContent || '',
            text: campaignContact.personalizedContent || '',
            campaignContactId: campaignContact.id,
          });

          await prisma.campaignContact.update({
            where: { id: campaignContact.id },
            data: {
              status: 'SENT',
              sentAt: new Date(),
            },
          });

          // Update campaign stats
          await prisma.emailCampaign.update({
            where: { id: campaignId },
            data: {
              emailsSent: { increment: 1 },
            },
          });

          // Rate limiting: wait 100ms between emails
          await new Promise((resolve) => setTimeout(resolve, 100));
        } catch (error) {
          logger.error(`Failed to send email to ${campaignContact.contact.email}:`, error);

          await prisma.campaignContact.update({
            where: { id: campaignContact.id },
            data: {
              status: 'FAILED',
              errorMessage: (error as Error).message,
              sendAttempts: { increment: 1 },
            },
          });

          await prisma.emailCampaign.update({
            where: { id: campaignId },
            data: {
              emailsFailed: { increment: 1 },
            },
          });
        }
      }

      // Mark campaign as completed
      await prisma.emailCampaign.update({
        where: { id: campaignId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      });

      logger.info(`Campaign ${campaignId} completed`);
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

      const campaign = await prisma.emailCampaign.findFirst({
        where: { id, userId },
      });

      if (!campaign) {
        return res.status(404).json({ error: 'Campaign not found' });
      }

      const statusBreakdown = await prisma.campaignContact.groupBy({
        by: ['status'],
        where: { campaignId: id },
        _count: { status: true },
      });

      const analytics = {
        campaign: {
          id: campaign.id,
          name: campaign.name,
          status: campaign.status,
          createdAt: campaign.createdAt,
          startedAt: campaign.startedAt,
          completedAt: campaign.completedAt,
        },
        stats: {
          totalContacts: campaign.totalContacts,
          emailsGenerated: campaign.emailsGenerated,
          emailsSent: campaign.emailsSent,
          emailsDelivered: campaign.emailsDelivered,
          emailsOpened: campaign.emailsOpened,
          emailsClicked: campaign.emailsClicked,
          emailsBounced: campaign.emailsBounced,
          emailsFailed: campaign.emailsFailed,
        },
        rates: {
          deliveryRate: campaign.emailsSent > 0 ? (campaign.emailsDelivered / campaign.emailsSent) * 100 : 0,
          openRate: campaign.emailsDelivered > 0 ? (campaign.emailsOpened / campaign.emailsDelivered) * 100 : 0,
          clickRate: campaign.emailsOpened > 0 ? (campaign.emailsClicked / campaign.emailsOpened) * 100 : 0,
          bounceRate: campaign.emailsSent > 0 ? (campaign.emailsBounced / campaign.emailsSent) * 100 : 0,
        },
        statusBreakdown,
      };

      res.json(analytics);
    } catch (error) {
      logger.error('Failed to fetch campaign analytics:', error);
      res.status(500).json({ error: 'Failed to fetch campaign analytics' });
    }
  }
}

export const campaignsController = new CampaignsController();
