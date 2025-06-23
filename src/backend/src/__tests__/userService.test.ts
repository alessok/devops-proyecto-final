import { UserService } from '../services/userService';
import { UserRole } from '../types';
import bcrypt from 'bcryptjs';
import * as db from '../config/database';

// Mock the database module
jest.mock('../config/database');

describe('UserService', () => {
  let userService: UserService;

  beforeAll(() => {
    userService = new UserService();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('findById', () => {
    it('should return user when found', async () => {
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

      (db.pool.query as jest.Mock).mockResolvedValue({ rows: [mockUser] });

      const result = await userService.findById(1);

      expect(result).toEqual(mockUser);
      expect(db.pool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT id, email, username'),
        [1]
      );
    });

    it('should return null when user not found', async () => {
      (db.pool.query as jest.Mock).mockResolvedValue({ rows: [] });

      const result = await userService.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should return user when found', async () => {
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

      (db.pool.query as jest.Mock).mockResolvedValue({ rows: [mockUser] });

      const result = await userService.findByEmail('test@example.com');

      expect(result).toEqual(mockUser);
      expect(db.pool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT id, email, username, password'),
        ['test@example.com']
      );
    });
  });

  describe('findByUsername', () => {
    it('should return user when found', async () => {
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

      (db.pool.query as jest.Mock).mockResolvedValue({ rows: [mockUser] });

      const result = await userService.findByUsername('testuser');

      expect(result).toEqual(mockUser);
      expect(db.pool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT id, email, username'),
        ['testuser']
      );
    });

    it('should return null when username not found', async () => {
      (db.pool.query as jest.Mock).mockResolvedValue({ rows: [] });

      const result = await userService.findByUsername('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create user successfully', async () => {
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
        password: undefined, // Password should not be returned
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      (db.pool.query as jest.Mock).mockResolvedValue({ rows: [mockCreatedUser] });

      // Mock bcrypt.hash
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashedpassword' as never);

      const result = await userService.create(userData);

      expect(result).toEqual(mockCreatedUser);
      expect(bcrypt.hash).toHaveBeenCalledWith(userData.password, 12);
      expect(db.pool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO users'),
        expect.arrayContaining([
          userData.email,
          userData.username,
          'hashedpassword',
          userData.firstName,
          userData.lastName,
          userData.role
        ])
      );
    });
  });

  describe('update', () => {
    it('should update user successfully', async () => {
      const updateData = {
        firstName: 'Updated',
        lastName: 'Name'
      };

      const mockUpdatedUser = {
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
        firstName: 'Updated',
        lastName: 'Name',
        role: UserRole.EMPLOYEE,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      (db.pool.query as jest.Mock).mockResolvedValue({ rows: [mockUpdatedUser] });

      const result = await userService.update(1, updateData);

      expect(result).toEqual(mockUpdatedUser);
      expect(db.pool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE users SET'),
        expect.arrayContaining(['Updated', 'Name', 1])
      );
    });

    it('should return existing user when no fields to update', async () => {
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

      // Mock findById call
      (db.pool.query as jest.Mock).mockResolvedValue({ rows: [mockUser] });

      const result = await userService.update(1, {});

      expect(result).toEqual(mockUser);
    });
  });

  describe('delete', () => {
    it('should soft delete user successfully', async () => {
      (db.pool.query as jest.Mock).mockResolvedValue({ rowCount: 1 });

      const result = await userService.delete(1);

      expect(result).toBe(true);
      expect(db.pool.query).toHaveBeenCalledWith(
        'UPDATE users SET is_active = false, updated_at = NOW() WHERE id = $1',
        [1]
      );
    });

    it('should return false when user not found', async () => {
      (db.pool.query as jest.Mock).mockResolvedValue({ rowCount: 0 });

      const result = await userService.delete(999);

      expect(result).toBe(false);
    });
  });

  describe('verifyPassword', () => {
    it('should return true for correct password', async () => {
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

      const result = await userService.verifyPassword('password123', 'hashedpassword');

      expect(result).toBe(true);
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashedpassword');
    });

    it('should return false for incorrect password', async () => {
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

      const result = await userService.verifyPassword('wrongpassword', 'hashedpassword');

      expect(result).toBe(false);
    });
  });

  describe('findAll', () => {
    it('should return paginated users', async () => {
      const mockUsers = [
        {
          id: 1,
          email: 'user1@example.com',
          username: 'user1',
          firstName: 'User',
          lastName: 'One',
          role: UserRole.EMPLOYEE,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 2,
          email: 'user2@example.com',
          username: 'user2',
          firstName: 'User',
          lastName: 'Two',
          role: UserRole.MANAGER,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      // Mock count query
      (db.pool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ count: '2' }] })
        .mockResolvedValueOnce({ rows: mockUsers });

      const result = await userService.findAll(1, 10);

      expect(result.users).toEqual(mockUsers);
      expect(result.total).toBe(2);
      expect(db.pool.query).toHaveBeenCalledTimes(2);
    });
  });
});
