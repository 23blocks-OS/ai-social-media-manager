import { prisma } from '../lib/prisma';
import { Platform } from '@prisma/client';
import { logger } from '../utils/logger';
import axios from 'axios';

export interface SocialContact {
  platformId: string;
  email?: string;
  username: string;
  fullName?: string;
  bio?: string;
  followerCount?: number;
  location?: string;
  website?: string;
  profileUrl?: string;
  avatarUrl?: string;
  recentPosts?: string[];
  interests?: string[];
}

export class SocialImportService {
  /**
   * Import contacts from a social media account
   */
  async importFromSocialAccount(
    userId: string,
    socialAccountId: string,
    importType: 'followers' | 'following' | 'connections' | 'audience'
  ): Promise<{ imported: number; skipped: number; errors: string[] }> {
    try {
      const socialAccount = await prisma.socialAccount.findFirst({
        where: { id: socialAccountId, userId },
      });

      if (!socialAccount) {
        throw new Error('Social account not found');
      }

      logger.info(
        `Importing ${importType} from ${socialAccount.platform} account ${socialAccount.username}`
      );

      let contacts: SocialContact[] = [];

      switch (socialAccount.platform) {
        case 'TWITTER':
          contacts = await this.importFromTwitter(socialAccount, importType);
          break;
        case 'LINKEDIN':
          contacts = await this.importFromLinkedIn(socialAccount, importType);
          break;
        case 'INSTAGRAM':
          contacts = await this.importFromInstagram(socialAccount, importType);
          break;
        case 'FACEBOOK':
          contacts = await this.importFromFacebook(socialAccount, importType);
          break;
        default:
          throw new Error(`Import from ${socialAccount.platform} is not supported yet`);
      }

      // Save contacts to database
      const result = await this.saveContacts(userId, socialAccount.platform, contacts);

      logger.info(
        `Imported ${result.imported} contacts from ${socialAccount.platform}, skipped ${result.skipped}`
      );

      return result;
    } catch (error: any) {
      logger.error('Failed to import contacts from social media:', error);
      throw error;
    }
  }

  /**
   * Import contacts from Twitter
   */
  private async importFromTwitter(
    socialAccount: any,
    importType: string
  ): Promise<SocialContact[]> {
    const contacts: SocialContact[] = [];

    try {
      // Twitter API v2 endpoint
      const endpoint =
        importType === 'followers'
          ? `https://api.twitter.com/2/users/${socialAccount.platformId}/followers`
          : `https://api.twitter.com/2/users/${socialAccount.platformId}/following`;

      const response = await axios.get(endpoint, {
        headers: {
          Authorization: `Bearer ${socialAccount.accessToken}`,
        },
        params: {
          'user.fields': 'description,location,url,public_metrics,profile_image_url',
          max_results: 100,
        },
      });

      if (response.data.data) {
        for (const user of response.data.data) {
          contacts.push({
            platformId: user.id,
            username: user.username,
            fullName: user.name,
            bio: user.description,
            location: user.location,
            website: user.url,
            profileUrl: `https://twitter.com/${user.username}`,
            avatarUrl: user.profile_image_url,
            followerCount: user.public_metrics?.followers_count,
          });
        }
      }
    } catch (error: any) {
      logger.error('Twitter import failed:', error);
      // Return empty array on error, but log it
    }

    return contacts;
  }

  /**
   * Import contacts from LinkedIn
   */
  private async importFromLinkedIn(
    socialAccount: any,
    importType: string
  ): Promise<SocialContact[]> {
    const contacts: SocialContact[] = [];

    try {
      // LinkedIn API endpoint
      const response = await axios.get('https://api.linkedin.com/v2/connections', {
        headers: {
          Authorization: `Bearer ${socialAccount.accessToken}`,
        },
        params: {
          count: 100,
        },
      });

      if (response.data.elements) {
        for (const connection of response.data.elements) {
          // Fetch additional profile info
          try {
            const profileResponse = await axios.get(
              `https://api.linkedin.com/v2/people/${connection.id}`,
              {
                headers: {
                  Authorization: `Bearer ${socialAccount.accessToken}`,
                },
              }
            );

            const profile = profileResponse.data;

            contacts.push({
              platformId: connection.id,
              username: profile.vanityName || connection.id,
              fullName: `${profile.firstName?.localized?.en_US} ${profile.lastName?.localized?.en_US}`,
              bio: profile.headline?.localized?.en_US,
              location: profile.location?.name,
              profileUrl: `https://www.linkedin.com/in/${profile.vanityName || connection.id}`,
            });
          } catch (error) {
            logger.warn(`Failed to fetch LinkedIn profile ${connection.id}`);
          }
        }
      }
    } catch (error: any) {
      logger.error('LinkedIn import failed:', error);
    }

    return contacts;
  }

