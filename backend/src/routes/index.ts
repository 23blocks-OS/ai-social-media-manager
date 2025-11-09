import { Router } from 'express';
import authRoutes from './auth';
import userRoutes from './user';
import socialAccountRoutes from './socialAccounts';
import postRoutes from './posts';
import aiRoutes from './ai';
import analyticsRoutes from './analytics';
import brandProfileRoutes from './brandProfiles';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/social-accounts', socialAccountRoutes);
router.use('/posts', postRoutes);
router.use('/ai', aiRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/brand-profiles', brandProfileRoutes);

export default router;
