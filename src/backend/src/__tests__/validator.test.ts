import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { validate, validateQuery } from '../validation/validator';
import { AppError } from '../middleware/errorHandler';

// Mock the AppError
jest.mock('../middleware/errorHandler');

describe('Validator', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      body: {},
      query: {}
    };
    mockRes = {};
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('validate', () => {
    it('should pass validation with valid data', () => {
      const schema = Joi.object({
        name: Joi.string().required(),
        age: Joi.number().required()
      });

      mockReq.body = { name: 'John', age: 25 };

      const validator = validate(schema);
      validator(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(mockReq.body).toEqual({ name: 'John', age: 25 });
    });

    it('should throw AppError with invalid data', () => {
      const schema = Joi.object({
        name: Joi.string().required(),
        age: Joi.number().required()
      });

      mockReq.body = { name: 'John' }; // Missing age

      const validator = validate(schema);

      expect(() => {
        validator(mockReq as Request, mockRes as Response, mockNext);
      }).toThrow(AppError);

      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should combine multiple validation errors', () => {
      const schema = Joi.object({
        name: Joi.string().required(),
        age: Joi.number().required(),
        email: Joi.string().email().required()
      });

      mockReq.body = {}; // Missing all required fields

      const validator = validate(schema);

      expect(() => {
        validator(mockReq as Request, mockRes as Response, mockNext);
      }).toThrow(AppError);

      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should transform and sanitize data', () => {
      const schema = Joi.object({
        name: Joi.string().trim().required(),
        age: Joi.number().integer().positive().required()
      });

      mockReq.body = { name: '  John  ', age: '25' };

      const validator = validate(schema);
      validator(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(mockReq.body).toEqual({ name: 'John', age: 25 });
    });
  });

  describe('validateQuery', () => {
    it('should pass validation with valid query params', () => {
      const schema = Joi.object({
        page: Joi.number().integer().positive().default(1),
        limit: Joi.number().integer().positive().max(100).default(10)
      });

      mockReq.query = { page: '2', limit: '20' };

      const validator = validateQuery(schema);
      validator(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(mockReq.query).toEqual({ page: 2, limit: 20 });
    });

    it('should throw AppError with invalid query params', () => {
      const schema = Joi.object({
        page: Joi.number().integer().positive().required(),
        limit: Joi.number().integer().positive().max(100).required()
      });

      mockReq.query = { page: 'invalid', limit: '200' }; // Invalid page, limit too high

      const validator = validateQuery(schema);

      expect(() => {
        validator(mockReq as Request, mockRes as Response, mockNext);
      }).toThrow(AppError);

      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should apply default values for missing query params', () => {
      const schema = Joi.object({
        page: Joi.number().integer().positive().default(1),
        limit: Joi.number().integer().positive().default(10)
      });

      mockReq.query = {};

      const validator = validateQuery(schema);
      validator(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(mockReq.query).toEqual({ page: 1, limit: 10 });
    });

    it('should handle empty strings in query params', () => {
      const schema = Joi.object({
        search: Joi.string().allow('').optional(),
        category: Joi.number().integer().positive().optional()
      });

      mockReq.query = { search: '', category: '1' };

      const validator = validateQuery(schema);
      validator(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(mockReq.query).toEqual({ search: '', category: 1 });
    });
  });
});
