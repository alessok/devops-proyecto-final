import { Request, Response, NextFunction } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import { UserService } from '../services/userService';
import { AppError } from '../middleware/errorHandler';
import { LoginRequest, LoginResponse, ApiResponse } from '../types';

const userService = new UserService();

export class AuthController {
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password }: LoginRequest = req.body;

      // Find user by email
      const user = await userService.findByEmail(email);
      if (!user) {
        throw new AppError('Invalid credentials', 401);
      }

      // Verify password
      const isValidPassword = await userService.verifyPassword(password, user.password);
      if (!isValidPassword) {
        throw new AppError('Invalid credentials', 401);
      }

      // Generate JWT token
      const expiresIn = process.env.JWT_EXPIRES_IN || '24h';
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        throw new AppError('JWT secret not configured', 500);
      }
      
      const token = jwt.sign(
        { 
          user: {
            id: user.id,
            email: user.email,
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role
          }
        },
        jwtSecret as string,
        { expiresIn: expiresIn as string } as SignOptions
      );

      // Remove password from user object
      const { password: _, ...userWithoutPassword } = user;

      const loginResponse: LoginResponse = {
        token,
        user: userWithoutPassword,
        expiresIn
      };

      const response: ApiResponse<LoginResponse> = {
        success: true,
        message: 'Login successful',
        data: loginResponse,
        timestamp: new Date().toISOString()
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userData = req.body;

      // Check if user already exists
      const existingUser = await userService.findByEmail(userData.email);
      if (existingUser) {
        throw new AppError('User with this email already exists', 409);
      }

      const existingUsername = await userService.findByUsername(userData.username);
      if (existingUsername) {
        throw new AppError('Username already taken', 409);
      }

      // Create new user
      const newUser = await userService.create(userData);

      const response: ApiResponse = {
        success: true,
        message: 'User registered successfully',
        data: { id: newUser.id, email: newUser.email, username: newUser.username },
        timestamp: new Date().toISOString()
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError('User not authenticated', 401);
      }

      const user = await userService.findById(req.user.id);
      if (!user) {
        throw new AppError('User not found', 404);
      }

      const response: ApiResponse = {
        success: true,
        message: 'Profile retrieved successfully',
        data: user,
        timestamp: new Date().toISOString()
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  async refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError('User not authenticated', 401);
      }

      const expiresIn = process.env.JWT_EXPIRES_IN || '24h';
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        throw new AppError('JWT secret not configured', 500);
      }
      
      const token = jwt.sign(
        { user: req.user },
        jwtSecret as string,
        { expiresIn: expiresIn as string } as SignOptions
      );

      const response: ApiResponse = {
        success: true,
        message: 'Token refreshed successfully',
        data: { token, expiresIn },
        timestamp: new Date().toISOString()
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
}
