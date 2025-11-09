import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { prisma } from '../index';
import { body } from 'express-validator';

const router = Router();

// Get all brand profiles for user
router.get(
  '/',
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    const profiles = await prisma.brandProfile.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: profiles
    });
  })
);

// Get active brand profile
router.get(
  '/active',
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    const profile = await prisma.brandProfile.findFirst({
      where: {
        userId: req.user!.id,
        isActive: true
      }
    });

    res.json({
      success: true,
      data: profile
    });
  })
);

// Get single brand profile
router.get(
  '/:id',
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    const profile = await prisma.brandProfile.findFirst({
      where: {
        id: req.params.id,
        userId: req.user!.id
      }
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Brand profile not found'
      });
    }

    res.json({
      success: true,
      data: profile
    });
  })
);

// Create brand profile
router.post(
  '/',
  authenticate,
  [
    body('name').notEmpty().trim(),
  ],
  asyncHandler(async (req: AuthRequest, res) => {
    const {
      name,
      tagline,
      description,
      brandVoice,
      toneAttributes,
      writingStyle,
      targetAudience,
      audienceDemographics,
      mission,
      vision,
      values,
      primaryColor,
      secondaryColor,
      accentColor,
      logoUrl,
      brandAssets,
      keywords,
      hashtags,
      dosList,
      dontsList,
      examplePosts,
      contentThemes,
      styleGuideUrl,
      competitorUrls,
      additionalNotes,
      isActive
    } = req.body;

    // If setting as active, deactivate others
    if (isActive) {
      await prisma.brandProfile.updateMany({
        where: { userId: req.user!.id },
        data: { isActive: false }
      });
    }

    const profile = await prisma.brandProfile.create({
      data: {
        userId: req.user!.id,
        name,
        tagline,
        description,
        brandVoice,
        toneAttributes,
        writingStyle,
        targetAudience,
        audienceDemographics,
        mission,
        vision,
        values: values || [],
        primaryColor,
        secondaryColor,
        accentColor,
        logoUrl,
        brandAssets: brandAssets || [],
        keywords: keywords || [],
        hashtags: hashtags || [],
        dosList: dosList || [],
        dontsList: dontsList || [],
        examplePosts,
        contentThemes: contentThemes || [],
        styleGuideUrl,
        competitorUrls: competitorUrls || [],
        additionalNotes,
        isActive: isActive || false
      }
    });

    res.status(201).json({
      success: true,
      data: profile
    });
  })
);

// Update brand profile
router.patch(
  '/:id',
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    const { isActive, ...updateData } = req.body;

    // Verify ownership
    const existing = await prisma.brandProfile.findFirst({
      where: {
        id: req.params.id,
        userId: req.user!.id
      }
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Brand profile not found'
      });
    }

    // If setting as active, deactivate others
    if (isActive && !existing.isActive) {
      await prisma.brandProfile.updateMany({
        where: { userId: req.user!.id },
        data: { isActive: false }
      });
    }

    const profile = await prisma.brandProfile.update({
      where: { id: req.params.id },
      data: {
        ...updateData,
        ...(isActive !== undefined && { isActive })
      }
    });

    res.json({
      success: true,
      data: profile
    });
  })
);

// Set brand profile as active
router.patch(
  '/:id/activate',
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    // Verify ownership
    const existing = await prisma.brandProfile.findFirst({
      where: {
        id: req.params.id,
        userId: req.user!.id
      }
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Brand profile not found'
      });
    }

    // Deactivate all others
    await prisma.brandProfile.updateMany({
      where: { userId: req.user!.id },
      data: { isActive: false }
    });

    // Activate this one
    const profile = await prisma.brandProfile.update({
      where: { id: req.params.id },
      data: { isActive: true }
    });

    res.json({
      success: true,
      data: profile
    });
  })
);

// Delete brand profile
router.delete(
  '/:id',
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    await prisma.brandProfile.delete({
      where: {
        id: req.params.id,
        userId: req.user!.id
      }
    });

    res.json({
      success: true,
      message: 'Brand profile deleted'
    });
  })
);

export default router;
