import { Router, Request, RequestHandler } from 'express';
import { UserService } from '../services/userService';
import { validate, validateQuery } from '../validation/validator';
import { updateUserSchema, paginationSchema } from '../validation/schemas';
import { authenticateToken, authorizeRoles } from '../middleware/auth';
import { ApiResponse, User } from '../types';
import { AppError } from '../middleware/errorHandler';

interface AuthenticatedRequest extends Request {
  user?: Omit<User, 'password'>;
}

function createUsersRouter(userServiceParam?: UserService) {
  const router = Router();
  const userService = userServiceParam || new UserService();

  // All routes require authentication
  router.use(authenticateToken);

  // GET all users (admin only)
  router.get('/',
    authorizeRoles('admin'),
    validateQuery(paginationSchema),
    async (req, res, next) => {
      try {
        const { page = 1, limit = 10 } = req.query as { page?: string; limit?: string };
        const { users, total } = await userService.findAll(Number(page), Number(limit));

        const response: ApiResponse = {
          success: true,
          message: 'Users retrieved successfully',
          data: {
            users,
            pagination: {
              currentPage: Number(page),
              totalPages: Math.ceil(total / Number(limit)),
              total: total
            }
          },
          timestamp: new Date().toISOString()
        };

        res.status(200).json(response);
      } catch (error) {
        next(error);
      }
    }
  );

  // GET user by ID (admin or own profile)
  router.get('/:id', (async (req: AuthenticatedRequest, res, next) => {
    try {
      const { id } = req.params;
      if (!id) {
        throw new AppError('User ID is required', 400);
      }

      const requesterId = req.user?.id;

      // Allow users to view their own profile or admins to view any profile
      if (!req.user || (req.user.role !== 'admin' && parseInt(id) !== requesterId)) {
        throw new AppError('Insufficient permissions', 403);
      }

      const user = await userService.findById(parseInt(id));
      if (!user) {
        throw new AppError('User not found', 404);
      }
      const response: ApiResponse = {
        success: true,
        message: 'User retrieved successfully',
        data: user,
        timestamp: new Date().toISOString()
      };

      res.status(200).json(response);
      return;
    } catch (error) {
      next(error);
      return;
    }
  }) as RequestHandler);

  // UPDATE user (admin or own profile)
  router.put('/:id',
    validate(updateUserSchema),
    (async (req: AuthenticatedRequest, res, next) => {
      try {
        const { id } = req.params;
        if (!id) {
          throw new AppError('User ID is required', 400);
        }

        const requesterId = req.user?.id;
        const userData = req.body;

        // Allow users to update their own profile or admins to update any profile
        if (!req.user || (req.user.role !== 'admin' && parseInt(id) !== requesterId)) {
          throw new AppError('Insufficient permissions', 403);
        }

        // Only admins can change roles
        if (userData.role && req.user.role !== 'admin') {
          throw new AppError('Only administrators can change user roles', 403);
        }

        const user = await userService.findById(parseInt(id));
        if (!user) {
          throw new AppError('User not found', 404);
        }

        const updatedUser = await userService.update(parseInt(id), userData);

        const response: ApiResponse = {
          success: true,
          message: 'User updated successfully',
          data: updatedUser,
          timestamp: new Date().toISOString()
        };

        res.status(200).json(response);
        return;
      } catch (error) {
        next(error);
        return;
      }
    }) as RequestHandler
  );

  // DELETE user (admin only)
  router.delete('/:id',
    authorizeRoles('admin'),
    async (req, res, next) => {
      try {
        const { id } = req.params;
        if (!id) {
          throw new AppError('User ID is required', 400);
        }

        const user = await userService.findById(parseInt(id));
        if (!user) {
          throw new AppError('User not found', 404);
        }

        await userService.delete(parseInt(id));

        const response: ApiResponse = {
          success: true,
          message: 'User deleted successfully',
          timestamp: new Date().toISOString()
        };

        res.status(200).json(response);
      } catch (error) {
        next(error);
      }
    }
  );

  return router;
}

export default createUsersRouter;