  /**
   * Import contacts from Instagram
   */
  private async importFromInstagram(
    socialAccount: any,
    importType: string
  ): Promise<SocialContact[]> {
    const contacts: SocialContact[] = [];

    try {
      // Instagram Graph API
      const endpoint =
        importType === 'followers'
          ? `https://graph.instagram.com/me/followers`
          : `https://graph.instagram.com/me/following`;

      const response = await axios.get(endpoint, {
        params: {
          access_token: socialAccount.accessToken,
          fields: 'id,username,name,profile_picture_url',
          limit: 100,
        },
      });

      if (response.data.data) {
        for (const user of response.data.data) {
          contacts.push({
            platformId: user.id,
            username: user.username,
            fullName: user.name,
            profileUrl: `https://www.instagram.com/${user.username}`,
            avatarUrl: user.profile_picture_url,
          });
        }
      }
    } catch (error: any) {
      logger.error('Instagram import failed:', error);
    }

    return contacts;
  }

  /**
   * Import contacts from Facebook
   */
  private async importFromFacebook(
    socialAccount: any,
    importType: string
  ): Promise<SocialContact[]> {
    const contacts: SocialContact[] = [];

    try {
      // Facebook Graph API - friends endpoint
      const response = await axios.get(`https://graph.facebook.com/v18.0/me/friends`, {
        params: {
          access_token: socialAccount.accessToken,
          fields: 'id,name,email,location,website,picture',
          limit: 100,
        },
      });

      if (response.data.data) {
        for (const friend of response.data.data) {
          contacts.push({
            platformId: friend.id,
            username: friend.id,
            fullName: friend.name,
            email: friend.email,
            location: friend.location?.name,
            website: friend.website,
            profileUrl: `https://www.facebook.com/${friend.id}`,
            avatarUrl: friend.picture?.data?.url,
          });
        }
      }
    } catch (error: any) {
      logger.error('Facebook import failed:', error);
    }

    return contacts;
  }

  /**
   * Save social contacts to database
   */
  private async saveContacts(
    userId: string,
    platform: Platform,
    socialContacts: SocialContact[]
  ): Promise<{ imported: number; skipped: number; errors: string[] }> {
    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const socialContact of socialContacts) {
      try {
        // Skip if no email and platform requires it for contact
        if (!socialContact.email && platform !== 'TWITTER') {
          // For platforms without email access, we'll generate a placeholder
          socialContact.email = `${socialContact.username}@${platform.toLowerCase()}.placeholder`;
        }

        if (!socialContact.email) {
          skipped++;
          continue;
        }

        // Check if contact already exists
        const existing = await prisma.contact.findUnique({
          where: {
            userId_email: {
              userId,
              email: socialContact.email.toLowerCase(),
            },
          },
        });

        if (existing) {
          // Update existing contact with social data
          await prisma.contact.update({
            where: { id: existing.id },
            data: {
              fullName: socialContact.fullName || existing.fullName,
              location: socialContact.location || existing.location,
              website: socialContact.website || existing.website,
              profileData: {
                ...(existing.profileData as any),
                [platform.toLowerCase()]: {
                  platformId: socialContact.platformId,
                  username: socialContact.username,
                  bio: socialContact.bio,
                  followerCount: socialContact.followerCount,
                  profileUrl: socialContact.profileUrl,
                  avatarUrl: socialContact.avatarUrl,
                  recentPosts: socialContact.recentPosts,
                  interests: socialContact.interests,
                },
              },
            },
          });
          skipped++;
          continue;
        }

        // Create new contact
        await prisma.contact.create({
          data: {
            userId,
            email: socialContact.email.toLowerCase(),
            fullName: socialContact.fullName,
            location: socialContact.location,
            website: socialContact.website,
            source: 'SOCIAL_MEDIA',
            sourceId: socialContact.platformId,
            profileData: {
              [platform.toLowerCase()]: {
                platformId: socialContact.platformId,
                username: socialContact.username,
                bio: socialContact.bio,
                followerCount: socialContact.followerCount,
                profileUrl: socialContact.profileUrl,
                avatarUrl: socialContact.avatarUrl,
                recentPosts: socialContact.recentPosts,
                interests: socialContact.interests,
              },
            },
          },
        });

        imported++;
      } catch (error: any) {
        errors.push(`Failed to save contact ${socialContact.username}: ${error.message}`);
        logger.error(`Failed to save social contact:`, error);
      }
    }

    return { imported, skipped, errors };
  }

  /**
   * Extract email addresses from social media engagement
   * (from comments, mentions, messages, etc.)
   */
  async extractContactsFromEngagement(
    userId: string,
    socialAccountId: string,
    postIds?: string[]
  ): Promise<{ imported: number; skipped: number }> {
    try {
      const socialAccount = await prisma.socialAccount.findFirst({
        where: { id: socialAccountId, userId },
      });

      if (!socialAccount) {
        throw new Error('Social account not found');
      }

      // Get posts with high engagement
      const posts = await prisma.post.findMany({
        where: {
          userId,
          socialAccountId,
          ...(postIds ? { id: { in: postIds } } : {}),
        },
        include: {
          autoReplies: true,
        },
        orderBy: {
          publishedAt: 'desc',
        },
        take: 50,
      });

      logger.info(`Extracting contacts from ${posts.length} posts`);

      // This is a simplified implementation
      // In a real scenario, you'd fetch comments, mentions, etc. from each platform
      return { imported: 0, skipped: 0 };
    } catch (error) {
      logger.error('Failed to extract contacts from engagement:', error);
      throw error;
    }
  }
}

export const socialImportService = new SocialImportService();
