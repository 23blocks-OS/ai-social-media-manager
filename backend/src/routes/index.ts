import { Router } from 'express';
import authRoutes from './auth';
import userRoutes from './user';
import socialAccountRoutes from './socialAccounts';
import postRoutes from './posts';
import aiRoutes from './ai';
import analyticsRoutes from './analytics';
import brandProfileRoutes from './brandProfiles';
import subscriptionRoutes from './subscriptions';
import webhookRoutes from './webhooks';
import contactRoutes from './contacts.routes';
import campaignRoutes from './campaigns.routes';

const router = Router();

// Webhook routes must come before body parsing middleware
router.use('/webhooks', webhookRoutes);

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/social-accounts', socialAccountRoutes);
router.use('/posts', postRoutes);
router.use('/ai', aiRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/brand-profiles', brandProfileRoutes);
router.use('/subscriptions', subscriptionRoutes);
router.use('/contacts', contactRoutes);
router.use('/campaigns', campaignRoutes);

export default router;
