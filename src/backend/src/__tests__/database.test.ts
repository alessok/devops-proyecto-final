import { Pool } from 'pg';

// Mock pg Pool
const mockPool = {
  connect: jest.fn(),
  end: jest.fn(),
  query: jest.fn()
};

jest.mock('pg', () => ({
  Pool: jest.fn(() => mockPool)
}));

// Mock dotenv
jest.mock('dotenv', () => ({
  config: jest.fn()
}));

const MockedPool = Pool as jest.MockedClass<typeof Pool>;

describe('Database Configuration', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Save original environment
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
    // Clear modules to reset imports
    jest.resetModules();
  });

  describe('Database Config', () => {
    it('should create pool with default configuration values', () => {
      // Clear environment variables
      delete process.env.DB_HOST;
      delete process.env.DB_PORT;
      delete process.env.DB_NAME;
      delete process.env.DB_USER;
      delete process.env.DB_PASS;

      // Import fresh to trigger pool creation
      require('../config/database');

      expect(MockedPool).toHaveBeenCalledWith({
        host: 'localhost',
        port: 5432,
        database: 'inventory_db',
        user: 'inventory_user',
        password: 'inventory_pass',
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000
      });
    });

    it('should create pool with environment variables when provided', () => {
      process.env.DB_HOST = 'test-host';
      process.env.DB_PORT = '3000';
      process.env.DB_NAME = 'test_db';
      process.env.DB_USER = 'test_user';
      process.env.DB_PASS = 'test_pass';

      // Import fresh to trigger pool creation with env vars
      require('../config/database');

      expect(MockedPool).toHaveBeenCalledWith({
        host: 'test-host',
        port: 3000,
        database: 'test_db',
        user: 'test_user',
        password: 'test_pass',
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000
      });
    });
  });

  describe('testConnection', () => {
    it('should return true when connection is successful', async () => {
      const mockClient = {
        query: jest.fn().mockResolvedValue({}),
        release: jest.fn()
      };
      
      mockPool.connect.mockResolvedValue(mockClient);
      
      // Mock console.log to avoid noise in test output
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      // Import and use the function
      const { testConnection } = require('../config/database');
      const result = await testConnection();

      expect(result).toBe(true);
      expect(mockPool.connect).toHaveBeenCalled();
      expect(mockClient.query).toHaveBeenCalledWith('SELECT NOW()');
      expect(mockClient.release).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith('✅ Database connection successful');
      
      consoleSpy.mockRestore();
    });

    it('should return false when connection fails', async () => {
      const error = new Error('Connection failed');
      mockPool.connect.mockRejectedValue(error);

      // Mock console.error to avoid noise in test output
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // Import and use the function
      const { testConnection } = require('../config/database');
      const result = await testConnection();

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('❌ Database connection failed:', error);
      
      consoleSpy.mockRestore();
    });

    it('should handle query errors', async () => {
      const mockClient = {
        query: jest.fn().mockRejectedValue(new Error('Query failed')),
        release: jest.fn()
      };
      
      mockPool.connect.mockResolvedValue(mockClient);

      // Mock console.error to avoid noise in test output
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // Import and use the function
      const { testConnection } = require('../config/database');
      const result = await testConnection();

      expect(result).toBe(false);
      expect(mockClient.query).toHaveBeenCalledWith('SELECT NOW()');
      
      consoleSpy.mockRestore();
    });
  });
});
