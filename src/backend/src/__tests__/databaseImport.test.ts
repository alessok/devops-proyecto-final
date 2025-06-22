// Simple import test for database config
import { pool } from '../config/database';

describe('Database Import Test', () => {
  it('should import database pool', () => {
    expect(pool).toBeDefined();
    expect(pool.connect).toBeDefined();
    expect(pool.end).toBeDefined();
  });
});
