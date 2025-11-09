import { Request, Response, NextFunction } from 'express';
import { UsageService } from '../services/usage';
import { logger } from '../utils/logger';

/**
 * Middleware to check if user can perform an action based on their plan limits
 */
export const checkUsageLimit = (
  action: 'createPost' | 'schedulePost' | 'publishPost' | 'aiGenerate' | 'addSocialAccount'
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const result = await UsageService.canPerformAction(userId, action);

      if (!result.allowed) {
        return res.status(403).json({
          error: 'Usage limit exceeded',
          message: result.reason,
          limit: result.limit,
          current: result.current,
          upgradeRequired: true,
        });
      }

      next();
    } catch (error) {
      logger.error('Error in usage limit check:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  };
};

/**
 * Middleware to check if user has access to a premium feature
 */
export const requireFeature = (
  feature:
    | 'advancedAI'
    | 'analytics'
    | 'autoReplies'
    | 'customBranding'
    | 'apiAccess'
    | 'prioritySupport'
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const hasAccess = await UsageService.hasFeatureAccess(userId, feature);

      if (!hasAccess) {
        return res.status(403).json({
          error: 'Feature not available',
          message: `This feature requires a premium plan`,
          feature,
          upgradeRequired: true,
        });
      }

      next();
    } catch (error) {
      logger.error('Error in feature check:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  };
};

/**
 * Middleware to check if user has an active subscription
 */
export const requireActiveSubscription = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const plan = await UsageService.getUserPlan(userId);

    if (!plan || plan.tier === 'FREE') {
      return res.status(403).json({
        error: 'Subscription required',
        message: 'This feature requires an active subscription',
        upgradeRequired: true,
      });
    }

    next();
  } catch (error) {
    logger.error('Error in subscription check:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Middleware to check if user is an admin
 */
export const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;

    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Admin access required',
      });
    }

    next();
  } catch (error) {
    logger.error('Error in admin check:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
