import request from 'supertest';
import { Express } from 'express';
import { UserService } from '../services/userService';
import { UserRole } from '../types';

// Mock the UserService
jest.mock('../services/userService');

// Mock authentication middleware
jest.mock('../middleware/auth', () => ({
  authenticateToken: (req: any, res: any, next: any) => {
    req.user = { id: 1, role: UserRole.ADMIN };
    next();
  },
  authorizeRoles: (...roles: any[]) => (req: any, res: any, next: any) => {
    if (req.user.role === UserRole.ADMIN || roles.includes(req.user.role)) {
      next();
    } else {
      res.status(403).json({ success: false, message: 'Forbidden' });
    }
  }
}));

// Create an Express app for testing
import express from 'express';
import usersRouter from '../routes/users';
import { errorHandler } from '../middleware/errorHandler';

const app: Express = express();
app.use(express.json());
app.use('/api/users', usersRouter);
app.use(errorHandler);

const MockedUserService = UserService as jest.MockedClass<typeof UserService>;

describe('Users Routes', () => {
  let mockUserService: jest.Mocked<UserService>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUserService = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findByUsername: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      verifyPassword: jest.fn()
    } as any;

    MockedUserService.mockImplementation(() => mockUserService);
  });

  describe('GET /api/users', () => {
    it('should get all users with pagination', async () => {
      const mockUsers = [
        {
          id: 1,
          username: 'user1',
          email: 'user1@example.com',
          password: 'hashed',
          firstName: 'User',
          lastName: 'One',
          role: UserRole.EMPLOYEE,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 2,
          username: 'user2',
          email: 'user2@example.com',
          password: 'hashed',
          firstName: 'User',
          lastName: 'Two',
          role: UserRole.ADMIN,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      mockUserService.findAll.mockResolvedValue({ users: mockUsers, total: 2 });

      const response = await request(app)
        .get('/api/users?page=1&limit=10')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Users retrieved successfully',
        data: {
          users: mockUsers,
          pagination: {
            currentPage: 1,
            totalPages: 1,
            total: 2
          }
        }
      });
      expect(mockUserService.findAll).toHaveBeenCalledWith(1, 10);
    });

    it('should handle invalid pagination parameters', async () => {
      await request(app)
        .get('/api/users?page=-1&limit=0')
        .expect(400);

      expect(mockUserService.findAll).not.toHaveBeenCalled();
    });
  });

  describe('GET /api/users/:id', () => {
    it('should get user by id successfully', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashed',
        firstName: 'Test',
        lastName: 'User',
        role: UserRole.EMPLOYEE,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockUserService.findById.mockResolvedValue(mockUser);

      const response = await request(app)
        .get('/api/users/1')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'User retrieved successfully',
        data: mockUser
      });
      expect(mockUserService.findById).toHaveBeenCalledWith(1);
    });

    it('should handle user not found', async () => {
      mockUserService.findById.mockResolvedValue(null);

      await request(app)
        .get('/api/users/999')
        .expect(404);

      expect(mockUserService.findById).toHaveBeenCalledWith(999);
    });
  });

  describe('PUT /api/users/:id', () => {
    it('should update user successfully', async () => {
      const updateData = { username: 'updateduser', email: 'updated@example.com' };
      const updatedUser = {
        id: 1,
        username: 'updateduser',
        email: 'updated@example.com',
        password: 'hashed',
        firstName: 'Test',
        lastName: 'User',
        role: UserRole.EMPLOYEE,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockUserService.update.mockResolvedValue(updatedUser);

      const response = await request(app)
        .put('/api/users/1')
        .send(updateData)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'User updated successfully',
        data: updatedUser
      });
      expect(mockUserService.update).toHaveBeenCalledWith(1, updateData);
    });

    it('should handle validation errors', async () => {
      const invalidData = { email: 'invalid-email' };

      await request(app)
        .put('/api/users/1')
        .send(invalidData)
        .expect(400);

      expect(mockUserService.update).not.toHaveBeenCalled();
    });

    it('should handle user not found for update', async () => {
      const updateData = { username: 'updateduser' };
      mockUserService.update.mockResolvedValue(null);

      await request(app)
        .put('/api/users/999')
        .send(updateData)
        .expect(404);

      expect(mockUserService.update).toHaveBeenCalledWith(999, updateData);
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('should delete user successfully', async () => {
      mockUserService.delete.mockResolvedValue(true);

      const response = await request(app)
        .delete('/api/users/1')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'User deleted successfully'
      });
      expect(mockUserService.delete).toHaveBeenCalledWith(1);
    });

    it('should handle user not found for deletion', async () => {
      mockUserService.delete.mockResolvedValue(false);

      await request(app)
        .delete('/api/users/999')
        .expect(404);

      expect(mockUserService.delete).toHaveBeenCalledWith(999);
    });
  });
});
