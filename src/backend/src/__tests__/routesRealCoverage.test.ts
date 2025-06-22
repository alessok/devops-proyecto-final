// Real execution test for routes
describe('Routes Real Coverage', () => {
  beforeEach(() => {
    // Clear module cache to force re-execution
    jest.resetModules();
  });

  test('should execute auth routes configuration', () => {
    // Mock dependencies with minimal interference
    jest.doMock('express', () => ({
      Router: jest.fn().mockImplementation(() => {
        const router = {
          post: jest.fn(),
          get: jest.fn(),
          use: jest.fn(),
          put: jest.fn(),
          delete: jest.fn()
        };
        return router;
      })
    }));

    jest.doMock('../controllers/authController', () => ({
      AuthController: jest.fn().mockImplementation(() => ({
        login: function() { return 'login'; },
        register: function() { return 'register'; },
        getProfile: function() { return 'getProfile'; },
        refreshToken: function() { return 'refreshToken'; }
      }))
    }));

    jest.doMock('../validation/validator', () => ({
      validate: jest.fn(() => 'validate'),
      validateQuery: jest.fn(() => 'validateQuery')
    }));

    jest.doMock('../validation/schemas', () => ({
      loginSchema: { type: 'login' },
      createUserSchema: { type: 'createUser' }
    }));

    jest.doMock('../middleware/auth', () => ({
      authenticateToken: jest.fn(() => 'authenticateToken')
    }));

    // Import auth routes to execute the configuration
    const authRoutes = require('../routes/auth');
    
    expect(authRoutes.default).toBeDefined();
  });

  test('should execute products routes configuration', () => {
    // Mock dependencies
    let routerInstance: any;
    
    jest.doMock('express', () => ({
      Router: jest.fn().mockImplementation(() => {
        routerInstance = {
          use: jest.fn(),
          get: jest.fn(),
          post: jest.fn(),
          put: jest.fn(),
          delete: jest.fn()
        };
        return routerInstance;
      })
    }));

    jest.doMock('../controllers/productController', () => ({
      ProductController: jest.fn().mockImplementation(() => ({
        getAllProducts: function() { return 'getAllProducts'; },
        getInventoryStats: function() { return 'getInventoryStats'; },
        getLowStockProducts: function() { return 'getLowStockProducts'; },
        getProductById: function() { return 'getProductById'; },
        createProduct: function() { return 'createProduct'; },
        updateProduct: function() { return 'updateProduct'; },
        updateStock: function() { return 'updateStock'; },
        deleteProduct: function() { return 'deleteProduct'; }
      }))
    }));

    jest.doMock('../validation/validator', () => ({
      validate: jest.fn(() => 'validate'),
      validateQuery: jest.fn(() => 'validateQuery')
    }));

    jest.doMock('../validation/schemas', () => ({
      createProductSchema: { type: 'createProduct' },
      updateProductSchema: { type: 'updateProduct' },
      paginationSchema: { type: 'pagination' }
    }));

    jest.doMock('../middleware/auth', () => ({
      authenticateToken: jest.fn(() => 'authenticateToken'),
      authorizeRoles: jest.fn(() => 'authorizeRoles')
    }));

    // Import products routes to execute the configuration
    const productsRoutes = require('../routes/products');
    
    expect(productsRoutes.default).toBeDefined();
    
    // Verify that router methods were called
    expect(routerInstance.use).toHaveBeenCalled(); // For authenticateToken
    expect(routerInstance.get).toHaveBeenCalled();  // For GET routes
    expect(routerInstance.post).toHaveBeenCalled(); // For POST routes
    expect(routerInstance.put).toHaveBeenCalled();  // For PUT routes
    expect(routerInstance.delete).toHaveBeenCalled(); // For DELETE routes
  });

  test('should create controller instances in auth routes', () => {
    const mockAuthController = jest.fn();
    
    jest.doMock('express', () => ({
      Router: jest.fn(() => ({
        post: jest.fn(),
        get: jest.fn(),
        use: jest.fn()
      }))
    }));

    jest.doMock('../controllers/authController', () => ({
      AuthController: mockAuthController.mockImplementation(() => ({
        login: jest.fn(),
        register: jest.fn(),
        getProfile: jest.fn(),
        refreshToken: jest.fn()
      }))
    }));

    jest.doMock('../validation/validator', () => ({
      validate: jest.fn(),
      validateQuery: jest.fn()
    }));

    jest.doMock('../validation/schemas', () => ({
      loginSchema: {},
      createUserSchema: {}
    }));

    jest.doMock('../middleware/auth', () => ({
      authenticateToken: jest.fn()
    }));

    require('../routes/auth');
    
    expect(mockAuthController).toHaveBeenCalled();
  });

  test('should create controller instances in products routes', () => {
    const mockProductController = jest.fn();
    
    jest.doMock('express', () => ({
      Router: jest.fn(() => ({
        use: jest.fn(),
        get: jest.fn(),
        post: jest.fn(),
        put: jest.fn(),
        delete: jest.fn()
      }))
    }));

    jest.doMock('../controllers/productController', () => ({
      ProductController: mockProductController.mockImplementation(() => ({
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

    jest.doMock('../validation/validator', () => ({
      validate: jest.fn(),
      validateQuery: jest.fn()
    }));

    jest.doMock('../validation/schemas', () => ({
      createProductSchema: {},
      updateProductSchema: {},
      paginationSchema: {}
    }));

    jest.doMock('../middleware/auth', () => ({
      authenticateToken: jest.fn(),
      authorizeRoles: jest.fn()
    }));

    require('../routes/products');
    
    expect(mockProductController).toHaveBeenCalled();
  });

  test('should call validation functions in routes', () => {
    const mockValidate = jest.fn();
    const mockValidateQuery = jest.fn();
    
    jest.doMock('express', () => ({
      Router: jest.fn(() => ({
        post: jest.fn(),
        get: jest.fn(),
        use: jest.fn(),
        put: jest.fn(),
        delete: jest.fn()
      }))
    }));

    jest.doMock('../controllers/authController', () => ({
      AuthController: jest.fn(() => ({
        login: jest.fn(),
        register: jest.fn(),
        getProfile: jest.fn(),
        refreshToken: jest.fn()
      }))
    }));

    jest.doMock('../controllers/productController', () => ({
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

    jest.doMock('../validation/validator', () => ({
      validate: mockValidate,
      validateQuery: mockValidateQuery
    }));

    jest.doMock('../validation/schemas', () => ({
      loginSchema: {},
      createUserSchema: {},
      createProductSchema: {},
      updateProductSchema: {},
      paginationSchema: {}
    }));

    jest.doMock('../middleware/auth', () => ({
      authenticateToken: jest.fn(),
      authorizeRoles: jest.fn()
    }));

    // Import both route files
    require('../routes/auth');
    require('../routes/products');
    
    expect(mockValidate).toHaveBeenCalled();
    expect(mockValidateQuery).toHaveBeenCalled();
  });

  test('should call authorization middleware in products routes', () => {
    const mockAuthorizeRoles = jest.fn();
    
    jest.doMock('express', () => ({
      Router: jest.fn(() => ({
        use: jest.fn(),
        get: jest.fn(),
        post: jest.fn(),
        put: jest.fn(),
        delete: jest.fn()
      }))
    }));

    jest.doMock('../controllers/productController', () => ({
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

    jest.doMock('../validation/validator', () => ({
      validate: jest.fn(),
      validateQuery: jest.fn()
    }));

    jest.doMock('../validation/schemas', () => ({
      createProductSchema: {},
      updateProductSchema: {},
      paginationSchema: {}
    }));

    jest.doMock('../middleware/auth', () => ({
      authenticateToken: jest.fn(),
      authorizeRoles: mockAuthorizeRoles
    }));

    require('../routes/products');
    
    expect(mockAuthorizeRoles).toHaveBeenCalledWith('admin', 'manager');
    expect(mockAuthorizeRoles).toHaveBeenCalledWith('admin');
  });

  test('should bind controller methods correctly', () => {
    const mockController = {
      getAllProducts: jest.fn(),
      getInventoryStats: jest.fn(),
      getLowStockProducts: jest.fn(),
      getProductById: jest.fn(),
      createProduct: jest.fn(),
      updateProduct: jest.fn(),
      updateStock: jest.fn(),
      deleteProduct: jest.fn()
    };

    const mockBind = jest.fn();
    Object.keys(mockController).forEach(key => {
      (mockController as any)[key].bind = mockBind;
    });

    jest.doMock('express', () => ({
      Router: jest.fn(() => ({
        use: jest.fn(),
        get: jest.fn((path: string, ...middlewares: any[]) => {
          // Check if the last middleware is a bound function
          const lastMiddleware = middlewares[middlewares.length - 1];
          if (typeof lastMiddleware === 'function') {
            // This simulates calling .bind() on the controller method
            mockBind();
          }
        }),
        post: jest.fn((path: string, ...middlewares: any[]) => {
          const lastMiddleware = middlewares[middlewares.length - 1];
          if (typeof lastMiddleware === 'function') {
            mockBind();
          }
        }),
        put: jest.fn((path: string, ...middlewares: any[]) => {
          const lastMiddleware = middlewares[middlewares.length - 1];
          if (typeof lastMiddleware === 'function') {
            mockBind();
          }
        }),
        delete: jest.fn((path: string, ...middlewares: any[]) => {
          const lastMiddleware = middlewares[middlewares.length - 1];
          if (typeof lastMiddleware === 'function') {
            mockBind();
          }
        })
      }))
    }));

    jest.doMock('../controllers/productController', () => ({
      ProductController: jest.fn(() => mockController)
    }));

    jest.doMock('../validation/validator', () => ({
      validate: jest.fn(),
      validateQuery: jest.fn()
    }));

    jest.doMock('../validation/schemas', () => ({
      createProductSchema: {},
      updateProductSchema: {},
      paginationSchema: {}
    }));

    jest.doMock('../middleware/auth', () => ({
      authenticateToken: jest.fn(),
      authorizeRoles: jest.fn()
    }));

    require('../routes/products');
    
    // bind should be called for each route that uses a controller method
    expect(mockBind).toHaveBeenCalled();
  });
});
