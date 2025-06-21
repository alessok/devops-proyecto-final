import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { AppError } from '../middleware/errorHandler';

export const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.body);
    
    if (error) {
      const errorMessage = error.details.map(detail => detail.message).join(', ');
      throw new AppError(`Validation error: ${errorMessage}`, 400);
    }
    
    req.body = value;
    next();
  };
};

export const validateQuery = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.query);
    
    if (error) {
      const errorMessage = error.details.map(detail => detail.message).join(', ');
      throw new AppError(`Query validation error: ${errorMessage}`, 400);
    }
    
    req.query = value;
    next();
  };
};
