import { Request, Response, NextFunction } from 'express';
import { AuthController } from '../controllers/authController';
import { UserService } from '../services/userService';
import { AppError } from '../middleware/errorHandler';
import { UserRole } from '../types';
import jwt from 'jsonwebtoken';

// Mock dependencies
jest.mock('../services/userService');
jest.mock('jsonwebtoken');

const MockedUserService = UserService as jest.MockedClass<typeof UserService>;
const mockJwt = jwt as jest.Mocked<typeof jwt>;

describe('AuthController Edge Cases', () => {
  let authController: AuthController;
  let mockUserService: jest.Mocked<UserService>;
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: jest.MockedFunction<NextFunction>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUserService = {
      findByEmail: jest.fn(),
      create: jest.fn(),
      verifyPassword: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findAll: jest.fn(),
      findByUsername: jest.fn()
    } as any;
    
    MockedUserService.mockImplementation(() => mockUserService);
    authController = new AuthController();

    mockReq = {
      body: {},
      user: undefined
    };
    
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    
    mockNext = jest.fn();

    // Set up environment variables
    process.env.JWT_SECRET = 'test-secret';
    process.env.JWT_EXPIRES_IN = '24h';
  });

  afterEach(() => {
    delete process.env.JWT_SECRET;
    delete process.env.JWT_EXPIRES_IN;
  });

  describe('register edge cases', () => {
    it('should handle missing JWT_SECRET in register', async () => {
      delete process.env.JWT_SECRET;
      
      mockReq.body = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User'
      };

      mockUserService.findByEmail.mockResolvedValue(null);
      mockUserService.findByUsername.mockResolvedValue(null);
      mockUserService.create.mockResolvedValue({
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
        password: 'hashedpassword',
        firstName: 'Test',
        lastName: 'User',
        role: UserRole.EMPLOYEE,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      await authController.register(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = (mockNext as jest.Mock).mock.calls[0][0] as AppError;
      expect(error.message).toBe('JWT secret not configured');
      expect(error.statusCode).toBe(500);
    });

    it('should handle user creation failure', async () => {
      mockReq.body = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User'
      };

      mockUserService.findByEmail.mockResolvedValue(null);
      mockUserService.findByUsername.mockResolvedValue(null);
      
      const error = new Error('Database error');
      mockUserService.create.mockRejectedValue(error);

      await authController.register(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should handle JWT signing error in register', async () => {
      mockReq.body = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User'
      };

      mockUserService.findByEmail.mockResolvedValue(null);
      mockUserService.findByUsername.mockResolvedValue(null);
      mockUserService.create.mockResolvedValue({
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
        password: 'hashedpassword',
        firstName: 'Test',
        lastName: 'User',
        role: UserRole.EMPLOYEE,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const jwtError = new Error('JWT signing failed');
      mockJwt.sign.mockImplementation(() => {
        throw jwtError;
      });

      await authController.register(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('login edge cases', () => {
    it('should handle user not found', async () => {
      mockReq.body = {
        email: 'nonexistent@example.com',
        password: 'password123'
      };

      mockUserService.findByEmail.mockResolvedValue(null);

      await authController.login(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = (mockNext as jest.Mock).mock.calls[0][0] as AppError;
      expect(error.message).toBe('Invalid credentials');
      expect(error.statusCode).toBe(401);
    });

    it('should handle inactive user', async () => {
      mockReq.body = {
        email: 'inactive@example.com',
        password: 'password123'
      };

      const inactiveUser = {
        id: 1,
        email: 'inactive@example.com',
        username: 'inactive',
        password: 'hashedpassword',
        firstName: 'Inactive',
        lastName: 'User',
        role: UserRole.EMPLOYEE,
        isActive: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockUserService.findByEmail.mockResolvedValue(inactiveUser);

      await authController.login(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = (mockNext as jest.Mock).mock.calls[0][0] as AppError;
      expect(error.message).toBe('Invalid credentials');
      expect(error.statusCode).toBe(401);
    });

    it('should handle password verification failure', async () => {
      mockReq.body = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      const user = {
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
        password: 'hashedpassword',
        firstName: 'Test',
        lastName: 'User',
        role: UserRole.EMPLOYEE,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockUserService.findByEmail.mockResolvedValue(user);
      mockUserService.verifyPassword.mockResolvedValue(false);

      await authController.login(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = (mockNext as jest.Mock).mock.calls[0][0] as AppError;
      expect(error.message).toBe('Invalid credentials');
      expect(error.statusCode).toBe(401);
    });

    it('should handle JWT signing error in login', async () => {
      mockReq.body = {
        email: 'test@example.com',
        password: 'password123'
      };

      const user = {
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
        password: 'hashedpassword',
        firstName: 'Test',
        lastName: 'User',
        role: UserRole.EMPLOYEE,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockUserService.findByEmail.mockResolvedValue(user);
      mockUserService.verifyPassword.mockResolvedValue(true);

      const jwtError = new Error('JWT signing failed');
      mockJwt.sign.mockImplementation(() => {
        throw jwtError;
      });

      await authController.login(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('getProfile edge cases', () => {
    it('should handle missing user in request', async () => {
      mockReq.user = undefined;

      await authController.getProfile(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = (mockNext as jest.Mock).mock.calls[0][0] as AppError;
      expect(error.message).toBe('User not authenticated');
      expect(error.statusCode).toBe(401);
    });

    it('should handle user not found in database', async () => {
      mockReq.user = {
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        role: UserRole.EMPLOYEE,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      mockUserService.findById.mockResolvedValue(null);

      await authController.getProfile(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = (mockNext as jest.Mock).mock.calls[0][0] as AppError;
      expect(error.message).toBe('User not found');
      expect(error.statusCode).toBe(404);
    });

    it('should handle database error in getProfile', async () => {
      mockReq.user = {
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        role: UserRole.EMPLOYEE,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const dbError = new Error('Database connection failed');
      mockUserService.findById.mockRejectedValue(dbError);

      await authController.getProfile(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('refreshToken edge cases', () => {
    it('should handle missing user in refresh token', async () => {
      mockReq.user = undefined;

      await authController.refreshToken(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = (mockNext as jest.Mock).mock.calls[0][0] as AppError;
      expect(error.message).toBe('User not authenticated');
      expect(error.statusCode).toBe(401);
    });

    it('should handle JWT signing error in refresh token', async () => {
      mockReq.user = {
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        role: UserRole.EMPLOYEE,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const jwtError = new Error('JWT signing failed');
      mockJwt.sign.mockImplementation(() => {
        throw jwtError;
      });

      await authController.refreshToken(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(jwtError);
    });
  });

  describe('logout edge cases', () => {
    it('should handle logout without errors', async () => {
      await authController.logout(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Logged out successfully'
        })
      );
    });

    it('should handle unexpected error in logout', async () => {
      // Mock res.json to throw an error
      mockRes.json = jest.fn().mockImplementation(() => {
        throw new Error('Response error');
      });

      await authController.logout(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});