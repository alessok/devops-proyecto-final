import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../types';
import { AppError } from './errorHandler';

interface AuthenticatedRequest extends Request {
  user?: Omit<User, 'password'>;
}

export const authenticateToken = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    throw new AppError('Access token required', 401);
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;
    req.user = decoded.user;
    next();
  } catch (error) {
    throw new AppError('Invalid or expired token', 401);
  }
};

export const authorizeRoles = (...roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    console.log('authorizeRoles middleware called');
    console.log('Required roles:', roles);
    console.log('User from request:', req.user);
    
    if (!req.user) {
      console.log('No user in request');
      throw new AppError('Authentication required', 401);
    }

    console.log('User role:', req.user.role);
    console.log('Role check result:', roles.includes(req.user.role));
    
    if (!roles.includes(req.user.role)) {
      console.log('Insufficient permissions - user role:', req.user.role, 'required roles:', roles);
      throw new AppError('Insufficient permissions', 403);
    }

    console.log('Authorization successful');
    next();
  };
};
