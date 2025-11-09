import cron from 'node-cron';
import { prisma } from '../index';
import { PostStatus, Platform } from '@prisma/client';
import SocialMediaManager from './social';
import logger from '../utils/logger';
import { decrypt } from '../utils/encryption';

const socialMediaManager = new SocialMediaManager();

export const startScheduler = () => {
  // Check for scheduled posts every minute
  cron.schedule('* * * * *', async () => {
    try {
      await processScheduledPosts();
    } catch (error) {
      logger.error('Scheduler error:', error);
    }
  });

  // Sync analytics every 15 minutes
  cron.schedule('*/15 * * * *', async () => {
    try {
      await syncAnalytics();
    } catch (error) {
      logger.error('Analytics sync error:', error);
    }
  });

  // Clean up old refresh tokens daily
  cron.schedule('0 0 * * *', async () => {
    try {
      await cleanupExpiredTokens();
    } catch (error) {
      logger.error('Token cleanup error:', error);
    }
  });
};

async function processScheduledPosts() {
  const now = new Date();

  const scheduledPosts = await prisma.post.findMany({
    where: {
      status: PostStatus.SCHEDULED,
      scheduledFor: {
        lte: now
      }
    },
    include: {
      socialAccount: true
    }
  });

  logger.info(`Processing ${scheduledPosts.length} scheduled posts`);

  for (const post of scheduledPosts) {
    try {
      // Update status to publishing
      await prisma.post.update({
        where: { id: post.id },
        data: { status: PostStatus.PUBLISHING }
      });

      // Get social media service
      const service = socialMediaManager.getService(post.platform);

      // Decrypt access token
      const accessToken = decrypt(post.socialAccount.accessToken);
      const accessSecret = post.socialAccount.refreshToken
        ? decrypt(post.socialAccount.refreshToken)
        : null;

      // Publish post
      const result = await service.publish(accessToken, accessSecret, {
        content: post.content,
        mediaUrls: post.mediaUrls,
        metadata: post.metadata
      });

      if (result.success) {
        await prisma.post.update({
          where: { id: post.id },
          data: {
            status: PostStatus.PUBLISHED,
            publishedAt: new Date(),
            platformPostId: result.platformPostId
          }
        });

        logger.info(`Published post ${post.id} to ${post.platform}`);
      } else {
        await prisma.post.update({
          where: { id: post.id },
          data: {
            status: PostStatus.FAILED,
            metadata: {
              ...post.metadata,
              error: result.error
            }
          }
        });

        logger.error(`Failed to publish post ${post.id}: ${result.error}`);
      }
    } catch (error: any) {
      logger.error(`Error processing post ${post.id}:`, error);

      await prisma.post.update({
        where: { id: post.id },
        data: {
          status: PostStatus.FAILED,
          metadata: {
            ...post.metadata,
            error: error.message
          }
        }
      });
    }
  }
}

async function syncAnalytics() {
  const publishedPosts = await prisma.post.findMany({
    where: {
      status: PostStatus.PUBLISHED,
      platformPostId: { not: null }
    },
    include: {
      socialAccount: true
    },
    take: 100 // Process 100 posts at a time
  });

  for (const post of publishedPosts) {
    try {
      const service = socialMediaManager.getService(post.platform);
      const accessToken = decrypt(post.socialAccount.accessToken);
      const accessSecret = post.socialAccount.refreshToken
        ? decrypt(post.socialAccount.refreshToken)
        : null;

      const metrics = await service.getMetrics(
        accessToken,
        accessSecret,
        post.platformPostId!
      );

      if (metrics) {
        await prisma.analytics.create({
          data: {
            postId: post.id,
            likes: metrics.likes,
            comments: metrics.comments,
            shares: metrics.shares,
            views: metrics.views,
            engagement: (metrics.likes + metrics.comments + metrics.shares) / Math.max(metrics.views, 1),
            reach: metrics.views
          }
        });
      }
    } catch (error) {
      logger.error(`Error syncing analytics for post ${post.id}:`, error);
    }
  }

  logger.info(`Synced analytics for ${publishedPosts.length} posts`);
}

async function cleanupExpiredTokens() {
  const result = await prisma.refreshToken.deleteMany({
    where: {
      expiresAt: {
        lt: new Date()
      }
    }
  });

  logger.info(`Cleaned up ${result.count} expired refresh tokens`);
}
