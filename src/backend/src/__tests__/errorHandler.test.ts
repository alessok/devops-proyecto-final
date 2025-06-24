import { Request, Response } from 'express';
import { AppError, errorHandler } from '../middleware/errorHandler';

describe('Error Handler Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;
  
  // Spy on console.error to suppress logs during tests
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    
    mockReq = {
      url: '/test',
      method: 'GET'
    };
    
    mockRes = {
      status: mockStatus,
      json: mockJson
    };
    
    // Mock console.error to suppress output during tests
    consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
    consoleSpy.mockRestore();
    delete process.env.NODE_ENV;
  });

  describe('AppError', () => {
    it('should create AppError with correct properties', () => {
      const error = new AppError('Test error message', 400);

      expect(error.message).toBe('Test error message');
      expect(error.statusCode).toBe(400);
      expect(error.isOperational).toBe(true);
      expect(error instanceof Error).toBe(true);
    });

    it('should capture stack trace', () => {
      const error = new AppError('Test error', 400);
      
      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('Test error');
    });
  });

  describe('errorHandler', () => {
    it('should handle AppError correctly', () => {
      const error = new AppError('Custom error message', 404);

      errorHandler(error, mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: 'Custom error message',
        error: 'Custom error message',
        timestamp: expect.any(String)
      });
    });

    it('should handle ValidationError correctly', () => {
      const error = new Error('Validation failed');
      error.name = 'ValidationError';

      errorHandler(error, mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: 'Validation Error',
        error: 'Validation failed',
        timestamp: expect.any(String)
      });
    });

    it('should handle JsonWebTokenError correctly', () => {
      const error = new Error('Invalid token');
      error.name = 'JsonWebTokenError';

      errorHandler(error, mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(401);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid token',
        error: 'Invalid token',
        timestamp: expect.any(String)
      });
    });

    it('should handle TokenExpiredError correctly', () => {
      const error = new Error('Token expired');
      error.name = 'TokenExpiredError';

      errorHandler(error, mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(401);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: 'Token expired',
        error: 'Token expired',
        timestamp: expect.any(String)
      });
    });

    it('should handle generic errors with 500 status', () => {
      const error = new Error('Unexpected error');

      errorHandler(error, mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: 'Internal Server Error',
        error: 'Unexpected error',
        timestamp: expect.any(String)
      });
    });

    it('should hide error details in production', () => {
      process.env.NODE_ENV = 'production';
      
      const error = new Error('Sensitive error details');

      errorHandler(error, mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: 'Internal Server Error',
        error: undefined,
        timestamp: expect.any(String)
      });
    });

    it('should show error details in development', () => {
      process.env.NODE_ENV = 'development';
      
      const error = new Error('Development error details');

      errorHandler(error, mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: 'Internal Server Error',
        error: 'Development error details',
        timestamp: expect.any(String)
      });
    });

    it('should log error information', () => {
      const error = new Error('Test error for logging');
      
      errorHandler(error, mockReq as Request, mockRes as Response);

      expect(consoleSpy).toHaveBeenCalledWith('Error:', {
        message: 'Test error for logging',
        stack: expect.any(String),
        url: '/test',
        method: 'GET',
        timestamp: expect.any(String)
      });
    });

    it('should include valid timestamp in response', () => {
      const error = new AppError('Test error', 400);
      
      errorHandler(error, mockReq as Request, mockRes as Response);

      const response = mockJson.mock.calls[0][0];
      const timestamp = new Date(response.timestamp);
      
      expect(timestamp).toBeInstanceOf(Date);
      expect(timestamp.getTime()).not.toBeNaN();
    });

    it('should handle errors without message', () => {
      const error = new Error();

      errorHandler(error, mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: 'Internal Server Error',
        error: '',
        timestamp: expect.any(String)
      });
    });
  });
});
