import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { validate, validateQuery } from '../validation/validator';
import { AppError } from '../middleware/errorHandler';

// Mock AppError
jest.mock('../middleware/errorHandler');

describe('Validator Additional Tests', () => {
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

  describe('validate middleware', () => {
    const testSchema = Joi.object({
      name: Joi.string().required(),
      age: Joi.number().min(0).required(),
      email: Joi.string().email().optional()
    });

    it('should pass validation with valid data', () => {
      mockReq.body = {
        name: 'John Doe',
        age: 25,
        email: 'john@example.com'
      };

      const middleware = validate(testSchema);
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(mockReq.body).toEqual({
        name: 'John Doe',
        age: 25,
        email: 'john@example.com'
      });
    });

    it('should pass validation with minimal required data', () => {
      mockReq.body = {
        name: 'Jane Doe',
        age: 30
      };

      const middleware = validate(testSchema);
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(mockReq.body).toEqual({
        name: 'Jane Doe',
        age: 30
      });
    });

    it('should throw error for missing required field', () => {
      mockReq.body = {
        age: 25
      };

      const middleware = validate(testSchema);

      expect(() => {
        middleware(mockReq as Request, mockRes as Response, mockNext);
      }).toThrow(AppError);

      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should throw error for invalid data type', () => {
      mockReq.body = {
        name: 'John Doe',
        age: 'invalid-age'
      };

      const middleware = validate(testSchema);

      expect(() => {
        middleware(mockReq as Request, mockRes as Response, mockNext);
      }).toThrow(AppError);

      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should throw error for invalid email format', () => {
      mockReq.body = {
        name: 'John Doe',
        age: 25,
        email: 'invalid-email'
      };

      const middleware = validate(testSchema);

      expect(() => {
        middleware(mockReq as Request, mockRes as Response, mockNext);
      }).toThrow(AppError);

      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle multiple validation errors', () => {
      mockReq.body = {
        age: -5,
        email: 'invalid-email'
      };

      const middleware = validate(testSchema);

      expect(() => {
        middleware(mockReq as Request, mockRes as Response, mockNext);
      }).toThrow(AppError);

      expect(mockNext).not.toHaveBeenCalled();
    });


  });

  describe('validateQuery middleware', () => {
    const querySchema = Joi.object({
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(100).default(10),
      search: Joi.string().allow('').default(''),
      sortBy: Joi.string().valid('name', 'date', 'id').default('id')
    });

    it('should pass validation with valid query parameters', () => {
      mockReq.query = {
        page: '2',
        limit: '20',
        search: 'test',
        sortBy: 'name'
      };

      const middleware = validateQuery(querySchema);
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(mockReq.query).toEqual({
        page: 2,
        limit: 20,
        search: 'test',
        sortBy: 'name'
      });
    });

    it('should apply default values for missing query parameters', () => {
      mockReq.query = {};

      const middleware = validateQuery(querySchema);
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(mockReq.query).toEqual({
        page: 1,
        limit: 10,
        search: '',
        sortBy: 'id'
      });
    });

    it('should throw error for invalid query parameter', () => {
      mockReq.query = {
        page: '0',
        limit: '200'
      };

      const middleware = validateQuery(querySchema);

      expect(() => {
        middleware(mockReq as Request, mockRes as Response, mockNext);
      }).toThrow(AppError);

      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should throw error for invalid enum value', () => {
      mockReq.query = {
        sortBy: 'invalid-sort'
      };

      const middleware = validateQuery(querySchema);

      expect(() => {
        middleware(mockReq as Request, mockRes as Response, mockNext);
      }).toThrow(AppError);

      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle string to number conversion', () => {
      mockReq.query = {
        page: '3',
        limit: '25'
      };

      const middleware = validateQuery(querySchema);
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(mockReq.query).toEqual({
        page: 3,
        limit: 25,
        search: '',
        sortBy: 'id'
      });
    });

    it('should handle empty string search parameter', () => {
      mockReq.query = {
        search: ''
      };

      const middleware = validateQuery(querySchema);
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(mockReq.query).toEqual({
        page: 1,
        limit: 10,
        search: '',
        sortBy: 'id'
      });
    });
  });
});