import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export class UsageService {
  /**
   * Get current month string
   */
  private static getCurrentMonth(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  /**
   * Get or create usage metrics for current month
   */
  static async getUsageMetrics(userId: string): Promise<any> {
    const month = this.getCurrentMonth();

    let metrics = await prisma.usageMetrics.findUnique({
      where: {
        userId_month: {
          userId,
          month,
        },
      },
    });

    if (!metrics) {
      metrics = await prisma.usageMetrics.create({
        data: {
          userId,
          month,
          postsCreated: 0,
          postsScheduled: 0,
          postsPublished: 0,
          aiGenerations: 0,
          socialAccountsUsed: 0,
          mediaStorageBytes: BigInt(0),
        },
      });
    }

    return metrics;
  }

  /**
   * Get user's subscription plan
   */
  static async getUserPlan(userId: string): Promise<any> {
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId,
        status: {
          in: ['TRIAL', 'ACTIVE'],
        },
      },
      include: {
        plan: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // If no active subscription, return free plan
    if (!subscription) {
      const freePlan = await prisma.subscriptionPlan.findUnique({
        where: { tier: 'FREE' },
      });
      return freePlan;
    }

    return subscription.plan;
  }

  /**
   * Check if user can perform an action based on limits
   */
  static async canPerformAction(
    userId: string,
    action: 'createPost' | 'schedulePost' | 'publishPost' | 'aiGenerate' | 'addSocialAccount'
  ): Promise<{ allowed: boolean; reason?: string; limit?: number; current?: number }> {
    try {
      const [plan, metrics] = await Promise.all([
        this.getUserPlan(userId),
        this.getUsageMetrics(userId),
      ]);

      if (!plan) {
        return { allowed: false, reason: 'No subscription plan found' };
      }

      switch (action) {
        case 'createPost':
        case 'schedulePost':
        case 'publishPost':
          const totalPosts = metrics.postsCreated + metrics.postsScheduled + metrics.postsPublished;
          if (totalPosts >= plan.maxPostsPerMonth) {
            return {
              allowed: false,
              reason: 'Monthly post limit reached',
              limit: plan.maxPostsPerMonth,
              current: totalPosts,
            };
          }
          break;

        case 'addSocialAccount':
          const accountCount = await prisma.socialAccount.count({
            where: { userId, isActive: true },
          });
          if (accountCount >= plan.maxSocialAccounts) {
            return {
              allowed: false,
              reason: 'Social account limit reached',
              limit: plan.maxSocialAccounts,
              current: accountCount,
            };
          }
          break;

        case 'aiGenerate':
          // For now, we'll track but not limit AI generations
          // You can add limits here if needed
          break;
      }

      return { allowed: true };
    } catch (error) {
      logger.error('Error checking action permissions:', error);
      return { allowed: false, reason: 'Error checking permissions' };
    }
  }

  /**
   * Track post creation
   */
  static async trackPostCreated(userId: string): Promise<void> {
    const month = this.getCurrentMonth();

    await prisma.usageMetrics.upsert({
      where: {
        userId_month: {
          userId,
          month,
        },
      },
      update: {
        postsCreated: {
          increment: 1,
        },
      },
      create: {
        userId,
        month,
        postsCreated: 1,
      },
    });

    logger.info(`Tracked post creation for user ${userId}`);
  }

  /**
   * Track post scheduled
   */
  static async trackPostScheduled(userId: string): Promise<void> {
    const month = this.getCurrentMonth();

    await prisma.usageMetrics.upsert({
      where: {
        userId_month: {
          userId,
          month,
        },
      },
      update: {
        postsScheduled: {
          increment: 1,
        },
      },
      create: {
        userId,
        month,
        postsScheduled: 1,
      },
    });

    logger.info(`Tracked post scheduled for user ${userId}`);
  }

  /**
   * Track post published
   */
  static async trackPostPublished(userId: string): Promise<void> {
    const month = this.getCurrentMonth();

    await prisma.usageMetrics.upsert({
      where: {
        userId_month: {
          userId,
          month,
        },
      },
      update: {
        postsPublished: {
          increment: 1,
        },
      },
      create: {
        userId,
        month,
        postsPublished: 1,
      },
    });

    logger.info(`Tracked post published for user ${userId}`);
  }

  /**
   * Track AI generation
   */
  static async trackAIGeneration(userId: string): Promise<void> {
    const month = this.getCurrentMonth();

    await prisma.usageMetrics.upsert({
      where: {
        userId_month: {
          userId,
          month,
        },
      },
      update: {
        aiGenerations: {
          increment: 1,
        },
      },
      create: {
        userId,
        month,
        aiGenerations: 1,
      },
    });

    logger.info(`Tracked AI generation for user ${userId}`);
  }

  /**
   * Track social account usage
   */
  static async trackSocialAccountUsed(userId: string): Promise<void> {
    const month = this.getCurrentMonth();
    const activeAccounts = await prisma.socialAccount.count({
      where: { userId, isActive: true },
    });

    await prisma.usageMetrics.upsert({
      where: {
        userId_month: {
          userId,
          month,
        },
      },
      update: {
        socialAccountsUsed: activeAccounts,
      },
      create: {
        userId,
        month,
        socialAccountsUsed: activeAccounts,
      },
    });

    logger.info(`Updated social account count for user ${userId}: ${activeAccounts}`);
  }

  /**
   * Get usage summary with limits
   */
  static async getUsageSummary(userId: string): Promise<any> {
    const [plan, metrics] = await Promise.all([
      this.getUserPlan(userId),
      this.getUsageMetrics(userId),
    ]);

    const totalPosts = metrics.postsCreated + metrics.postsScheduled + metrics.postsPublished;
    const activeAccounts = await prisma.socialAccount.count({
      where: { userId, isActive: true },
    });

    return {
      plan: {
        name: plan.name,
        tier: plan.tier,
        maxPostsPerMonth: plan.maxPostsPerMonth,
        maxSocialAccounts: plan.maxSocialAccounts,
        maxBrandProfiles: plan.maxBrandProfiles,
        features: {
          advancedAI: plan.advancedAI,
          analytics: plan.analytics,
          autoReplies: plan.autoReplies,
          customBranding: plan.customBranding,
          apiAccess: plan.apiAccess,
          prioritySupport: plan.prioritySupport,
        },
      },
      usage: {
        posts: {
          current: totalPosts,
          limit: plan.maxPostsPerMonth,
          percentage: (totalPosts / plan.maxPostsPerMonth) * 100,
        },
        socialAccounts: {
          current: activeAccounts,
          limit: plan.maxSocialAccounts,
          percentage: (activeAccounts / plan.maxSocialAccounts) * 100,
        },
        aiGenerations: {
          current: metrics.aiGenerations,
        },
        breakdown: {
          postsCreated: metrics.postsCreated,
          postsScheduled: metrics.postsScheduled,
          postsPublished: metrics.postsPublished,
        },
      },
      month: metrics.month,
      resetDate: this.getNextResetDate(),
    };
  }

  /**
   * Get next usage reset date (first day of next month)
   */
  private static getNextResetDate(): Date {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return nextMonth;
  }

  /**
   * Check if user has access to a feature
   */
  static async hasFeatureAccess(
    userId: string,
    feature:
      | 'advancedAI'
      | 'analytics'
      | 'autoReplies'
      | 'customBranding'
      | 'apiAccess'
      | 'prioritySupport'
  ): Promise<boolean> {
    const plan = await this.getUserPlan(userId);
    return plan?.[feature] || false;
  }

  /**
   * Reset monthly usage (should be run by cron job)
   */
  static async resetMonthlyUsage(): Promise<void> {
    const lastMonth = this.getPreviousMonth();

    // Archive last month's metrics if needed
    // For now, we just create new metrics when accessed

    logger.info(`Monthly usage reset completed for ${lastMonth}`);
  }

  /**
   * Get previous month string
   */
  private static getPreviousMonth(): string {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}`;
  }
}
