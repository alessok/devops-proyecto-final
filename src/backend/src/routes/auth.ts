import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { validate } from '../validation/validator';
import { loginSchema, registerSchema } from '../validation/schemas';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const authController = new AuthController();

// Public routes
router.post('/login', validate(loginSchema), (req, res, next) => {
  authController.login(req, res, next).catch(next);
});
router.post('/register', validate(registerSchema), (req, res, next) => {
  authController.register(req, res, next).catch(next);
});

// Protected routes
router.get('/profile', authenticateToken, (req, res, next) => {
  authController.getProfile(req, res, next).catch(next);
});
router.post('/refresh', authenticateToken, (req, res, next) => {
  authController.refreshToken(req, res, next).catch(next);
});
router.post('/logout', (req, res, next) => {
  authController.logout(req, res, next).catch(next);
});

export default router;
