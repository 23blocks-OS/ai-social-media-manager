import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { prisma } from '../index';

const router = Router();

// Get analytics summary
router.get(
  '/summary',
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    const { startDate, endDate, platform } = req.query;

    const where: any = {
      post: {
        userId: req.user!.id,
        ...(platform && { platform: platform as any })
      }
    };

    if (startDate && endDate) {
      where.recordedAt = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string)
      };
    }

    const analytics = await prisma.analytics.findMany({
      where,
      include: {
        post: {
          select: {
            platform: true
          }
        }
      }
    });

    // Calculate totals
    const summary = {
      totalPosts: new Set(analytics.map(a => a.postId)).size,
      totalLikes: analytics.reduce((sum, a) => sum + a.likes, 0),
      totalComments: analytics.reduce((sum, a) => sum + a.comments, 0),
      totalShares: analytics.reduce((sum, a) => sum + a.shares, 0),
      totalViews: analytics.reduce((sum, a) => sum + a.views, 0),
      avgEngagement: analytics.length > 0
        ? analytics.reduce((sum, a) => sum + a.engagement, 0) / analytics.length
        : 0,
      byPlatform: {} as any
    };

    // Group by platform
    for (const item of analytics) {
      const platform = item.post.platform;
      if (!summary.byPlatform[platform]) {
        summary.byPlatform[platform] = {
          likes: 0,
          comments: 0,
          shares: 0,
          views: 0,
          posts: new Set()
        };
      }
      summary.byPlatform[platform].likes += item.likes;
      summary.byPlatform[platform].comments += item.comments;
      summary.byPlatform[platform].shares += item.shares;
      summary.byPlatform[platform].views += item.views;
      summary.byPlatform[platform].posts.add(item.postId);
    }

    // Convert Sets to counts
    for (const platform in summary.byPlatform) {
      summary.byPlatform[platform].posts = summary.byPlatform[platform].posts.size;
    }

    res.json({
      success: true,
      data: summary
    });
  })
);

// Get top performing posts
router.get(
  '/top-posts',
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    const { limit = 10, metric = 'engagement' } = req.query;

    const posts = await prisma.post.findMany({
      where: {
        userId: req.user!.id,
        status: 'PUBLISHED'
      },
      include: {
        analytics: {
          orderBy: { recordedAt: 'desc' },
          take: 1
        },
        socialAccount: {
          select: {
            platform: true,
            username: true
          }
        }
      }
    });

    // Sort by metric
    const sorted = posts
      .filter(p => p.analytics.length > 0)
      .sort((a, b) => {
        const aMetric = a.analytics[0][metric as any] || 0;
        const bMetric = b.analytics[0][metric as any] || 0;
        return bMetric - aMetric;
      })
      .slice(0, Number(limit));

    res.json({
      success: true,
      data: sorted
    });
  })
);

// Get engagement over time
router.get(
  '/timeline',
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    const { startDate, endDate, platform, interval = 'day' } = req.query;

    const where: any = {
      post: {
        userId: req.user!.id,
        ...(platform && { platform: platform as any })
      }
    };

    if (startDate && endDate) {
      where.recordedAt = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string)
      };
    }

    const analytics = await prisma.analytics.findMany({
      where,
      orderBy: { recordedAt: 'asc' }
    });

    // Group by interval (simplified - just by day)
    const timeline = analytics.reduce((acc: any, item) => {
      const date = item.recordedAt.toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = {
          date,
          likes: 0,
          comments: 0,
          shares: 0,
          views: 0,
          engagement: 0,
          count: 0
        };
      }
      acc[date].likes += item.likes;
      acc[date].comments += item.comments;
      acc[date].shares += item.shares;
      acc[date].views += item.views;
      acc[date].engagement += item.engagement;
      acc[date].count += 1;
      return acc;
    }, {});

    // Calculate averages
    const result = Object.values(timeline).map((day: any) => ({
      ...day,
      avgEngagement: day.engagement / day.count
    }));

    res.json({
      success: true,
      data: result
    });
  })
);

export default router;
