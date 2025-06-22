// Real execution test for metrics service
describe('Metrics Service Real Coverage', () => {
  beforeEach(() => {
    // Clear module cache to force re-execution
    jest.resetModules();
  });

  test('should execute metrics service configuration', () => {
    // Mock prom-client but allow execution of our code
    jest.doMock('prom-client', () => {
      const mockRegistry = jest.fn().mockImplementation(function() {
        this.setDefaultLabels = jest.fn();
        this.register = jest.fn();
        this.clear = jest.fn();
        this.metrics = jest.fn().mockResolvedValue('');
        this.getSingleMetric = jest.fn();
        return this;
      });
      
      const mockCounter = jest.fn().mockImplementation(function(options) {
        expect(options.name).toBeDefined();
        expect(options.help).toBeDefined();
        this.inc = jest.fn();
        this.get = jest.fn().mockReturnValue({ values: [] });
        return this;
      });
      
      const mockHistogram = jest.fn().mockImplementation(function(options) {
        expect(options.name).toBeDefined();
        expect(options.help).toBeDefined();
        expect(options.buckets).toBeDefined();
        this.observe = jest.fn();
        this.get = jest.fn().mockReturnValue({ values: [] });
        return this;
      });
      
      const mockGauge = jest.fn().mockImplementation(function(options) {
        expect(options.name).toBeDefined();
        expect(options.help).toBeDefined();
        this.set = jest.fn();
        this.inc = jest.fn();
        this.dec = jest.fn();
        this.get = jest.fn().mockReturnValue({ values: [] });
        return this;
      });
      
      const mockCollectDefaultMetrics = jest.fn();
      
      return {
        Registry: mockRegistry,
        Counter: mockCounter,
        Histogram: mockHistogram,
        Gauge: mockGauge,
        collectDefaultMetrics: mockCollectDefaultMetrics,
        default: {
          Registry: mockRegistry,
          Counter: mockCounter,
          Histogram: mockHistogram,
          Gauge: mockGauge,
          collectDefaultMetrics: mockCollectDefaultMetrics
        }
      };
    });

    // Import and execute the metrics service
    const metricsService = require('../services/metricsService');
    
    // Verify all exports exist
    expect(metricsService.register).toBeDefined();
    expect(metricsService.httpRequestsTotal).toBeDefined();
    expect(metricsService.httpRequestDuration).toBeDefined();
    expect(metricsService.activeConnections).toBeDefined();
    expect(metricsService.databaseConnectionPool).toBeDefined();
    expect(metricsService.businessMetrics).toBeDefined();
  });

  test('should create Registry and set default labels', () => {
    const mockSetDefaultLabels = jest.fn();
    
    jest.doMock('prom-client', () => {
      const mockRegistry = jest.fn().mockImplementation(function() {
        this.setDefaultLabels = mockSetDefaultLabels;
        return this;
      });
      
      return {
        Registry: mockRegistry,
        Counter: jest.fn().mockImplementation(() => ({})),
        Histogram: jest.fn().mockImplementation(() => ({})),
        Gauge: jest.fn().mockImplementation(() => ({})),
        collectDefaultMetrics: jest.fn(),
        default: {
          Registry: mockRegistry,
          Counter: jest.fn().mockImplementation(() => ({})),
          Histogram: jest.fn().mockImplementation(() => ({})),
          Gauge: jest.fn().mockImplementation(() => ({})),
          collectDefaultMetrics: jest.fn()
        }
      };
    });

    require('../services/metricsService');
    
    expect(mockSetDefaultLabels).toHaveBeenCalledWith({
      app: 'inventory-backend'
    });
  });

  test('should create httpRequestsTotal counter with correct configuration', () => {
    const mockCounter = jest.fn();
    
    jest.doMock('prom-client', () => ({
      Registry: jest.fn().mockImplementation(() => ({})),
      Counter: mockCounter,
      Histogram: jest.fn().mockImplementation(() => ({})),
      Gauge: jest.fn().mockImplementation(() => ({})),
      collectDefaultMetrics: jest.fn(),
      default: {
        Registry: jest.fn().mockImplementation(() => ({})),
        Counter: mockCounter,
        Histogram: jest.fn().mockImplementation(() => ({})),
        Gauge: jest.fn().mockImplementation(() => ({})),
        collectDefaultMetrics: jest.fn()
      }
    }));

    require('../services/metricsService');
    
    expect(mockCounter).toHaveBeenCalledWith({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code'],
      registers: [expect.any(Object)]
    });
  });

  test('should create httpRequestDuration histogram with correct configuration', () => {
    const mockHistogram = jest.fn();
    
    jest.doMock('prom-client', () => ({
      Registry: jest.fn().mockImplementation(() => ({})),
      Counter: jest.fn().mockImplementation(() => ({})),
      Histogram: mockHistogram,
      Gauge: jest.fn().mockImplementation(() => ({})),
      collectDefaultMetrics: jest.fn(),
      default: {
        Registry: jest.fn().mockImplementation(() => ({})),
        Counter: jest.fn().mockImplementation(() => ({})),
        Histogram: mockHistogram,
        Gauge: jest.fn().mockImplementation(() => ({})),
        collectDefaultMetrics: jest.fn()
      }
    }));

    require('../services/metricsService');
    
    expect(mockHistogram).toHaveBeenCalledWith({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.1, 0.5, 1, 2, 5],
      registers: [expect.any(Object)]
    });
  });

  test('should create all gauge metrics', () => {
    const mockGauge = jest.fn();
    
    jest.doMock('prom-client', () => ({
      Registry: jest.fn().mockImplementation(() => ({})),
      Counter: jest.fn().mockImplementation(() => ({})),
      Histogram: jest.fn().mockImplementation(() => ({})),
      Gauge: mockGauge,
      collectDefaultMetrics: jest.fn(),
      default: {
        Registry: jest.fn().mockImplementation(() => ({})),
        Counter: jest.fn().mockImplementation(() => ({})),
        Histogram: jest.fn().mockImplementation(() => ({})),
        Gauge: mockGauge,
        collectDefaultMetrics: jest.fn()
      }
    }));

    require('../services/metricsService');
    
    // Should create 6 gauge metrics
    expect(mockGauge).toHaveBeenCalledTimes(6);
    
    // Verify specific gauge configurations
    expect(mockGauge).toHaveBeenCalledWith({
      name: 'active_connections',
      help: 'Number of active connections',
      registers: [expect.any(Object)]
    });
    
    expect(mockGauge).toHaveBeenCalledWith({
      name: 'database_connection_pool_size',
      help: 'Size of database connection pool',
      registers: [expect.any(Object)]
    });
    
    expect(mockGauge).toHaveBeenCalledWith({
      name: 'total_users',
      help: 'Total number of users in the system',
      registers: [expect.any(Object)]
    });
    
    expect(mockGauge).toHaveBeenCalledWith({
      name: 'total_products',
      help: 'Total number of products in the system',
      registers: [expect.any(Object)]
    });
    
    expect(mockGauge).toHaveBeenCalledWith({
      name: 'low_stock_products',
      help: 'Number of products with low stock',
      registers: [expect.any(Object)]
    });
    
    expect(mockGauge).toHaveBeenCalledWith({
      name: 'total_categories',
      help: 'Total number of categories in the system',
      registers: [expect.any(Object)]
    });
  });

  test('should call collectDefaultMetrics', () => {
    const mockCollectDefaultMetrics = jest.fn();
    
    jest.doMock('prom-client', () => ({
      Registry: jest.fn().mockImplementation(() => ({})),
      Counter: jest.fn().mockImplementation(() => ({})),
      Histogram: jest.fn().mockImplementation(() => ({})),
      Gauge: jest.fn().mockImplementation(() => ({})),
      collectDefaultMetrics: mockCollectDefaultMetrics,
      default: {
        Registry: jest.fn().mockImplementation(() => ({})),
        Counter: jest.fn().mockImplementation(() => ({})),
        Histogram: jest.fn().mockImplementation(() => ({})),
        Gauge: jest.fn().mockImplementation(() => ({})),
        collectDefaultMetrics: mockCollectDefaultMetrics
      }
    }));

    require('../services/metricsService');
    
    expect(mockCollectDefaultMetrics).toHaveBeenCalledWith({
      register: expect.any(Object)
    });
  });

  test('should create businessMetrics object with all properties', () => {
    jest.doMock('prom-client', () => ({
      Registry: jest.fn().mockImplementation(() => ({})),
      Counter: jest.fn().mockImplementation(() => ({})),
      Histogram: jest.fn().mockImplementation(() => ({})),
      Gauge: jest.fn().mockImplementation(() => ({})),
      collectDefaultMetrics: jest.fn(),
      default: {
        Registry: jest.fn().mockImplementation(() => ({})),
        Counter: jest.fn().mockImplementation(() => ({})),
        Histogram: jest.fn().mockImplementation(() => ({})),
        Gauge: jest.fn().mockImplementation(() => ({})),
        collectDefaultMetrics: jest.fn()
      }
    }));

    const metricsService = require('../services/metricsService');
    
    expect(metricsService.businessMetrics).toBeDefined();
    expect(metricsService.businessMetrics.totalUsers).toBeDefined();
    expect(metricsService.businessMetrics.totalProducts).toBeDefined();
    expect(metricsService.businessMetrics.lowStockProducts).toBeDefined();
    expect(metricsService.businessMetrics.totalCategories).toBeDefined();
    
    // Verify it's an object with exactly 4 properties
    expect(Object.keys(metricsService.businessMetrics)).toHaveLength(4);
  });
});
