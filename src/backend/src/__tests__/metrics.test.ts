import { Request, Response, NextFunction } from 'express';
import { metricsMiddleware } from '../middleware/metrics';
import { httpRequestsTotal, httpRequestDuration } from '../services/metricsService';

// Mock the metrics service
jest.mock('../services/metricsService', () => ({
  httpRequestsTotal: {
    inc: jest.fn()
  },
  httpRequestDuration: {
    observe: jest.fn()
  }
}));

const mockedHttpRequestsTotal = httpRequestsTotal as jest.Mocked<typeof httpRequestsTotal>;
const mockedHttpRequestDuration = httpRequestDuration as jest.Mocked<typeof httpRequestDuration>;

describe('metricsMiddleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;
  let finishCallback: () => void;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockNext = jest.fn();
    
    mockReq = {
      method: 'GET',
      path: '/api/test',
      route: {
        path: '/api/test'
      }
    };
    
    mockRes = {
      statusCode: 200,
      on: jest.fn().mockImplementation((event, callback) => {
        if (event === 'finish') {
          finishCallback = callback;
        }
        return mockRes;
      })
    };
  });

  it('should increment HTTP requests counter', () => {
    metricsMiddleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockedHttpRequestsTotal.inc).toHaveBeenCalledWith({
      method: 'GET',
      route: '/api/test',
      status_code: '200'
    });
  });

  it('should call next middleware', () => {
    metricsMiddleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
  });

  it('should register finish event listener', () => {
    metricsMiddleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.on).toHaveBeenCalledWith('finish', expect.any(Function));
  });

  it('should observe request duration on finish', () => {
    jest.useFakeTimers();
    const startTime = Date.now();
    
    metricsMiddleware(mockReq as Request, mockRes as Response, mockNext);
    
    // Simulate 500ms duration
    jest.advanceTimersByTime(500);
    mockRes.statusCode = 201;
    
    // Call finish callback
    finishCallback();

    expect(mockedHttpRequestDuration.observe).toHaveBeenCalledWith(
      {
        method: 'GET',
        route: '/api/test',
        status_code: '201'
      },
      0.5 // 500ms = 0.5 seconds
    );
    
    jest.useRealTimers();
  });

  it('should use path when route is not available', () => {
    mockReq.route = undefined;
    
    metricsMiddleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockedHttpRequestsTotal.inc).toHaveBeenCalledWith({
      method: 'GET',
      route: '/api/test',
      status_code: '200'
    });
  });

  it('should handle different HTTP methods', () => {
    mockReq.method = 'POST';
    (mockReq as any).route = { path: '/api/users' };
    
    metricsMiddleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockedHttpRequestsTotal.inc).toHaveBeenCalledWith({
      method: 'POST',
      route: '/api/users',
      status_code: '200'
    });
  });

  it('should handle error status codes', () => {
    metricsMiddleware(mockReq as Request, mockRes as Response, mockNext);
    
    mockRes.statusCode = 404;
    finishCallback();

    expect(mockedHttpRequestDuration.observe).toHaveBeenCalledWith(
      {
        method: 'GET',
        route: '/api/test',
        status_code: '404'
      },
      expect.any(Number)
    );
  });
});
