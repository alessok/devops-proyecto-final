// Simple import test for routes
import categoriesRouter from '../routes/categories';
import usersRouter from '../routes/users';

describe('Routes Import Test', () => {
  it('should import categories router', () => {
    expect(categoriesRouter).toBeDefined();
    expect(typeof categoriesRouter).toBe('function');
  });

  it('should import users router', () => {
    expect(usersRouter).toBeDefined();
    expect(typeof usersRouter).toBe('function');
  });
});
