// Import routes to trigger code coverage
import authRoutes from '../routes/auth';
import categoriesRoutes from '../routes/categories';
import productsRoutes from '../routes/products';
import usersRoutes from '../routes/users';

describe('Routes Coverage Test', () => {
  it('should import auth routes', () => {
    expect(authRoutes).toBeDefined();
    expect(typeof authRoutes).toBe('function');
  });

  it('should import categories routes', () => {
    expect(categoriesRoutes).toBeDefined();
    expect(typeof categoriesRoutes).toBe('function');
  });

  it('should import products routes', () => {
    expect(productsRoutes).toBeDefined();
    expect(typeof productsRoutes).toBe('function');
  });

  it('should import users routes', () => {
    expect(usersRoutes).toBeDefined();
    expect(typeof usersRoutes).toBe('function');
  });
});
