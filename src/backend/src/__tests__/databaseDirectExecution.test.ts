// Direct execution test for database configuration
import { Pool } from 'pg';

// Mock pg module
jest.mock('pg', () => ({
  Pool: jest.fn().mockImplementation(() => ({
    connect: jest.fn().mockResolvedValue({
      query: jest.fn().mockResolvedValue({ rows: [{ now: new Date() }] }),
      release: jest.fn()
    }),
    end: jest.fn((callback) => callback && callback()),
    query: jest.fn().mockResolvedValue({ rows: [] })
  }))
}));

// Mock dotenv
jest.mock('dotenv', () => ({
  config: jest.fn()
}));

// Mock process.env
const originalEnv = process.env;
beforeEach(() => {
  process.env = {
    ...originalEnv,
    DB_HOST: 'test-host',
    DB_PORT: '5433',
    DB_NAME: 'test_db',
    DB_USER: 'test_user',
    DB_PASS: 'test_pass'
  };
});

afterEach(() => {
  process.env = originalEnv;
});

describe('Database Configuration Direct Execution', () => {
  test('should import and execute database module with environment variables', async () => {
    // Clear require cache to ensure fresh import
    jest.resetModules();
    
    // Import the database module - this should execute all top-level code
    const database = await import('../config/database');
    
    // Verify that Pool was called with correct config
    expect(Pool).toHaveBeenCalledWith({
      host: 'test-host',
      port: 5433,
      database: 'test_db',
      user: 'test_user',
      password: 'test_pass',
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000
    });
    
    // Verify exports exist
    expect(database.pool).toBeDefined();
    expect(database.testConnection).toBeDefined();
    expect(database.default).toBeDefined();
  });

  test('should execute testConnection successfully', async () => {
    jest.resetModules();
    const database = await import('../config/database');
    
    const result = await database.testConnection();
    expect(result).toBe(true);
  });

  test('should handle testConnection error', async () => {
    // Mock Pool to throw error
    (Pool as jest.Mock).mockImplementationOnce(() => ({
      connect: jest.fn().mockRejectedValue(new Error('Connection failed'))
    }));
    
    jest.resetModules();
    const database = await import('../config/database');
    
    const result = await database.testConnection();
    expect(result).toBe(false);
  });

  test('should execute with default environment variables', async () => {
    process.env = { ...originalEnv };
    delete process.env.DB_HOST;
    delete process.env.DB_PORT;
    delete process.env.DB_NAME;
    delete process.env.DB_USER;
    delete process.env.DB_PASS;
    
    jest.resetModules();
    const database = await import('../config/database');
    
    expect(Pool).toHaveBeenCalledWith({
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

  test('should handle SIGINT signal', async () => {
    const originalExit = process.exit;
    const mockExit = jest.fn();
    process.exit = mockExit;
    
    const originalConsoleLog = console.log;
    const mockConsoleLog = jest.fn();
    console.log = mockConsoleLog;
    
    jest.resetModules();
    await import('../config/database');
    
    // Simulate SIGINT
    process.emit('SIGINT', 'SIGINT');
    
    // Restore original functions
    process.exit = originalExit;
    console.log = originalConsoleLog;
    
    expect(mockConsoleLog).toHaveBeenCalledWith('\n🔄 Closing database connections...');
  });
});
