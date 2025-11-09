import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { prisma } from '../index';

const router = Router();

// Get current user
router.get(
  '/me',
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        role: true,
        createdAt: true
      }
    });

    res.json({
      success: true,
      data: user
    });
  })
);

// Update user profile
router.patch(
  '/me',
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    const { name, avatar } = req.body;

    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        ...(name && { name }),
        ...(avatar && { avatar })
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        role: true
      }
    });

    res.json({
      success: true,
      data: user
    });
  })
);

export default router;
