import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import AIService from '../services/ai';

const router = Router();

// Generate content with AI
router.post(
  '/generate',
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    const { prompt, provider, temperature, maxTokens, systemPrompt } = req.body;

    const aiService = new AIService(provider);
    const content = await aiService.generateContent(prompt, {
      temperature,
      maxTokens,
      systemPrompt
    });

    res.json({
      success: true,
      data: { content }
    });
  })
);

// Improve content with AI
router.post(
  '/improve',
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    const { content, instructions, provider } = req.body;

    const aiService = new AIService(provider);
    const improved = await aiService.improveContent(content, instructions);

    res.json({
      success: true,
      data: { content: improved }
    });
  })
);

// Generate hashtags
router.post(
  '/hashtags',
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    const { content, provider } = req.body;

    const aiService = new AIService(provider);
    const hashtags = await aiService.generateHashtags(content);

    res.json({
      success: true,
      data: { hashtags }
    });
  })
);

// Analyze sentiment
router.post(
  '/sentiment',
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    const { text, provider } = req.body;

    const aiService = new AIService(provider);
    const analysis = await aiService.analyzeSentiment(text);

    res.json({
      success: true,
      data: analysis
    });
  })
);

// Generate reply
router.post(
  '/reply',
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    const { commentText, postContext, provider } = req.body;

    const aiService = new AIService(provider);
    const reply = await aiService.generateReply(commentText, postContext);

    res.json({
      success: true,
      data: { reply }
    });
  })
);

export default router;
