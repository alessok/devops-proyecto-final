import client from 'prom-client';

// Create a Registry which registers the metrics
const register = new client.Registry();

// Add a default label which is added to all metrics
register.setDefaultLabels({
  app: 'inventory-backend'
});

// Enable the collection of default metrics
client.collectDefaultMetrics({ register });

// Custom metrics
const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register]
});

const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5],
  registers: [register]
});

const activeConnections = new client.Gauge({
  name: 'active_connections',
  help: 'Number of active connections',
  registers: [register]
});

const databaseConnectionPool = new client.Gauge({
  name: 'database_connection_pool_size',
  help: 'Size of database connection pool',
  registers: [register]
});

const businessMetrics = {
  totalUsers: new client.Gauge({
    name: 'total_users',
    help: 'Total number of users in the system',
    registers: [register]
  }),
  
  totalProducts: new client.Gauge({
    name: 'total_products',
    help: 'Total number of products in the system',
    registers: [register]
  }),
  
  lowStockProducts: new client.Gauge({
    name: 'low_stock_products',
    help: 'Number of products with low stock',
    registers: [register]
  }),
  
  totalCategories: new client.Gauge({
    name: 'total_categories',
    help: 'Total number of categories in the system',
    registers: [register]
  })
};

// Function to update business metrics with real database data
export async function updateBusinessMetrics() {
  try {
    const { pool } = await import('../config/database');
    
    // Get real counts from database
    const [productsResult, categoriesResult, usersResult, lowStockResult] = await Promise.all([
      pool.query('SELECT COUNT(*) as total FROM products WHERE is_active = true'),
      pool.query('SELECT COUNT(*) as total FROM categories WHERE is_active = true'),
      pool.query('SELECT COUNT(*) as total FROM users WHERE is_active = true'),
      pool.query('SELECT COUNT(*) as total FROM products WHERE is_active = true AND stock_quantity <= min_stock_level')
    ]);

    // Update metrics with real values
    businessMetrics.totalProducts.set(parseInt(productsResult.rows[0].total) || 0);
    businessMetrics.totalCategories.set(parseInt(categoriesResult.rows[0].total) || 0);
    businessMetrics.totalUsers.set(parseInt(usersResult.rows[0].total) || 0);
    businessMetrics.lowStockProducts.set(parseInt(lowStockResult.rows[0].total) || 0);
    
    console.log('Business metrics updated:', {
      products: productsResult.rows[0].total,
      categories: categoriesResult.rows[0].total,
      users: usersResult.rows[0].total,
      lowStock: lowStockResult.rows[0].total
    });
  } catch (error) {
    console.error('Error updating business metrics:', error);
  }
}

export {
  register,
  httpRequestsTotal,
  httpRequestDuration,
  activeConnections,
  databaseConnectionPool,
  businessMetrics
};
