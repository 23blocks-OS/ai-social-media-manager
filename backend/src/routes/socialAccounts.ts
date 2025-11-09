import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { prisma } from '../index';
import { encrypt, decrypt } from '../utils/encryption';
import { Platform } from '@prisma/client';

const router = Router();

// Get all social accounts for user
router.get(
  '/',
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    const accounts = await prisma.socialAccount.findMany({
      where: { userId: req.user!.id },
      select: {
        id: true,
        platform: true,
        username: true,
        displayName: true,
        avatar: true,
        isActive: true,
        createdAt: true
      }
    });

    res.json({
      success: true,
      data: accounts
    });
  })
);

// Add a new social account
router.post(
  '/',
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    const {
      platform,
      platformId,
      username,
      displayName,
      avatar,
      accessToken,
      refreshToken,
      expiresAt,
      metadata
    } = req.body;

    // Encrypt tokens before storing
    const encryptedAccessToken = encrypt(accessToken);
    const encryptedRefreshToken = refreshToken ? encrypt(refreshToken) : null;

    const account = await prisma.socialAccount.create({
      data: {
        userId: req.user!.id,
        platform: platform as Platform,
        platformId,
        username,
        displayName,
        avatar,
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        metadata
      },
      select: {
        id: true,
        platform: true,
        username: true,
        displayName: true,
        avatar: true,
        isActive: true,
        createdAt: true
      }
    });

    res.status(201).json({
      success: true,
      data: account
    });
  })
);

// Delete a social account
router.delete(
  '/:id',
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    await prisma.socialAccount.delete({
      where: {
        id: req.params.id,
        userId: req.user!.id
      }
    });

    res.json({
      success: true,
      message: 'Social account deleted'
    });
  })
);

// Toggle account active status
router.patch(
  '/:id/toggle',
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    const account = await prisma.socialAccount.findUnique({
      where: {
        id: req.params.id,
        userId: req.user!.id
      }
    });

    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Account not found'
      });
    }

    const updated = await prisma.socialAccount.update({
      where: { id: req.params.id },
      data: { isActive: !account.isActive },
      select: {
        id: true,
        platform: true,
        username: true,
        isActive: true
      }
    });

    res.json({
      success: true,
      data: updated
    });
  })
);

export default router;
