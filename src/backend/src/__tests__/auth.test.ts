import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authenticateToken, authorizeRoles } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { UserRole } from '../types';

// Mock jwt
jest.mock('jsonwebtoken');
jest.mock('../middleware/errorHandler');

describe('Auth Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;
  const mockJwt = jwt as jest.Mocked<typeof jwt>;

  beforeEach(() => {
    mockReq = {
      headers: {},
      user: undefined
    };
    mockRes = {};
    mockNext = jest.fn();
    jest.clearAllMocks();
    
    // Set up environment variable
    process.env.JWT_SECRET = 'test-secret';
  });

  afterEach(() => {
    delete process.env.JWT_SECRET;
  });

  describe('authenticateToken', () => {
    it('should authenticate valid token successfully', () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        role: UserRole.EMPLOYEE,
        isActive: true
      };

      mockReq.headers = {
        authorization: 'Bearer valid-token'
      };

      mockJwt.verify.mockImplementation(() => ({ user: mockUser }));

      authenticateToken(mockReq as Request, mockRes as Response, mockNext);

      expect(jwt.verify).toHaveBeenCalledWith('valid-token', 'test-secret');
      expect(mockReq.user).toEqual(mockUser);
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should use fallback secret when JWT_SECRET not set', () => {
      delete process.env.JWT_SECRET;
      
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        role: UserRole.EMPLOYEE
      };

      mockReq.headers = {
        authorization: 'Bearer valid-token'
      };

      mockJwt.verify.mockImplementation(() => ({ user: mockUser }));

      authenticateToken(mockReq as Request, mockRes as Response, mockNext);

      expect(jwt.verify).toHaveBeenCalledWith('valid-token', 'fallback-secret');
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should throw error when no authorization header', () => {
      mockReq.headers = {};

      expect(() => {
        authenticateToken(mockReq as Request, mockRes as Response, mockNext);
      }).toThrow(AppError);

      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should throw error when no token in authorization header', () => {
      mockReq.headers = {
        authorization: 'Bearer'
      };

      expect(() => {
        authenticateToken(mockReq as Request, mockRes as Response, mockNext);
      }).toThrow(AppError);

      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should throw error when authorization header has wrong format', () => {
      mockReq.headers = {
        authorization: 'InvalidFormat'  // Without the second part after space
      };

      expect(() => {
        authenticateToken(mockReq as Request, mockRes as Response, mockNext);
      }).toThrow(AppError);

      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should throw error when token is invalid', () => {
      mockReq.headers = {
        authorization: 'Bearer invalid-token'
      };

      mockJwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      expect(() => {
        authenticateToken(mockReq as Request, mockRes as Response, mockNext);
      }).toThrow(AppError);

      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should throw error when token is expired', () => {
      mockReq.headers = {
        authorization: 'Bearer expired-token'
      };

      mockJwt.verify.mockImplementation(() => {
        throw new Error('Token expired');
      });

      expect(() => {
        authenticateToken(mockReq as Request, mockRes as Response, mockNext);
      }).toThrow(AppError);

      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('authorizeRoles', () => {
    it('should authorize user with correct role', () => {
      mockReq.user = {
        id: 1,
        email: 'admin@example.com',
        username: 'admin',
        firstName: 'Admin',
        lastName: 'User',
        role: UserRole.ADMIN,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const middleware = authorizeRoles(UserRole.ADMIN, UserRole.MANAGER);
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should authorize user with one of multiple allowed roles', () => {
      mockReq.user = {
        id: 1,
        email: 'manager@example.com',
        username: 'manager',
        firstName: 'Manager',
        lastName: 'User',
        role: UserRole.MANAGER,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const middleware = authorizeRoles(UserRole.ADMIN, UserRole.MANAGER);
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should throw error when user not authenticated', () => {
      mockReq.user = undefined;

      const middleware = authorizeRoles(UserRole.ADMIN);

      expect(() => {
        middleware(mockReq as Request, mockRes as Response, mockNext);
      }).toThrow(AppError);

      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should throw error when user has insufficient permissions', () => {
      mockReq.user = {
        id: 1,
        email: 'employee@example.com',
        username: 'employee',
        firstName: 'Employee',
        lastName: 'User',
        role: UserRole.EMPLOYEE,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const middleware = authorizeRoles(UserRole.ADMIN, UserRole.MANAGER);

      expect(() => {
        middleware(mockReq as Request, mockRes as Response, mockNext);
      }).toThrow(AppError);

      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should work with single role authorization', () => {
      mockReq.user = {
        id: 1,
        email: 'admin@example.com',
        username: 'admin',
        firstName: 'Admin',
        lastName: 'User',
        role: UserRole.ADMIN,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const middleware = authorizeRoles(UserRole.ADMIN);
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });
  });
});
