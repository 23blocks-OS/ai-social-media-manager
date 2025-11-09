import express from 'express';
import { body, param } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { StripeService } from '../services/stripe';
import { UsageService } from '../services/usage';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/featureGate';
import { validate } from '../middleware/validate';
import { logger } from '../utils/logger';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * Get all subscription plans
 */
router.get('/plans', async (req, res) => {
  try {
    const plans = await prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { price: 'asc' },
    });

    res.json(plans);
  } catch (error) {
    logger.error('Error fetching plans:', error);
    res.status(500).json({ error: 'Failed to fetch plans' });
  }
});

/**
 * Get current user's subscription
 */
router.get('/current', authenticate, async (req, res) => {
  try {
    const userId = (req as any).user.id;

    const subscription = await StripeService.getSubscription(userId);

    if (!subscription) {
      return res.json({ subscription: null });
    }

    res.json({ subscription });
  } catch (error) {
    logger.error('Error fetching subscription:', error);
    res.status(500).json({ error: 'Failed to fetch subscription' });
  }
});

/**
 * Get usage summary
 */
router.get('/usage', authenticate, async (req, res) => {
  try {
    const userId = (req as any).user.id;

    const summary = await UsageService.getUsageSummary(userId);

    res.json(summary);
  } catch (error) {
    logger.error('Error fetching usage:', error);
    res.status(500).json({ error: 'Failed to fetch usage' });
  }
});

/**
 * Create checkout session
 */
router.post(
  '/checkout',
  authenticate,
  [
    body('planId').isString().notEmpty(),
    body('successUrl').isURL(),
    body('cancelUrl').isURL(),
    validate,
  ],
  async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const { planId, successUrl, cancelUrl } = req.body;

      const session = await StripeService.createCheckoutSession(
        userId,
        planId,
        successUrl,
        cancelUrl,
        14 // 14 days trial
      );

      res.json({ sessionId: session.id, url: session.url });
    } catch (error) {
      logger.error('Error creating checkout session:', error);
      res.status(500).json({ error: 'Failed to create checkout session' });
    }
  }
);

/**
 * Create billing portal session
 */
router.post(
  '/billing-portal',
  authenticate,
  [body('returnUrl').isURL(), validate],
  async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const { returnUrl } = req.body;

      const session = await StripeService.createBillingPortalSession(userId, returnUrl);

      res.json({ url: session.url });
    } catch (error) {
      logger.error('Error creating billing portal session:', error);
      res.status(500).json({ error: 'Failed to create billing portal session' });
    }
  }
);

/**
 * Cancel subscription
 */
router.post(
  '/:id/cancel',
  authenticate,
  [param('id').isString(), validate],
  async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const subscriptionId = req.params.id;

      // Verify ownership
      const subscription = await prisma.subscription.findFirst({
        where: {
          id: subscriptionId,
          userId,
        },
      });

      if (!subscription) {
        return res.status(404).json({ error: 'Subscription not found' });
      }

      await StripeService.cancelSubscription(subscriptionId, true);

      res.json({ message: 'Subscription will be canceled at period end' });
    } catch (error) {
      logger.error('Error canceling subscription:', error);
      res.status(500).json({ error: 'Failed to cancel subscription' });
    }
  }
);

/**
 * Reactivate subscription (undo cancel)
 */
router.post(
  '/:id/reactivate',
  authenticate,
  [param('id').isString(), validate],
  async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const subscriptionId = req.params.id;

      // Verify ownership
      const subscription = await prisma.subscription.findFirst({
        where: {
          id: subscriptionId,
          userId,
        },
      });

      if (!subscription || !subscription.stripeSubscriptionId) {
        return res.status(404).json({ error: 'Subscription not found' });
      }

      // Reactivate in Stripe
      const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
      await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
        cancel_at_period_end: false,
      });

      // Update database
      await prisma.subscription.update({
        where: { id: subscriptionId },
        data: { cancelAtPeriodEnd: false },
      });

      res.json({ message: 'Subscription reactivated' });
    } catch (error) {
      logger.error('Error reactivating subscription:', error);
      res.status(500).json({ error: 'Failed to reactivate subscription' });
    }
  }
);

/**
 * Update subscription plan
 */
router.patch(
  '/:id/plan',
  authenticate,
  [param('id').isString(), body('newPlanId').isString(), validate],
  async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const subscriptionId = req.params.id;
      const { newPlanId } = req.body;

      // Verify ownership
      const subscription = await prisma.subscription.findFirst({
        where: {
          id: subscriptionId,
          userId,
        },
      });

      if (!subscription) {
        return res.status(404).json({ error: 'Subscription not found' });
      }

      await StripeService.updateSubscriptionPlan(subscriptionId, newPlanId);

      res.json({ message: 'Subscription plan updated' });
    } catch (error) {
      logger.error('Error updating subscription plan:', error);
      res.status(500).json({ error: 'Failed to update subscription plan' });
    }
  }
);

// Admin routes

/**
 * Get all subscriptions (admin only)
 */
router.get('/admin/all', authenticate, requireAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;

    const [subscriptions, total] = await Promise.all([
      prisma.subscription.findMany({
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
          plan: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.subscription.count(),
    ]);

    res.json({
      subscriptions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error('Error fetching all subscriptions:', error);
    res.status(500).json({ error: 'Failed to fetch subscriptions' });
  }
});

/**
 * Create or update subscription plan (admin only)
 */
router.post(
  '/admin/plans',
  authenticate,
  requireAdmin,
  [
    body('name').isString().notEmpty(),
    body('tier').isIn(['FREE', 'PRO', 'BUSINESS']),
    body('price').isInt({ min: 0 }),
    body('maxSocialAccounts').isInt({ min: 1 }),
    body('maxPostsPerMonth').isInt({ min: 1 }),
    validate,
  ],
  async (req, res) => {
    try {
      const planData = req.body;

      const plan = await prisma.subscriptionPlan.create({
        data: planData,
      });

      res.json(plan);
    } catch (error) {
      logger.error('Error creating plan:', error);
      res.status(500).json({ error: 'Failed to create plan' });
    }
  }
);

/**
 * Get subscription analytics (admin only)
 */
router.get('/admin/analytics', authenticate, requireAdmin, async (req, res) => {
  try {
    const [
      totalSubscriptions,
      activeSubscriptions,
      trialSubscriptions,
      canceledSubscriptions,
      revenue,
    ] = await Promise.all([
      prisma.subscription.count(),
      prisma.subscription.count({ where: { status: 'ACTIVE' } }),
      prisma.subscription.count({ where: { status: 'TRIAL' } }),
      prisma.subscription.count({ where: { status: 'CANCELED' } }),
      prisma.paymentHistory.aggregate({
        where: { status: 'succeeded' },
        _sum: { amount: true },
      }),
    ]);

    const planDistribution = await prisma.subscription.groupBy({
      by: ['planId'],
      _count: true,
      where: {
        status: {
          in: ['TRIAL', 'ACTIVE'],
        },
      },
    });

    res.json({
      totalSubscriptions,
      activeSubscriptions,
      trialSubscriptions,
      canceledSubscriptions,
      totalRevenue: revenue._sum.amount || 0,
      planDistribution,
    });
  } catch (error) {
    logger.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

export default router;
