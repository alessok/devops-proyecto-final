import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { validate } from '../validation/validator';
import { loginSchema, registerSchema } from '../validation/schemas';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const authController = new AuthController();

// Public routes
router.post('/login', validate(loginSchema), authController.login.bind(authController));
router.post('/register', validate(registerSchema), authController.register.bind(authController));

// Protected routes
router.get('/profile', authenticateToken, authController.getProfile.bind(authController));
router.post('/refresh', authenticateToken, authController.refreshToken.bind(authController));
router.post('/logout', authController.logout.bind(authController));

export default router;
