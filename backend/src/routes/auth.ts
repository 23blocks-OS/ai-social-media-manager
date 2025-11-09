import { Router } from 'express';
import { body } from 'express-validator';
import { asyncHandler } from '../middleware/errorHandler';
import AuthService from '../services/auth';

const router = Router();
const authService = new AuthService();

// Register
router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
    body('name').optional().trim()
  ],
  asyncHandler(async (req, res) => {
    const { email, password, name } = req.body;
    const result = await authService.register(email, password, name);

    res.status(201).json({
      success: true,
      data: result
    });
  })
);

// Login
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty()
  ],
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const result = await authService.login(email, password);

    res.json({
      success: true,
      data: result
    });
  })
);

// Refresh token
router.post(
  '/refresh',
  [body('refreshToken').notEmpty()],
  asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;
    const result = await authService.refreshAccessToken(refreshToken);

    res.json({
      success: true,
      data: result
    });
  })
);

// Logout
router.post(
  '/logout',
  [body('refreshToken').notEmpty()],
  asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;
    await authService.logout(refreshToken);

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  })
);

export default router;
