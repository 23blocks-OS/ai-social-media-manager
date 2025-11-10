import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { ContactSource } from '@prisma/client';
import { logger } from '../utils/logger';
import csv from 'csv-parser';
import { Readable } from 'stream';
import { socialImportService } from '../services/social-import.service';

export class ContactsController {
  /**
   * Get all contacts for the authenticated user
   */
  async getContacts(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const {
        page = '1',
        limit = '50',
        search,
        source,
        tags,
        subscribed,
      } = req.query;

      const pageNum = parseInt(page as string, 10);
      const limitNum = Math.min(parseInt(limit as string, 10), 100);
      const skip = (pageNum - 1) * limitNum;

      // Build where clause
      const where: any = { userId };

      if (search) {
        where.OR = [
          { email: { contains: search as string, mode: 'insensitive' } },
          { fullName: { contains: search as string, mode: 'insensitive' } },
          { company: { contains: search as string, mode: 'insensitive' } },
        ];
      }

      if (source) {
        where.source = source as ContactSource;
      }

      if (subscribed === 'true') {
        where.isSubscribed = true;
      } else if (subscribed === 'false') {
        where.isSubscribed = false;
      }

      if (tags) {
        const tagArray = (tags as string).split(',');
        where.tags = {
          some: {
            tag: { in: tagArray },
          },
        };
      }

      const [contacts, total] = await Promise.all([
        prisma.contact.findMany({
          where,
          include: {
            tags: true,
            _count: {
              select: {
                interactions: true,
                campaignContacts: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limitNum,
        }),
        prisma.contact.count({ where }),
      ]);

      res.json({
        contacts,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      });
    } catch (error) {
      logger.error('Failed to fetch contacts:', error);
      res.status(500).json({ error: 'Failed to fetch contacts' });
    }
  }

  /**
   * Get a single contact by ID
   */
  async getContact(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;

      const contact = await prisma.contact.findFirst({
        where: { id, userId },
        include: {
          tags: true,
          interactions: {
            orderBy: { occurredAt: 'desc' },
            take: 20,
          },
          campaignContacts: {
            include: {
              campaign: {
                select: {
                  id: true,
                  name: true,
                  status: true,
                  createdAt: true,
                },
              },
            },
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
        },
      });

      if (!contact) {
        return res.status(404).json({ error: 'Contact not found' });
      }

      res.json(contact);
    } catch (error) {
      logger.error('Failed to fetch contact:', error);
      res.status(500).json({ error: 'Failed to fetch contact' });
    }
  }

  /**
   * Create a new contact
   */
  async createContact(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const {
        email,
        firstName,
        lastName,
        fullName,
        company,
        jobTitle,
        location,
        phone,
        website,
        source = 'MANUAL',
        sourceId,
        profileData,
        customFields,
        tags,
      } = req.body;

      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }

      // Check if contact already exists
      const existing = await prisma.contact.findUnique({
        where: {
          userId_email: {
            userId,
            email: email.toLowerCase(),
          },
        },
      });

      if (existing) {
        return res.status(409).json({ error: 'Contact with this email already exists' });
      }

      // Create contact
      const contact = await prisma.contact.create({
        data: {
          userId,
          email: email.toLowerCase(),
          firstName,
          lastName,
          fullName: fullName || (firstName && lastName ? `${firstName} ${lastName}` : undefined),
          company,
          jobTitle,
          location,
          phone,
          website,
          source: source as ContactSource,
          sourceId,
          profileData,
          customFields,
          tags: tags
            ? {
                create: tags.map((tag: string) => ({ tag })),
              }
            : undefined,
        },
        include: {
          tags: true,
        },
      });

      res.status(201).json(contact);
    } catch (error) {
      logger.error('Failed to create contact:', error);
      res.status(500).json({ error: 'Failed to create contact' });
    }
  }

