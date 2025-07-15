import request from 'supertest';

// Mock the database pool before importing app
jest.mock('../config/database', () => ({
  pool: {
    query: jest.fn()
  }
}));

import app from '../index';
import { pool } from '../config/database';

const mockQuery = (pool as any).query;

describe('Index/App Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockQuery.mockClear();
  });
  describe('GET /', () => {
    it('should return welcome message and API info', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);

      expect(response.body).toMatchObject({
        service: 'Inventory Management API',
        version: '1.0.0',
        status: 'Running',
        endpoints: expect.objectContaining({
          health: '/health',
          metrics: '/metrics',
          api: '/api/v1'
        }),
        message: expect.stringContaining('Inventory Management API')
      });
      expect(response.body.timestamp).toBeDefined();
    });
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toMatchObject({
        status: 'OK',
        timestamp: expect.any(String),
        service: 'Inventory Management API',
        version: '1.0.0'
      });
    });
  });

  describe('GET /metrics', () => {
    it('should return Prometheus metrics', async () => {
      const response = await request(app)
        .get('/metrics')
        .expect(200);

      expect(response.text).toContain('# HELP');
      expect(response.headers['content-type']).toMatch(/text\/plain/);
    });


  });

  describe('404 Handler', () => {
    it('should handle non-existent routes', async () => {
      const response = await request(app)
        .get('/non-existent-route')
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        message: 'Route /non-existent-route not found',
        timestamp: expect.any(String)
      });
    });
  });

  describe('GET /api/v1/dashboard/stats', () => {
    it('should return dashboard statistics', async () => {
      // Mock successful database responses
      const mockResults = [
        { rows: [{ total: '25' }] }, // products
        { rows: [{ total: '5' }] },  // categories
        { rows: [{ total: '10' }] }, // users
        { rows: [{ total_value: '12500.50' }] } // total value
      ];

      mockQuery.mockImplementation(() => 
        Promise.resolve(mockResults.shift() as any)
      );

      const response = await request(app)
        .get('/api/v1/dashboard/stats')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Dashboard stats retrieved successfully',
        data: expect.objectContaining({
          totalProducts: 25,
          totalCategories: 5,
          totalUsers: 10,
          totalValue: 12500.50
        }),
        timestamp: expect.any(String)
      });
    });

    it('should handle database errors in dashboard stats', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      mockQuery.mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .get('/api/v1/dashboard/stats')
        .expect(500);

      expect(response.body).toMatchObject({
        success: false,
        message: 'Error retrieving dashboard stats',
        timestamp: expect.any(String)
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('GET /api/v1/public/products', () => {
    it('should return public products list', async () => {
      const mockProducts = [
        {
          id: 1,
          name: 'Product 1',
          description: 'Description 1',
          price: 99.99,
          stock: 10,
          category: 'Category 1'
        },
        {
          id: 2,
          name: 'Product 2',
          description: 'Description 2',
          price: 149.99,
          stock: 5,
          category: 'Category 2'
        }
      ];

      mockQuery.mockResolvedValue({
        rows: mockProducts
      } as any);

      const response = await request(app)
        .get('/api/v1/public/products')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Products retrieved successfully',
        data: mockProducts,
        total: mockProducts.length,
        timestamp: expect.any(String)
      });
    });

    it('should handle database errors in public products', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      mockQuery.mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .get('/api/v1/public/products')
        .expect(500);

      expect(response.body).toMatchObject({
        success: false,
        message: 'Error retrieving products',
        timestamp: expect.any(String)
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('GET /api/v1/public/categories', () => {
    it('should return public categories list', async () => {
      const mockCategories = [
        {
          id: 1,
          name: 'Electronics',
          description: 'Electronic products'
        },
        {
          id: 2,
          name: 'Clothing',
          description: 'Clothing items'
        }
      ];

      mockQuery.mockResolvedValue({
        rows: mockCategories
      } as any);

      const response = await request(app)
        .get('/api/v1/public/categories')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Categories retrieved successfully',
        data: mockCategories,
        total: mockCategories.length,
        timestamp: expect.any(String)
      });
    });

    it('should handle database errors in public categories', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      mockQuery.mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .get('/api/v1/public/categories')
        .expect(500);

      expect(response.body).toMatchObject({
        success: false,
        message: 'Error retrieving categories',
        timestamp: expect.any(String)
      });

      consoleErrorSpy.mockRestore();
    });
  });
});
