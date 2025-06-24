// Mock prom-client
jest.mock('prom-client', () => ({
  Registry: jest.fn().mockImplementation(() => ({
    setDefaultLabels: jest.fn(),
    metrics: jest.fn().mockResolvedValue('mocked metrics')
  })),
  Counter: jest.fn().mockImplementation(() => ({
    inc: jest.fn(() => undefined)
  })),
  Histogram: jest.fn().mockImplementation(() => ({
    observe: jest.fn(() => undefined)
  })),
  Gauge: jest.fn().mockImplementation(() => ({
    set: jest.fn(() => undefined),
    inc: jest.fn(() => undefined),
    dec: jest.fn(() => undefined)
  })),
  collectDefaultMetrics: jest.fn()
}));

import type { Counter, Histogram, Gauge, Registry } from 'prom-client';

describe('MetricsService', () => {
  let register: Registry;
  let httpRequestsTotal: Counter<string>;
  let httpRequestDuration: Histogram<string>;
  let activeConnections: Gauge<string>;
  let databaseConnectionPool: Gauge<string>;
  let businessMetrics: {
    totalUsers: Gauge<string>;
    totalProducts: Gauge<string>;
    lowStockProducts: Gauge<string>;
    totalCategories: Gauge<string>;
  };
  let client: typeof import('prom-client');

  beforeEach(async () => {
    jest.resetModules();
    jest.clearAllMocks();
    // Importar después de resetModules y mocks
    client = await import('prom-client');
    const metrics = await import('../services/metricsService');
    register = metrics.register;
    httpRequestsTotal = metrics.httpRequestsTotal;
    httpRequestDuration = metrics.httpRequestDuration;
    activeConnections = metrics.activeConnections;
    databaseConnectionPool = metrics.databaseConnectionPool;
    businessMetrics = metrics.businessMetrics;
  });

  describe('Registry', () => {
    it('should create a new registry', () => {
      expect(client.Registry).toHaveBeenCalled();
    });

    it('should set default labels', () => {
      expect(register.setDefaultLabels).toHaveBeenCalledWith({
        app: 'inventory-backend'
      });
    });

    it('should enable collection of default metrics', () => {
      expect(client.collectDefaultMetrics).toHaveBeenCalledWith({ register });
    });
  });

  describe('HTTP Metrics', () => {
    it('should create httpRequestsTotal counter', () => {
      expect(client.Counter).toHaveBeenCalledWith({
        name: 'http_requests_total',
        help: 'Total number of HTTP requests',
        labelNames: ['method', 'route', 'status_code'],
        registers: [register]
      });
    });

    it('should create httpRequestDuration histogram', () => {
      expect(client.Histogram).toHaveBeenCalledWith({
        name: 'http_request_duration_seconds',
        help: 'Duration of HTTP requests in seconds',
        labelNames: ['method', 'route', 'status_code'],
        buckets: [0.1, 0.5, 1, 2, 5],
        registers: [register]
      });
    });

    it('should increment httpRequestsTotal', () => {
      const labels = { method: 'GET', route: '/api/test', status_code: '200' };
      httpRequestsTotal.inc(labels);
      expect(httpRequestsTotal.inc).toHaveBeenCalledWith(labels);
    });

    it('should observe httpRequestDuration', () => {
      const labels = { method: 'GET', route: '/api/test', status_code: '200' };
      const duration = 0.5;
      httpRequestDuration.observe(labels, duration);
      expect(httpRequestDuration.observe).toHaveBeenCalledWith(labels, duration);
    });
  });

  describe('System Metrics', () => {
    it('should create activeConnections gauge', () => {
      expect(client.Gauge).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'active_connections',
          help: 'Number of active connections',
          registers: [register]
        })
      );
    });

    it('should create databaseConnectionPool gauge', () => {
      expect(client.Gauge).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'database_connection_pool_size',
          help: 'Size of database connection pool',
          registers: [register]
        })
      );
    });

    it('should set activeConnections value', () => {
      activeConnections.set(10);
      expect(activeConnections.set).toHaveBeenCalledWith(10);
    });

    it('should set databaseConnectionPool value', () => {
      databaseConnectionPool.set(5);
      expect(databaseConnectionPool.set).toHaveBeenCalledWith(5);
    });
  });

  describe('Business Metrics', () => {
    it('should create business metrics gauges', () => {
      // Check if all business metrics gauges were created
      expect(client.Gauge).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'total_users',
          help: 'Total number of users in the system',
          registers: [register]
        })
      );

      expect(client.Gauge).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'total_products',
          help: 'Total number of products in the system',
          registers: [register]
        })
      );

      expect(client.Gauge).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'low_stock_products',
          help: 'Number of products with low stock',
          registers: [register]
        })
      );

      expect(client.Gauge).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'total_categories',
          help: 'Total number of categories in the system',
          registers: [register]
        })
      );
    });

    it('should update business metrics', () => {
      businessMetrics.totalUsers.set(100);
      businessMetrics.totalProducts.set(50);
      businessMetrics.lowStockProducts.set(5);
      businessMetrics.totalCategories.set(10);

      expect(businessMetrics.totalUsers.set).toHaveBeenCalledWith(100);
      expect(businessMetrics.totalProducts.set).toHaveBeenCalledWith(50);
      expect(businessMetrics.lowStockProducts.set).toHaveBeenCalledWith(5);
      expect(businessMetrics.totalCategories.set).toHaveBeenCalledWith(10);
    });

    it('should increment business metrics', () => {
      businessMetrics.totalUsers.inc();
      businessMetrics.totalProducts.inc(2);

      expect(businessMetrics.totalUsers.inc).toHaveBeenCalledWith();
      expect(businessMetrics.totalProducts.inc).toHaveBeenCalledWith(2);
    });

    it('should decrement business metrics', () => {
      businessMetrics.totalProducts.dec();
      businessMetrics.lowStockProducts.dec(1);

      expect(businessMetrics.totalProducts.dec).toHaveBeenCalledWith();
      expect(businessMetrics.lowStockProducts.dec).toHaveBeenCalledWith(1);
    });
  });
});
