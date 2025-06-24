import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthController } from '../controllers/authController';
import { UserService } from '../services/userService';
import { AppError } from '../middleware/errorHandler';
import { UserRole } from '../types';

// Mock the UserService
jest.mock('../services/userService');
jest.mock('jsonwebtoken');

describe('AuthController', () => {
  let authController: AuthController;
  let mockUserService: jest.Mocked<UserService>;
  let mockRequest: Partial<Request> & { user?: any };
  let mockResponse: Partial<Response>;
  let mockNext: jest.MockedFunction<NextFunction>;

  beforeEach(() => {
    authController = new AuthController();
    mockUserService = UserService.prototype as jest.Mocked<UserService>;
    
    mockRequest = {
      body: {},
      user: undefined
    };
    
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    
    mockNext = jest.fn();
    
    jest.clearAllMocks();
    
    // Set up default JWT_SECRET for tests
    process.env.JWT_SECRET = 'test-secret';
    process.env.JWT_EXPIRES_IN = '24h';
  });

  describe('login', () => {
    const mockUser = {
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

    it('should login successfully with valid credentials', async () => {
      mockRequest.body = { email: 'test@example.com', password: 'password123' };
      mockUserService.findByEmail.mockResolvedValue(mockUser);
      mockUserService.verifyPassword.mockResolvedValue(true);
      (jwt.sign as jest.Mock).mockReturnValue('mock-token');

      await authController.login(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockUserService.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(mockUserService.verifyPassword).toHaveBeenCalledWith('password123', 'hashedpassword');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Login successful',
        data: {
          token: 'mock-token',
          user: {
            id: 1,
            email: 'test@example.com',
            username: 'testuser',
            firstName: 'Test',
            lastName: 'User',
            role: UserRole.EMPLOYEE,
            isActive: true,
            createdAt: mockUser.createdAt,
            updatedAt: mockUser.updatedAt
          },
          expiresIn: '24h'
        },
        timestamp: expect.any(String)
      });
    });

    it('should throw error for invalid email', async () => {
      mockRequest.body = { email: 'invalid@example.com', password: 'password123' };
      mockUserService.findByEmail.mockResolvedValue(null);

      await authController.login(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = (mockNext as jest.Mock).mock.calls[0][0] as AppError;
      expect(error.message).toBe('Invalid credentials');
      expect(error.statusCode).toBe(401);
    });

    it('should throw error for invalid password', async () => {
      mockRequest.body = { email: 'test@example.com', password: 'wrongpassword' };
      mockUserService.findByEmail.mockResolvedValue(mockUser);
      mockUserService.verifyPassword.mockResolvedValue(false);

      await authController.login(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = (mockNext as jest.Mock).mock.calls[0][0] as AppError;
      expect(error.message).toBe('Invalid credentials');
      expect(error.statusCode).toBe(401);
    });

    it('should throw error when JWT_SECRET is not configured', async () => {
      delete process.env.JWT_SECRET;
      mockRequest.body = { email: 'test@example.com', password: 'password123' };
      mockUserService.findByEmail.mockResolvedValue(mockUser);
      mockUserService.verifyPassword.mockResolvedValue(true);

      await authController.login(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = (mockNext as jest.Mock).mock.calls[0][0] as AppError;
      expect(error.message).toBe('JWT secret not configured');
      expect(error.statusCode).toBe(500);
    });
  });

  describe('register', () => {
    const userData = {
      email: 'new@example.com',
      username: 'newuser',
      password: 'password123',
      firstName: 'New',
      lastName: 'User',
      role: UserRole.EMPLOYEE
    };

    const mockCreatedUser = {
      id: 1,
      ...userData,
      password: 'hashedpassword',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    it('should register user successfully', async () => {
      mockRequest.body = userData;
      mockUserService.findByEmail.mockResolvedValue(null);
      mockUserService.findByUsername.mockResolvedValue(null);
      mockUserService.create.mockResolvedValue(mockCreatedUser);

      await authController.register(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockUserService.findByEmail).toHaveBeenCalledWith(userData.email);
      expect(mockUserService.findByUsername).toHaveBeenCalledWith(userData.username);
      expect(mockUserService.create).toHaveBeenCalledWith(userData);
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'User registered successfully',
        data: {
          id: mockCreatedUser.id,
          email: mockCreatedUser.email,
          username: mockCreatedUser.username
        },
        timestamp: expect.any(String)
      });
    });

    it('should throw error for duplicate email', async () => {
      mockRequest.body = userData;
      mockUserService.findByEmail.mockResolvedValue(mockCreatedUser);

      await authController.register(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = (mockNext as jest.Mock).mock.calls[0][0] as AppError;
      expect(error.message).toBe('User with this email already exists');
      expect(error.statusCode).toBe(409);
    });

    it('should throw error for duplicate username', async () => {
      mockRequest.body = userData;
      mockUserService.findByEmail.mockResolvedValue(null);
      mockUserService.findByUsername.mockResolvedValue(mockCreatedUser);

      await authController.register(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = (mockNext as jest.Mock).mock.calls[0][0] as AppError;
      expect(error.message).toBe('Username already taken');
      expect(error.statusCode).toBe(409);
    });
  });

  describe('getProfile', () => {
    const mockUser = {
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

    it('should get user profile successfully', async () => {
      mockRequest.user = { 
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
      mockUserService.findById.mockResolvedValue(mockUser);

      await authController.getProfile(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockUserService.findById).toHaveBeenCalledWith(1);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Profile retrieved successfully',
        data: mockUser,
        timestamp: expect.any(String)
      });
    });

    it('should throw error when user not authenticated', async () => {
      mockRequest.user = undefined;

      await authController.getProfile(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = (mockNext as jest.Mock).mock.calls[0][0] as AppError;
      expect(error.message).toBe('User not authenticated');
      expect(error.statusCode).toBe(401);
    });

    it('should throw error when user not found', async () => {
      mockRequest.user = { 
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

      await authController.getProfile(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = (mockNext as jest.Mock).mock.calls[0][0] as AppError;
      expect(error.message).toBe('User not found');
      expect(error.statusCode).toBe(404);
    });
  });

  describe('refreshToken', () => {
    const mockUser = { 
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

    it('should refresh token successfully', async () => {
      mockRequest.user = mockUser;
      (jwt.sign as jest.Mock).mockReturnValue('new-token');

      await authController.refreshToken(mockRequest as Request, mockResponse as Response, mockNext);

      expect(jwt.sign).toHaveBeenCalledWith(
        { user: mockUser },
        'test-secret',
        { expiresIn: '24h' }
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Token refreshed successfully',
        data: { token: 'new-token', expiresIn: '24h' },
        timestamp: expect.any(String)
      });
    });

    it('should throw error when user not authenticated', async () => {
      mockRequest.user = undefined;

      await authController.refreshToken(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = (mockNext as jest.Mock).mock.calls[0][0] as AppError;
      expect(error.message).toBe('User not authenticated');
      expect(error.statusCode).toBe(401);
    });

    it('should throw error when JWT_SECRET is not configured', async () => {
      delete process.env.JWT_SECRET;
      mockRequest.user = mockUser;

      await authController.refreshToken(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = (mockNext as jest.Mock).mock.calls[0][0] as AppError;
      expect(error.message).toBe('JWT secret not configured');
      expect(error.statusCode).toBe(500);
    });
  });
});
