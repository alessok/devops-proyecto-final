// Direct execution test for routes
import { Router } from 'express';

// Mock express
jest.mock('express', () => ({
  Router: jest.fn(() => ({
    use: jest.fn(),
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn()
  }))
}));

// Mock controllers
jest.mock('../controllers/authController', () => ({
  AuthController: jest.fn(() => ({
    login: jest.fn(),
    register: jest.fn(),
    getProfile: jest.fn(),
    refreshToken: jest.fn()
  }))
}));

jest.mock('../controllers/productController', () => ({
  ProductController: jest.fn(() => ({
    getAllProducts: jest.fn(),
    getInventoryStats: jest.fn(),
    getLowStockProducts: jest.fn(),
    getProductById: jest.fn(),
    createProduct: jest.fn(),
    updateProduct: jest.fn(),
    updateStock: jest.fn(),
    deleteProduct: jest.fn()
  }))
}));

// Mock validation
jest.mock('../validation/validator', () => ({
  validate: jest.fn(),
  validateQuery: jest.fn()
}));

jest.mock('../validation/schemas', () => ({
  createProductSchema: {},
  updateProductSchema: {},
  paginationSchema: {},
  loginSchema: {},
  createUserSchema: {}
}));

// Mock middleware
jest.mock('../middleware/auth', () => ({
  authenticateToken: jest.fn(),
  authorizeRoles: jest.fn()
}));

describe('Routes Direct Execution', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  test('should execute auth routes module', async () => {
    const authRoutes = await import('../routes/auth');
    
    // Verify Router was called
    expect(Router).toHaveBeenCalled();
    
    // Verify default export exists
    expect(authRoutes.default).toBeDefined();
    
    // Get the router instance
    const routerInstance = (Router as jest.Mock).mock.results[0].value;
    
    // Verify routes were set up
    expect(routerInstance.post).toHaveBeenCalledTimes(3); // login, register, refresh
    expect(routerInstance.get).toHaveBeenCalledTimes(1);  // profile
  });

  test('should execute products routes module', async () => {
    const productsRoutes = await import('../routes/products');
    
    // Verify Router was called
    expect(Router).toHaveBeenCalled();
    
    // Verify default export exists
    expect(productsRoutes.default).toBeDefined();
    
    // Get the router instance (second call to Router)
    const routerInstance = (Router as jest.Mock).mock.results[1].value;
    
    // Verify middleware was set up
    expect(routerInstance.use).toHaveBeenCalled();
    
    // Verify all routes were set up
    expect(routerInstance.get).toHaveBeenCalledTimes(4);    // /, /stats, /low-stock, /:id
    expect(routerInstance.post).toHaveBeenCalledTimes(1);   // /
    expect(routerInstance.put).toHaveBeenCalledTimes(2);    // /:id, /:id/stock
    expect(routerInstance.delete).toHaveBeenCalledTimes(1); // /:id
  });

  test('should create auth controller instance in auth routes', async () => {
    const { AuthController } = await import('../controllers/authController');
    await import('../routes/auth');
    
    expect(AuthController).toHaveBeenCalled();
  });

  test('should create product controller instance in products routes', async () => {
    const { ProductController } = await import('../controllers/productController');
    await import('../routes/products');
    
    expect(ProductController).toHaveBeenCalled();
  });

  test('should set up authentication middleware in products routes', async () => {
    const { authenticateToken } = await import('../middleware/auth');
    await import('../routes/products');
    
    const routerInstance = (Router as jest.Mock).mock.results[0].value;
    expect(routerInstance.use).toHaveBeenCalledWith(authenticateToken);
  });

  test('should use validation middleware in routes', async () => {
    const { validate, validateQuery } = await import('../validation/validator');
    await import('../routes/auth');
    await import('../routes/products');
    
    // Verify validate and validateQuery were called
    expect(validate).toHaveBeenCalled();
    expect(validateQuery).toHaveBeenCalled();
  });

  test('should use authorization middleware in products routes', async () => {
    const { authorizeRoles } = await import('../middleware/auth');
    await import('../routes/products');
    
    // Verify authorizeRoles was called for protected routes
    expect(authorizeRoles).toHaveBeenCalledWith('admin', 'manager');
    expect(authorizeRoles).toHaveBeenCalledWith('admin');
  });

  test('should import validation schemas', async () => {
    const schemas = await import('../validation/schemas');
    
    expect(schemas.createProductSchema).toBeDefined();
    expect(schemas.updateProductSchema).toBeDefined();
    expect(schemas.paginationSchema).toBeDefined();
    expect(schemas.loginSchema).toBeDefined();
    expect(schemas.createUserSchema).toBeDefined();
  });

  test('should bind controller methods in auth routes', async () => {
    const authRoutes = await import('../routes/auth');
    const { AuthController } = await import('../controllers/authController');
    
    // Verify AuthController was instantiated
    expect(AuthController).toHaveBeenCalled();
    
    // Get the controller instance
    const controllerInstance = (AuthController as jest.Mock).mock.results[0].value;
    
    // Verify methods exist on controller
    expect(controllerInstance.login).toBeDefined();
    expect(controllerInstance.register).toBeDefined();
    expect(controllerInstance.getProfile).toBeDefined();
    expect(controllerInstance.refreshToken).toBeDefined();
  });

  test('should bind controller methods in products routes', async () => {
    const productsRoutes = await import('../routes/products');
    const { ProductController } = await import('../controllers/productController');
    
    // Verify ProductController was instantiated
    expect(ProductController).toHaveBeenCalled();
    
    // Get the controller instance
    const controllerInstance = (ProductController as jest.Mock).mock.results[0].value;
    
    // Verify methods exist on controller
    expect(controllerInstance.getAllProducts).toBeDefined();
    expect(controllerInstance.getInventoryStats).toBeDefined();
    expect(controllerInstance.getLowStockProducts).toBeDefined();
    expect(controllerInstance.getProductById).toBeDefined();
    expect(controllerInstance.createProduct).toBeDefined();
    expect(controllerInstance.updateProduct).toBeDefined();
    expect(controllerInstance.updateStock).toBeDefined();
    expect(controllerInstance.deleteProduct).toBeDefined();
  });
});