  /**
   * Update a contact
   */
  async updateContact(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;
      const {
        firstName,
        lastName,
        fullName,
        company,
        jobTitle,
        location,
        phone,
        website,
        profileData,
        customFields,
        tags,
        isSubscribed,
      } = req.body;

      // Verify ownership
      const existing = await prisma.contact.findFirst({
        where: { id, userId },
      });

      if (!existing) {
        return res.status(404).json({ error: 'Contact not found' });
      }

      // Handle tags update
      let tagsUpdate = undefined;
      if (tags) {
        // Delete existing tags and create new ones
        tagsUpdate = {
          deleteMany: {},
          create: tags.map((tag: string) => ({ tag })),
        };
      }

      const contact = await prisma.contact.update({
        where: { id },
        data: {
          firstName,
          lastName,
          fullName: fullName || (firstName && lastName ? `${firstName} ${lastName}` : undefined),
          company,
          jobTitle,
          location,
          phone,
          website,
          profileData,
          customFields,
          isSubscribed,
          tags: tagsUpdate,
        },
        include: {
          tags: true,
        },
      });

      res.json(contact);
    } catch (error) {
      logger.error('Failed to update contact:', error);
      res.status(500).json({ error: 'Failed to update contact' });
    }
  }

  /**
   * Delete a contact
   */
  async deleteContact(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;

      const contact = await prisma.contact.findFirst({
        where: { id, userId },
      });

      if (!contact) {
        return res.status(404).json({ error: 'Contact not found' });
      }

      await prisma.contact.delete({
        where: { id },
      });

      res.json({ message: 'Contact deleted successfully' });
    } catch (error) {
      logger.error('Failed to delete contact:', error);
      res.status(500).json({ error: 'Failed to delete contact' });
    }
  }

  /**
   * Import contacts from CSV
   */
  async importFromCSV(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const { csvData } = req.body;

      if (!csvData) {
        return res.status(400).json({ error: 'CSV data is required' });
      }

      const results: any[] = [];
      const errors: string[] = [];

      // Parse CSV
      const stream = Readable.from([csvData]);

      await new Promise((resolve, reject) => {
        stream
          .pipe(csv())
          .on('data', (row) => results.push(row))
          .on('end', resolve)
          .on('error', reject);
      });

      logger.info(`Parsed ${results.length} rows from CSV`);

      // Process contacts
      const imported = [];
      const skipped = [];

      for (const row of results) {
        try {
          const email = row.email || row.Email;
          if (!email) {
            errors.push(`Row missing email: ${JSON.stringify(row)}`);
            skipped.push({ row, reason: 'Missing email' });
            continue;
          }

          // Check if exists
          const existing = await prisma.contact.findUnique({
            where: {
              userId_email: {
                userId,
                email: email.toLowerCase(),
              },
            },
          });

          if (existing) {
            skipped.push({ email, reason: 'Already exists' });
            continue;
          }

          // Create contact
          const contact = await prisma.contact.create({
            data: {
              userId,
              email: email.toLowerCase(),
              firstName: row.firstName || row.FirstName || row.first_name,
              lastName: row.lastName || row.LastName || row.last_name,
              fullName: row.fullName || row.FullName || row.full_name,
              company: row.company || row.Company,
              jobTitle: row.jobTitle || row.JobTitle || row.job_title,
              location: row.location || row.Location,
              phone: row.phone || row.Phone,
              website: row.website || row.Website,
              source: 'CSV_IMPORT',
              customFields: row,
            },
          });

          imported.push(contact);
        } catch (error: any) {
          errors.push(`Failed to import ${row.email}: ${error.message}`);
          skipped.push({ row, reason: error.message });
        }
      }

      res.json({
        success: true,
        imported: imported.length,
        skipped: skipped.length,
        total: results.length,
        contacts: imported,
        skippedDetails: skipped.slice(0, 10), // Return first 10 skipped
        errors: errors.slice(0, 10), // Return first 10 errors
      });
    } catch (error) {
      logger.error('Failed to import CSV:', error);
      res.status(500).json({ error: 'Failed to import contacts from CSV' });
    }
  }

  /**
   * Export contacts to CSV
   */
  async exportToCSV(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const { tags, source, subscribed } = req.query;

      const where: any = { userId };

      if (source) {
        where.source = source as ContactSource;
      }

      if (subscribed === 'true') {
        where.isSubscribed = true;
      }

      if (tags) {
        const tagArray = (tags as string).split(',');
        where.tags = {
          some: {
            tag: { in: tagArray },
          },
        };
      }

      const contacts = await prisma.contact.findMany({
        where,
        include: {
          tags: true,
        },
      });

      // Convert to CSV
      const headers = [
        'email',
        'firstName',
        'lastName',
        'fullName',
        'company',
        'jobTitle',
        'location',
        'phone',
        'website',
        'source',
        'isSubscribed',
        'tags',
        'createdAt',
      ];

      const csvRows = [headers.join(',')];

      for (const contact of contacts) {
        const row = [
          contact.email,
          contact.firstName || '',
          contact.lastName || '',
          contact.fullName || '',
          contact.company || '',
          contact.jobTitle || '',
          contact.location || '',
          contact.phone || '',
          contact.website || '',
          contact.source,
          contact.isSubscribed,
          contact.tags.map((t) => t.tag).join(';'),
          contact.createdAt.toISOString(),
        ];

        csvRows.push(row.map((field) => `"${String(field).replace(/"/g, '""')}"`).join(','));
      }

      const csvContent = csvRows.join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=contacts.csv');
      res.send(csvContent);
    } catch (error) {
      logger.error('Failed to export CSV:', error);
      res.status(500).json({ error: 'Failed to export contacts to CSV' });
    }
  }

  /**
   * Add tags to a contact
   */
  async addTags(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;
      const { tags } = req.body;

      if (!tags || !Array.isArray(tags)) {
        return res.status(400).json({ error: 'Tags array is required' });
      }

      const contact = await prisma.contact.findFirst({
        where: { id, userId },
      });

      if (!contact) {
        return res.status(404).json({ error: 'Contact not found' });
      }

      // Add tags (ignore duplicates)
      await Promise.all(
        tags.map((tag) =>
          prisma.contactTag.upsert({
            where: {
              contactId_tag: {
                contactId: id,
                tag,
              },
            },
            create: {
              contactId: id,
              tag,
            },
            update: {},
          })
        )
      );

      const updated = await prisma.contact.findUnique({
        where: { id },
        include: { tags: true },
      });

      res.json(updated);
    } catch (error) {
      logger.error('Failed to add tags:', error);
      res.status(500).json({ error: 'Failed to add tags' });
    }
  }

  /**
   * Remove tags from a contact
   */
  async removeTags(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;
      const { tags } = req.body;

      if (!tags || !Array.isArray(tags)) {
        return res.status(400).json({ error: 'Tags array is required' });
      }

      const contact = await prisma.contact.findFirst({
        where: { id, userId },
      });

      if (!contact) {
        return res.status(404).json({ error: 'Contact not found' });
      }

      await prisma.contactTag.deleteMany({
        where: {
          contactId: id,
          tag: { in: tags },
        },
      });

      const updated = await prisma.contact.findUnique({
        where: { id },
        include: { tags: true },
      });

      res.json(updated);
    } catch (error) {
      logger.error('Failed to remove tags:', error);
      res.status(500).json({ error: 'Failed to remove tags' });
    }
  }

  /**
   * Import contacts from social media
   */
  async importFromSocialMedia(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const { socialAccountId, importType = 'followers' } = req.body;

      if (!socialAccountId) {
        return res.status(400).json({ error: 'Social account ID is required' });
      }

      const result = await socialImportService.importFromSocialAccount(
        userId,
        socialAccountId,
        importType
      );

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      logger.error('Failed to import from social media:', error);
      res.status(500).json({ error: 'Failed to import contacts from social media' });
    }
  }

  /**
   * Unsubscribe a contact
   */
  async unsubscribe(req: Request, res: Response) {
    try {
      const { token } = req.params;

      // In a real implementation, you'd decode/verify the token
      // For now, we'll use the contact ID directly
      const contactId = token;

      const contact = await prisma.contact.update({
        where: { id: contactId },
        data: {
          isSubscribed: false,
          unsubscribedAt: new Date(),
        },
      });

      res.json({
        message: 'Successfully unsubscribed',
        email: contact.email,
      });
    } catch (error) {
      logger.error('Failed to unsubscribe:', error);
      res.status(500).json({ error: 'Failed to unsubscribe' });
    }
  }
}

export const contactsController = new ContactsController();
