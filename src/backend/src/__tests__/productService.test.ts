import { ProductService } from '../services/productService';

// Mock the database module
jest.mock('../config/database');

describe('ProductService', () => {
  let productService: ProductService;
  let mockPool: any;

  beforeAll(() => {
    const dbModule = require('../config/database');
    mockPool = dbModule.default;
    productService = new ProductService();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('findById', () => {
    it('should return product when found', async () => {
      const mockProduct = {
        id: 1,
        name: 'Test Product',
        description: 'Test Description',
        sku: 'TEST001',
        categoryId: 1,
        price: 99.99,
        stockQuantity: 100,
        minStockLevel: 10,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        category_name: 'Test Category'
      };

      mockPool.query.mockResolvedValue({ rows: [mockProduct] });

      const result = await productService.findById(1);

      expect(result).toEqual(mockProduct);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT p.*, c.name as category_name'),
        [1]
      );
    });

    it('should return null when product not found', async () => {
      mockPool.query.mockResolvedValue({ rows: [] });

      const result = await productService.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('findBySku', () => {
    it('should return product when found by SKU', async () => {
      const mockProduct = {
        id: 1,
        name: 'Test Product',
        sku: 'TEST001',
        // ... other properties
      };

      mockPool.query.mockResolvedValue({ rows: [mockProduct] });

      const result = await productService.findBySku('TEST001');

      expect(result).toEqual(mockProduct);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM products WHERE sku = $1'),
        ['TEST001']
      );
    });
  });

  describe('create', () => {
    it('should create product successfully', async () => {
      const productData = {
        name: 'New Product',
        description: 'New Description',
        sku: 'NEW001',
        categoryId: 1,
        price: 149.99,
        stockQuantity: 50,
        minStockLevel: 5
      };

      const mockCreatedProduct = {
        id: 1,
        ...productData,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockPool.query.mockResolvedValue({ rows: [mockCreatedProduct] });

      const result = await productService.create(productData);

      expect(result).toEqual(mockCreatedProduct);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO products'),
        [
          productData.name,
          productData.description,
          productData.sku,
          productData.categoryId,
          productData.price,
          productData.stockQuantity,
          productData.minStockLevel
        ]
      );
    });
  });

  describe('update', () => {
    it('should update product successfully', async () => {
      const updateData = {
        name: 'Updated Product',
        price: 199.99
      };

      const mockUpdatedProduct = {
        id: 1,
        name: 'Updated Product',
        price: 199.99,
        // ... other properties
      };

      mockPool.query.mockResolvedValue({ rows: [mockUpdatedProduct] });

      const result = await productService.update(1, updateData);

      expect(result).toEqual(mockUpdatedProduct);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE products SET'),
        expect.arrayContaining(['Updated Product', 199.99, 1])
      );
    });
  });

  describe('findLowStock', () => {
    it('should return products with low stock', async () => {
      const mockLowStockProducts = [
        {
          id: 1,
          name: 'Low Stock Product 1',
          stockQuantity: 2,
          minStockLevel: 10,
          category_name: 'Category 1'
        },
        {
          id: 2,
          name: 'Low Stock Product 2',
          stockQuantity: 0,
          minStockLevel: 5,
          category_name: 'Category 2'
        }
      ];

      mockPool.query.mockResolvedValue({ rows: mockLowStockProducts });

      const result = await productService.findLowStock();

      expect(result).toEqual(mockLowStockProducts);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE p.stock_quantity <= p.min_stock_level')
      );
    });
  });

  describe('updateStock', () => {
    it('should update stock quantity', async () => {
      const mockUpdatedProduct = {
        id: 1,
        stockQuantity: 75, // 50 + 25
        // ... other properties
      };

      mockPool.query.mockResolvedValue({ rows: [mockUpdatedProduct] });

      const result = await productService.updateStock(1, 25);

      expect(result).toEqual(mockUpdatedProduct);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('SET stock_quantity = stock_quantity + $1'),
        [25, 1]
      );
    });
  });

  describe('getInventoryStats', () => {
    it('should return inventory statistics', async () => {
      const mockStats = {
        total_products: '150',
        total_stock: '5000',
        low_stock_count: '15',
        average_price: '89.99'
      };

      mockPool.query.mockResolvedValue({ rows: [mockStats] });

      const result = await productService.getInventoryStats();

      expect(result).toEqual(mockStats);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('COUNT(*) as total_products')
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated products', async () => {
      const mockProducts = [
        { id: 1, name: 'Product 1', category_name: 'Category 1' },
        { id: 2, name: 'Product 2', category_name: 'Category 2' }
      ];

      // Mock count query and data query
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ count: '2' }] })
        .mockResolvedValueOnce({ rows: mockProducts });

      const result = await productService.findAll(1, 10);

      expect(result.products).toEqual(mockProducts);
      expect(result.total).toBe(2);
      expect(mockPool.query).toHaveBeenCalledTimes(2);
    });

    it('should filter by search term', async () => {
      const mockProducts = [
        { id: 1, name: 'Laptop', category_name: 'Electronics' }
      ];

      mockPool.query
        .mockResolvedValueOnce({ rows: [{ count: '1' }] })
        .mockResolvedValueOnce({ rows: mockProducts });

      const result = await productService.findAll(1, 10, 'laptop');

      expect(result.products).toEqual(mockProducts);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('ILIKE'),
        expect.arrayContaining(['%laptop%'])
      );
    });

    it('should filter by category', async () => {
      const mockProducts = [
        { id: 1, name: 'Laptop', categoryId: 1, category_name: 'Electronics' }
      ];

      mockPool.query
        .mockResolvedValueOnce({ rows: [{ count: '1' }] })
        .mockResolvedValueOnce({ rows: mockProducts });

      const result = await productService.findAll(1, 10, undefined, 1);

      expect(result.products).toEqual(mockProducts);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('category_id = $1'),
        expect.arrayContaining([1])
      );
    });
  });
});
