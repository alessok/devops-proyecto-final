import request from 'supertest';
import app from '../index';
import { UserService } from '../services/userService';
import { UserRole } from '../types';
import jwt from 'jsonwebtoken';

// Mock the UserService
jest.mock('../services/userService');

describe('Auth Controller', () => {
  let mockUserService: jest.Mocked<UserService>;

  beforeAll(() => {
    mockUserService = new UserService() as jest.Mocked<UserService>;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/v1/auth/login', () => {
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

      mockUserService.findByEmail.mockResolvedValue(mockUser);
      mockUserService.verifyPassword.mockResolvedValue(true);

      const loginData = {
        email: 'test@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(loginData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user.email).toBe(mockUser.email);
      expect(response.body.data.user.password).toBeUndefined();
    });

    it('should return 401 for invalid email', async () => {
      mockUserService.findByEmail.mockResolvedValue(null);

      const loginData = {
        email: 'nonexistent@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(loginData);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid credentials');
    });

    it('should return 401 for invalid password', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        password: 'hashedpassword',
        // ... other properties
      };

      mockUserService.findByEmail.mockResolvedValue(mockUser as any);
      mockUserService.verifyPassword.mockResolvedValue(false);

      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(loginData);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid credentials');
    });

    it('should return 400 for invalid request data', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'invalid-email' }); // Missing password and invalid email

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Validation error');
    });
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register user successfully', async () => {
      const mockCreatedUser = {
        id: 1,
        email: 'new@example.com',
        username: 'newuser',
        firstName: 'New',
        lastName: 'User',
        role: UserRole.EMPLOYEE,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockUserService.findByEmail.mockResolvedValue(null);
      mockUserService.findByUsername.mockResolvedValue(null);
      mockUserService.create.mockResolvedValue(mockCreatedUser as any);

      const registerData = {
        email: 'new@example.com',
        username: 'newuser',
        password: 'password123',
        firstName: 'New',
        lastName: 'User'
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(registerData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe(registerData.email);
      expect(response.body.data.username).toBe(registerData.username);
    });

    it('should return 409 for existing email', async () => {
      const existingUser = {
        id: 1,
        email: 'existing@example.com',
        // ... other properties
      };

      mockUserService.findByEmail.mockResolvedValue(existingUser as any);

      const registerData = {
        email: 'existing@example.com',
        username: 'newuser',
        password: 'password123',
        firstName: 'New',
        lastName: 'User'
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(registerData);

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('User with this email already exists');
    });

    it('should return 409 for existing username', async () => {
      const existingUser = {
        id: 1,
        username: 'existinguser',
        // ... other properties
      };

      mockUserService.findByEmail.mockResolvedValue(null);
      mockUserService.findByUsername.mockResolvedValue(existingUser as any);

      const registerData = {
        email: 'new@example.com',
        username: 'existinguser',
        password: 'password123',
        firstName: 'New',
        lastName: 'User'
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(registerData);

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Username already taken');
    });
  });

  describe('GET /api/v1/auth/profile', () => {
    it('should return user profile for authenticated user', async () => {
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

      mockUserService.findById.mockResolvedValue(mockUser as any);

      // Create a valid JWT token for testing
      const token = jwt.sign(
        { user: mockUser },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .get('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe(mockUser.email);
    });

    it('should return 401 for missing token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/profile');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Access token required');
    });

    it('should return 401 for invalid token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/profile')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid or expired token');
    });
  });
});
