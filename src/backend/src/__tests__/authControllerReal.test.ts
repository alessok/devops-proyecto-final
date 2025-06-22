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
const mockedJwt = jwt as jest.Mocked<typeof jwt>;

describe('AuthController', () => {
  let authController: AuthController;
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;
  let mockUserService: jest.Mocked<UserService>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mocks
    mockUserService = {
      findByEmail: jest.fn(),
      findByUsername: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      verifyPassword: jest.fn()
    } as any;

    MockedUserService.mockImplementation(() => mockUserService);

    // Create controller after setting up mocks
    authController = new AuthController();
    
    // Override the userService property directly to ensure mock is used
    (authController as any).userService = mockUserService;
    
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    
    mockReq = {
      body: {},
      user: undefined
    };
    
    mockRes = {
      status: mockStatus,
      json: mockJson
    };
    
    mockNext = jest.fn();

    // Mock environment variables
    process.env.JWT_SECRET = 'test-secret';
    process.env.JWT_EXPIRES_IN = '24h';
  });

  afterEach(() => {
    delete process.env.JWT_SECRET;
    delete process.env.JWT_EXPIRES_IN;
  });

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
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

      mockReq.body = {
        email: 'test@example.com',
        password: 'password123'
      };

      mockUserService.findByEmail.mockResolvedValue(mockUser);
      mockUserService.verifyPassword.mockResolvedValue(true);
      mockedJwt.sign.mockReturnValue('mock-token' as any);

      await authController.login(mockReq as Request, mockRes as Response, mockNext);

      expect(mockUserService.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(mockUserService.verifyPassword).toHaveBeenCalledWith('password123', 'hashedpassword');
      expect(mockedJwt.sign).toHaveBeenCalled();
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Login successful',
          data: expect.objectContaining({
            token: 'mock-token',
            user: expect.not.objectContaining({ password: expect.anything() })
          })
        })
      );
    });

    it('should throw error if user not found', async () => {
      mockReq.body = {
        email: 'notfound@example.com',
        password: 'password123'
      };

      mockUserService.findByEmail.mockResolvedValue(null);

      await authController.login(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Invalid credentials',
          statusCode: 401
        })
      );
    });

    it('should throw error if password is invalid', async () => {
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

      mockReq.body = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      mockUserService.findByEmail.mockResolvedValue(mockUser);
      mockUserService.verifyPassword.mockResolvedValue(false);

      await authController.login(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Invalid credentials',
          statusCode: 401
        })
      );
    });
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'newuser@example.com',
        username: 'newuser',
        password: 'password123',
        firstName: 'New',
        lastName: 'User'
      };

      const createdUser = {
        id: 1,
        ...userData,
        role: UserRole.EMPLOYEE,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockReq.body = userData;

      mockUserService.findByEmail.mockResolvedValue(null);
      mockUserService.findByUsername.mockResolvedValue(null);
      mockUserService.create.mockResolvedValue(createdUser);

      await authController.register(mockReq as Request, mockRes as Response, mockNext);

      expect(mockUserService.findByEmail).toHaveBeenCalledWith('newuser@example.com');
      expect(mockUserService.findByUsername).toHaveBeenCalledWith('newuser');
      expect(mockUserService.create).toHaveBeenCalledWith(userData);
      expect(mockStatus).toHaveBeenCalledWith(201);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'User registered successfully',
          data: {
            id: 1,
            email: 'newuser@example.com',
            username: 'newuser'
          }
        })
      );
    });
  });

  describe('getProfile', () => {
    it('should get user profile successfully', async () => {
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
      
      mockUserService.findById.mockResolvedValue(mockUser);

      await authController.getProfile(mockReq as Request, mockRes as Response, mockNext);

      expect(mockUserService.findById).toHaveBeenCalledWith(1);
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Profile retrieved successfully',
          data: mockUser
        })
      );
    });

    it('should throw error if user not authenticated', async () => {
      mockReq.user = undefined;

      await authController.getProfile(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'User not authenticated',
          statusCode: 401
        })
      );
    });
  });

  describe('refreshToken', () => {
    it('should refresh token successfully', async () => {
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

      mockReq.user = mockUser;
      mockedJwt.sign.mockReturnValue('new-mock-token' as any);

      await authController.refreshToken(mockReq as Request, mockRes as Response, mockNext);

      expect(mockedJwt.sign).toHaveBeenCalledWith(
        { user: mockUser },
        'test-secret',
        { expiresIn: '24h' }
      );
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Token refreshed successfully',
          data: {
            token: 'new-mock-token',
            expiresIn: '24h'
          }
        })
      );
    });

    it('should throw error if user not authenticated', async () => {
      mockReq.user = undefined;

      await authController.refreshToken(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'User not authenticated',
          statusCode: 401
        })
      );
    });
  });
});
