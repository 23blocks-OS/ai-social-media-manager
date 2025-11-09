import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { prisma } from '../index';
import { PostStatus } from '@prisma/client';
import SocialMediaManager from '../services/social';
import { decrypt } from '../utils/encryption';

const router = Router();
const socialMediaManager = new SocialMediaManager();

// Get all posts
router.get(
  '/',
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    const { status, platform, limit = 50, offset = 0 } = req.query;

    const posts = await prisma.post.findMany({
      where: {
        userId: req.user!.id,
        ...(status && { status: status as PostStatus }),
        ...(platform && { platform: platform as any })
      },
      include: {
        socialAccount: {
          select: {
            platform: true,
            username: true,
            displayName: true,
            avatar: true
          }
        },
        analytics: {
          orderBy: { recordedAt: 'desc' },
          take: 1
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: Number(limit),
      skip: Number(offset)
    });

    res.json({
      success: true,
      data: posts
    });
  })
);

// Create a new post (draft or schedule)
router.post(
  '/',
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    const {
      socialAccountId,
      content,
      mediaUrls,
      scheduledFor,
      publishNow,
      aiPrompt
    } = req.body;

    // Verify social account belongs to user
    const account = await prisma.socialAccount.findFirst({
      where: {
        id: socialAccountId,
        userId: req.user!.id
      }
    });

    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Social account not found'
      });
    }

    const status = publishNow
      ? PostStatus.PUBLISHING
      : scheduledFor
      ? PostStatus.SCHEDULED
      : PostStatus.DRAFT;

    const post = await prisma.post.create({
      data: {
        userId: req.user!.id,
        socialAccountId,
        platform: account.platform,
        content,
        mediaUrls: mediaUrls || [],
        status,
        scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
        aiPrompt
      },
      include: {
        socialAccount: {
          select: {
            platform: true,
            username: true
          }
        }
      }
    });

    // Publish immediately if requested
    if (publishNow) {
      try {
        const service = socialMediaManager.getService(account.platform);
        const accessToken = decrypt(account.accessToken);
        const accessSecret = account.refreshToken ? decrypt(account.refreshToken) : null;

        const result = await service.publish(accessToken, accessSecret, {
          content,
          mediaUrls,
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
        } else {
          await prisma.post.update({
            where: { id: post.id },
            data: {
              status: PostStatus.FAILED,
              metadata: { error: result.error }
            }
          });
        }
      } catch (error: any) {
        await prisma.post.update({
          where: { id: post.id },
          data: {
            status: PostStatus.FAILED,
            metadata: { error: error.message }
          }
        });
      }
    }

    res.status(201).json({
      success: true,
      data: post
    });
  })
);

// Update a post
router.patch(
  '/:id',
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    const { content, mediaUrls, scheduledFor, status } = req.body;

    const post = await prisma.post.update({
      where: {
        id: req.params.id,
        userId: req.user!.id
      },
      data: {
        ...(content && { content }),
        ...(mediaUrls && { mediaUrls }),
        ...(scheduledFor && { scheduledFor: new Date(scheduledFor) }),
        ...(status && { status })
      }
    });

    res.json({
      success: true,
      data: post
    });
  })
);

// Delete a post
router.delete(
  '/:id',
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    const post = await prisma.post.findUnique({
      where: {
        id: req.params.id,
        userId: req.user!.id
      },
      include: { socialAccount: true }
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Delete from platform if published
    if (post.status === PostStatus.PUBLISHED && post.platformPostId) {
      try {
        const service = socialMediaManager.getService(post.platform);
        const accessToken = decrypt(post.socialAccount.accessToken);
        const accessSecret = post.socialAccount.refreshToken
          ? decrypt(post.socialAccount.refreshToken)
          : null;

        await service.delete(accessToken, accessSecret, post.platformPostId);
      } catch (error) {
        // Log but don't fail - still delete from our database
      }
    }

    await prisma.post.delete({
      where: { id: req.params.id }
    });

    res.json({
      success: true,
      message: 'Post deleted'
    });
  })
);

// Get post analytics
router.get(
  '/:id/analytics',
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    const analytics = await prisma.analytics.findMany({
      where: {
        post: {
          id: req.params.id,
          userId: req.user!.id
        }
      },
      orderBy: { recordedAt: 'desc' }
    });

    res.json({
      success: true,
      data: analytics
    });
  })
);

export default router;
