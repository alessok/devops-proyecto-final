import { Request, Response } from 'express';
import { notFoundHandler } from '../middleware/notFoundHandler';

describe('notFoundHandler', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    
    mockReq = {
      originalUrl: '/api/nonexistent'
    };
    
    mockRes = {
      status: mockStatus,
      json: mockJson
    };
  });

  it('should return 404 with proper error message', () => {
    notFoundHandler(mockReq as Request, mockRes as Response);

    expect(mockStatus).toHaveBeenCalledWith(404);
    expect(mockJson).toHaveBeenCalledWith({
      success: false,
      message: 'Route /api/nonexistent not found',
      timestamp: expect.any(String)
    });
  });

  it('should handle different URLs correctly', () => {
    mockReq.originalUrl = '/users/123/posts';
    
    notFoundHandler(mockReq as Request, mockRes as Response);

    expect(mockStatus).toHaveBeenCalledWith(404);
    expect(mockJson).toHaveBeenCalledWith({
      success: false,
      message: 'Route /users/123/posts not found',
      timestamp: expect.any(String)
    });
  });

  it('should include timestamp in ISO format', () => {
    const beforeTime = new Date().toISOString();
    
    notFoundHandler(mockReq as Request, mockRes as Response);
    
    const afterTime = new Date().toISOString();
    const responseData = mockJson.mock.calls[0][0];
    
    expect(responseData.timestamp).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/);
    expect(responseData.timestamp >= beforeTime).toBe(true);
    expect(responseData.timestamp <= afterTime).toBe(true);
  });
});
