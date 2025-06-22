// Direct execution test for metrics service
import * as client from 'prom-client';

// Mock prom-client completely
jest.mock('prom-client', () => {
  const mockCounter = jest.fn().mockImplementation(() => ({
    inc: jest.fn(),
    get: jest.fn().mockReturnValue({ values: [] })
  }));
  
  const mockHistogram = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    get: jest.fn().mockReturnValue({ values: [] })
  }));
  
  const mockGauge = jest.fn().mockImplementation(() => ({
    set: jest.fn(),
    inc: jest.fn(),
    dec: jest.fn(),
    get: jest.fn().mockReturnValue({ values: [] })
  }));
  
  const mockRegistry = jest.fn().mockImplementation(() => ({
    setDefaultLabels: jest.fn(),
    register: jest.fn(),
    clear: jest.fn(),
    metrics: jest.fn().mockResolvedValue(''),
    getSingleMetric: jest.fn()
  }));
  
  return {
    Registry: mockRegistry,
    Counter: mockCounter,
    Histogram: mockHistogram,
    Gauge: mockGauge,
    collectDefaultMetrics: jest.fn(),
    default: {
      Registry: mockRegistry,
      Counter: mockCounter,
      Histogram: mockHistogram,
      Gauge: mockGauge,
      collectDefaultMetrics: jest.fn()
    }
  };
});

describe('Metrics Service Direct Execution', () => {
  test('should import and execute metrics service module', async () => {
    // Clear require cache to ensure fresh import
    jest.resetModules();
    
    // Import the metrics service - this should execute all top-level code
    const metricsService = await import('../services/metricsService');
    
    // Verify all exports exist
    expect(metricsService.register).toBeDefined();
    expect(metricsService.httpRequestsTotal).toBeDefined();
    expect(metricsService.httpRequestDuration).toBeDefined();
    expect(metricsService.activeConnections).toBeDefined();
    expect(metricsService.databaseConnectionPool).toBeDefined();
    expect(metricsService.businessMetrics).toBeDefined();
    
    // Verify businessMetrics structure
    expect(metricsService.businessMetrics.totalUsers).toBeDefined();
    expect(metricsService.businessMetrics.totalProducts).toBeDefined();
    expect(metricsService.businessMetrics.lowStockProducts).toBeDefined();
    expect(metricsService.businessMetrics.totalCategories).toBeDefined();
  });

  test('should create Registry with default labels', async () => {
    jest.resetModules();
    await import('../services/metricsService');
    
    // Verify Registry was instantiated
    expect(client.Registry).toHaveBeenCalled();
    
    // Verify setDefaultLabels was called
    const registryInstance = (client.Registry as jest.Mock).mock.results[0].value;
    expect(registryInstance.setDefaultLabels).toHaveBeenCalledWith({
      app: 'inventory-backend'
    });
  });

  test('should create HTTP request counter', async () => {
    jest.resetModules();
    await import('../services/metricsService');
    
    expect(client.Counter).toHaveBeenCalledWith({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code'],
      registers: [expect.any(Object)]
    });
  });

  test('should create HTTP request duration histogram', async () => {
    jest.resetModules();
    await import('../services/metricsService');
    
    expect(client.Histogram).toHaveBeenCalledWith({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.1, 0.5, 1, 2, 5],
      registers: [expect.any(Object)]
    });
  });

  test('should create gauge metrics', async () => {
    jest.resetModules();
    await import('../services/metricsService');
    
    // Verify all Gauge metrics were created
    expect(client.Gauge).toHaveBeenCalledWith({
      name: 'active_connections',
      help: 'Number of active connections',
      registers: [expect.any(Object)]
    });
    
    expect(client.Gauge).toHaveBeenCalledWith({
      name: 'database_connection_pool_size',
      help: 'Size of database connection pool',
      registers: [expect.any(Object)]
    });
    
    expect(client.Gauge).toHaveBeenCalledWith({
      name: 'total_users',
      help: 'Total number of users in the system',
      registers: [expect.any(Object)]
    });
    
    expect(client.Gauge).toHaveBeenCalledWith({
      name: 'total_products',
      help: 'Total number of products in the system',
      registers: [expect.any(Object)]
    });
    
    expect(client.Gauge).toHaveBeenCalledWith({
      name: 'low_stock_products',
      help: 'Number of products with low stock',
      registers: [expect.any(Object)]
    });
    
    expect(client.Gauge).toHaveBeenCalledWith({
      name: 'total_categories',
      help: 'Total number of categories in the system',
      registers: [expect.any(Object)]
    });
  });

  test('should enable collection of default metrics', async () => {
    jest.resetModules();
    await import('../services/metricsService');
    
    expect(client.collectDefaultMetrics).toHaveBeenCalledWith({
      register: expect.any(Object)
    });
  });

  test('should execute all business metrics creation', async () => {
    jest.resetModules();
    const metricsService = await import('../services/metricsService');
    
    // Test that businessMetrics object contains all expected properties
    const businessKeys = Object.keys(metricsService.businessMetrics);
    expect(businessKeys).toContain('totalUsers');
    expect(businessKeys).toContain('totalProducts');
    expect(businessKeys).toContain('lowStockProducts');
    expect(businessKeys).toContain('totalCategories');
    expect(businessKeys).toHaveLength(4);
  });
});
