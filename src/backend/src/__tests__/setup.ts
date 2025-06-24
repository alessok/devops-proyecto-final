// Mock database connection for tests
jest.mock('../config/database', () => {
  const mockPool = {
    query: jest.fn(),
    connect: jest.fn(),
    end: jest.fn()
  };
  return {
    __esModule: true,
    default: mockPool,
    pool: mockPool
  };
});

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '5432';
process.env.DB_NAME = 'test_db';
process.env.DB_USER = 'test_user';
process.env.DB_PASS = 'test_pass';

// Global test setup
beforeEach(() => {
  jest.clearAllMocks();
});

// Simple test to make Jest recognize this as a valid test file
describe('Test Setup', () => {
  it('should have proper test environment', () => {
    expect(process.env.NODE_ENV).toBe('test');
    expect(process.env.JWT_SECRET).toBe('test-secret-key');
  });
});
describe('Test Setup', () => {
  it('should configure test environment correctly', () => {
    expect(process.env.NODE_ENV).toBe('test');
    expect(process.env.JWT_SECRET).toBe('test-secret-key');
  });
});
