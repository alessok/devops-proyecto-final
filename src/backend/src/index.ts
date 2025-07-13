import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import dotenv from 'dotenv';

// Middleware imports
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';
import { metricsMiddleware } from './middleware/metrics';
import { register, updateBusinessMetrics } from './services/metricsService';

// Route imports
import authRoutes from './routes/auth';
import productRoutes from './routes/products';
import userRoutes from './routes/users';
import categoryRoutes from './routes/categories';

// Database imports
import { pool } from './config/database';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware setup
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Metrics middleware
app.use(metricsMiddleware);

// Welcome/Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    service: 'Inventory Management API',
    version: '1.0.0',
    status: 'Running',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      metrics: '/metrics',
      api: '/api/v1',
      public_products: '/api/v1/public/products',
      public_categories: '/api/v1/public/categories',
      dashboard_stats: '/api/v1/dashboard/stats'
    },
    message: '🚀 Inventory Management API is running successfully!'
  });
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Inventory Management API',
    version: '1.0.0'
  });
});

// Metrics endpoint for Prometheus
app.get('/metrics', async (req: Request, res: Response) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    res.status(500).end(error);
  }
});

// API Routes
const API_BASE = process.env.API_BASE_URL || '/api/v1';

// Public dashboard stats endpoint (no authentication required)
app.get(`${API_BASE}/dashboard/stats`, async (req: Request, res: Response) => {
  try {
    // Get real statistics from database
    const [productsResult, categoriesResult, usersResult, totalValueResult] = await Promise.all([
      pool.query('SELECT COUNT(*) as total FROM products WHERE is_active = true'),
      pool.query('SELECT COUNT(*) as total FROM categories WHERE is_active = true'),
      pool.query('SELECT COUNT(*) as total FROM users WHERE is_active = true'),
      pool.query('SELECT COALESCE(SUM(price * stock_quantity), 0) as total_value FROM products WHERE is_active = true')
    ]);

    const stats = {
      totalProducts: parseInt(productsResult.rows[0].total),
      totalCategories: parseInt(categoriesResult.rows[0].total),
      totalUsers: parseInt(usersResult.rows[0].total),
      totalValue: parseFloat(totalValueResult.rows[0].total_value)
    };
    
    res.status(200).json({
      success: true,
      message: 'Dashboard stats retrieved successfully',
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving dashboard stats',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

// Public products endpoint (read-only, no authentication required)
app.get(`${API_BASE}/public/products`, async (req: Request, res: Response) => {
  try {
    // Get real products from database with category information
    const query = `
      SELECT 
        p.id,
        p.name,
        p.description,
        p.price,
        p.stock_quantity as stock,
        c.name as category
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.is_active = true
      ORDER BY p.name ASC
    `;
    
    const result = await pool.query(query);
    const products = result.rows;
    
    res.status(200).json({
      success: true,
      message: 'Products retrieved successfully',
      data: products,
      total: products.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting products:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving products',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

// Public categories endpoint (read-only, no authentication required)
app.get(`${API_BASE}/public/categories`, async (req: Request, res: Response) => {
  try {
    // Get real categories from database
    const query = `
      SELECT 
        id,
        name,
        description
      FROM categories
      WHERE is_active = true
      ORDER BY name ASC
    `;
    
    const result = await pool.query(query);
    const categories = result.rows;
    
    res.status(200).json({
      success: true,
      message: 'Categories retrieved successfully',
      data: categories,
      total: categories.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting categories:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving categories',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

// Protected API Routes
app.use(`${API_BASE}/auth`, authRoutes);
app.use(`${API_BASE}/products`, productRoutes);
app.use(`${API_BASE}/users`, userRoutes);
app.use(`${API_BASE}/categories`, categoryRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`📈 Metrics: http://localhost:${PORT}/metrics`);
    
    // Initialize business metrics
    updateBusinessMetrics();
    
    // Update business metrics every 30 seconds
    setInterval(updateBusinessMetrics, 30000);
    console.log('📊 Business metrics will update every 30 seconds');
  });
}

export default app;
