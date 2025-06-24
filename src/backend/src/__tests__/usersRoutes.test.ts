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

const MockedUserService = UserService as jest.MockedClass<typeof UserService>;

describe('Users Routes', () => {
  let mockUserService: jest.Mocked<UserService>;
  let app: Express;

  beforeEach(async () => {
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
    } as Partial<jest.Mocked<UserService>> as jest.Mocked<UserService>;
    MockedUserService.mockImplementation(() => mockUserService);
    // Nueva app y router en cada test
    const expressModule = await import('express');
    const expressApp = expressModule.default();
    expressApp.use(expressModule.json());
    const createUsersRouter = (await import('../routes/users')).default;
    expressApp.use('/api/users', createUsersRouter(mockUserService));
    const { errorHandler } = await import('../middleware/errorHandler');
    expressApp.use(errorHandler);
    app = expressApp;
  });

  describe('GET /api/users', () => {
    it('should get all users with pagination', async () => {
      const now = new Date();
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
          createdAt: now,
          updatedAt: now
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
          createdAt: now,
          updatedAt: now
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
          users: [
            expect.objectContaining({
              id: 1,
              username: 'user1',
              email: 'user1@example.com',
              password: 'hashed',
              firstName: 'User',
              lastName: 'One',
              role: UserRole.EMPLOYEE,
              isActive: true,
              createdAt: expect.any(String),
              updatedAt: expect.any(String)
            }),
            expect.objectContaining({
              id: 2,
              username: 'user2',
              email: 'user2@example.com',
              password: 'hashed',
              firstName: 'User',
              lastName: 'Two',
              role: UserRole.ADMIN,
              isActive: true,
              createdAt: expect.any(String),
              updatedAt: expect.any(String)
            })
          ],
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
      const now = new Date();
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashed',
        firstName: 'Test',
        lastName: 'User',
        role: UserRole.EMPLOYEE,
        isActive: true,
        createdAt: now,
        updatedAt: now
      };
      mockUserService.findById.mockResolvedValue(mockUser);

      const response = await request(app)
        .get('/api/users/1')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'User retrieved successfully',
        data: expect.objectContaining({
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
          password: 'hashed',
          firstName: 'Test',
          lastName: 'User',
          role: UserRole.EMPLOYEE,
          isActive: true,
          createdAt: expect.any(String),
          updatedAt: expect.any(String)
        })
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
      const now = new Date();
      const updatedUser = {
        id: 1,
        username: 'updateduser',
        email: 'updated@example.com',
        password: 'hashed',
        firstName: 'Test',
        lastName: 'User',
        role: UserRole.EMPLOYEE,
        isActive: true,
        createdAt: now,
        updatedAt: now
      };
      // Mock findById para que exista el usuario antes de actualizar
      mockUserService.findById.mockResolvedValue(updatedUser);
      mockUserService.update.mockResolvedValue(updatedUser);

      const response = await request(app)
        .put('/api/users/1')
        .send(updateData)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'User updated successfully',
        data: expect.objectContaining({
          id: 1,
          username: 'updateduser',
          email: 'updated@example.com',
          password: 'hashed',
          firstName: 'Test',
          lastName: 'User',
          role: UserRole.EMPLOYEE,
          isActive: true,
          createdAt: expect.any(String),
          updatedAt: expect.any(String)
        })
      });
      expect(mockUserService.update).toHaveBeenCalledWith(1, updateData);
    });

    it('should handle validation errors', async () => {
      const invalidData = { email: 'invalid-email' };
      // Simular error de validación: la ruta debe responder 400 y no llamar a update
      await request(app)
        .put('/api/users/1')
        .send(invalidData)
        .expect(400);
      expect(mockUserService.update).not.toHaveBeenCalled();
    });

    it('should handle user not found for update', async () => {
      const updateData = { username: 'updateduser' };
      mockUserService.findById.mockResolvedValue(null);
      // No se debe llamar a update si el usuario no existe
      await request(app)
        .put('/api/users/999')
        .send(updateData)
        .expect(404);
      expect(mockUserService.update).not.toHaveBeenCalled();
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('should delete user successfully', async () => {
      // Mock findById para que exista el usuario antes de eliminar
      const now = new Date();
      mockUserService.findById.mockResolvedValue({
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashed',
        firstName: 'Test',
        lastName: 'User',
        role: UserRole.EMPLOYEE,
        isActive: true,
        createdAt: now,
        updatedAt: now
      });
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
      mockUserService.findById.mockResolvedValue(null);
      mockUserService.delete.mockResolvedValue(false);

      await request(app)
        .delete('/api/users/999')
        .expect(404);
      // No se debe esperar que delete haya sido llamado
      expect(mockUserService.delete).not.toHaveBeenCalled();
    });
  });
});
