import { ProductService } from '../services/productService';
import { pool } from '../config/database';

// Mock the database module
jest.mock('../config/database');

describe('ProductService', () => {
  let productService: ProductService;
  let mockPool: { query: jest.Mock };

  beforeAll(() => {
    mockPool = { query: jest.fn() };
    (pool as any).query = mockPool.query;
    productService = new ProductService();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('findById', () => {
    it('should find product by ID', async () => {
      const mockProduct = {
        id: 1,
        name: 'Test Product',
        description: 'Test Description',
        price: 99.99,
        stock_quantity: 10,
        category_id: 1,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
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

  describe('findAll', () => {
    it('should return products and total count', async () => {
      const mockProducts = [
        {
          id: 1,
          name: 'Product 1',
          description: 'Description 1',
          price: 99.99,
          stock_quantity: 10,
          category_name: 'Category 1'
        }
      ];

      mockPool.query
        .mockResolvedValueOnce({ rows: [{ count: '1' }] as Array<{ count: string }> })
        .mockResolvedValueOnce({ rows: mockProducts });

      const result = await productService.findAll(1, 10);

      expect(result.products).toEqual(mockProducts);
      expect(result.total).toBe(1);
    });

    it('should find products with search filter', async () => {
      const mockProducts = [
        {
          id: 1,
          name: 'Search Product',
          description: 'Product for search test',
          category_name: 'Test Category'
        }
      ];

      mockPool.query
        .mockResolvedValueOnce({ rows: [{ count: '1' }] as Array<{ count: string }> })
        .mockResolvedValueOnce({ rows: mockProducts });

      const result = await productService.findAll(1, 10, 'Search');

      expect(result.products).toEqual(mockProducts);
      expect(result.total).toBe(1);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('AND (p.name ILIKE $1 OR p.description ILIKE $1)'),
        ['%Search%', 10, 0]
      );
    });

    it('should find products with category filter', async () => {
      const mockProducts = [
        {
          id: 1,
          name: 'Category Product',
          category_id: 1,
          category_name: 'Specific Category'
        }
      ];

      mockPool.query
        .mockResolvedValueOnce({ rows: [{ count: '1' }] as Array<{ count: string }> })
        .mockResolvedValueOnce({ rows: mockProducts });

      const result = await productService.findAll(1, 10, undefined, 1);

      expect(result.products).toEqual(mockProducts);
      expect(result.total).toBe(1);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('AND p.category_id = $1'),
        [1, 10, 0]
      );
    });
  });

  describe('create', () => {
    it('should create product successfully', async () => {
      const productData = {
        name: 'New Product',
        description: 'New Description',
        price: 149.99,
        categoryId: 1,
        stockQuantity: 20
      };

      const mockCreatedProduct = {
        id: 1,
        name: productData.name,
        description: productData.description,
        price: productData.price,
        category_id: productData.categoryId,
        stock_quantity: productData.stockQuantity,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      };

      mockPool.query.mockResolvedValue({ rows: [mockCreatedProduct] });

      const result = await productService.create(productData);

      expect(result).toEqual(mockCreatedProduct);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO products'),
        [
          productData.name,
          productData.description,
          productData.categoryId,
          productData.price,
          productData.stockQuantity
        ]
      );
    });
  });

  describe('update', () => {
    it('should update product successfully', async () => {
      const productId = 1;
      const updateData = {
        name: 'Updated Product',
        description: 'Updated Description',
        price: 199.99
      };

      const mockUpdatedProduct = {
        id: productId,
        name: updateData.name,
        description: updateData.description,
        price: updateData.price,
        category_id: 1,
        stock_quantity: 20,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      };

      mockPool.query.mockResolvedValue({ rows: [mockUpdatedProduct] });

      const result = await productService.update(productId, updateData);

      expect(result).toEqual(mockUpdatedProduct);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE products SET'),
        expect.arrayContaining([updateData.name, updateData.description, updateData.price, productId])
      );
    });

    it('should return existing product when no fields to update', async () => {
      const productId = 1;
      const updateData = {};

      const mockProduct = {
        id: productId,
        name: 'Existing Product',
        description: 'Existing Description',
        price: 99.99,
        category_id: 1,
        stock_quantity: 10,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      };

      // Mock the findById call that happens when no fields to update
      mockPool.query.mockResolvedValue({ rows: [mockProduct] });

      const result = await productService.update(productId, updateData);

      expect(result).toEqual(mockProduct);
    });
  });

  describe('delete', () => {
    it('should soft delete product successfully', async () => {
      mockPool.query.mockResolvedValue({ rowCount: 1 });

      const result = await productService.delete(1);

      expect(result).toBe(true);
      expect(mockPool.query).toHaveBeenCalledWith(
        'UPDATE products SET is_active = false, updated_at = NOW() WHERE id = $1',
        [1]
      );
    });

    it('should return false when product not found', async () => {
      mockPool.query.mockResolvedValue({ rowCount: 0 });

      const result = await productService.delete(999);

      expect(result).toBe(false);
    });
  });

  describe('updateStock', () => {
    it('should update stock successfully', async () => {
      const productId = 1;
      const quantity = 5;

      const mockUpdatedProduct = {
        id: productId,
        name: 'Test Product',
        stock_quantity: 15,
        is_active: true,
        updated_at: new Date()
      };

      mockPool.query.mockResolvedValue({ rows: [mockUpdatedProduct] });

      const result = await productService.updateStock(productId, quantity);

      expect(result).toEqual(mockUpdatedProduct);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE products'),
        [quantity, productId]
      );
    });

    it('should return null when product not found', async () => {
      mockPool.query.mockResolvedValue({ rows: [] });

      const result = await productService.updateStock(999, 5);

      expect(result).toBeNull();
    });
  });

  describe('findLowStock', () => {
    it('should return low stock products', async () => {
      const mockLowStockProducts = [
        {
          id: 1,
          name: 'Low Stock Product 1',
          stock_quantity: 3,
          category_name: 'Category 1'
        },
        {
          id: 2,
          name: 'Low Stock Product 2',
          stock_quantity: 7,
          category_name: 'Category 2'
        }
      ];

      mockPool.query.mockResolvedValue({ rows: mockLowStockProducts });

      const result = await productService.findLowStock();

      expect(result).toEqual(mockLowStockProducts);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE p.stock_quantity <= 10')
      );
    });

    it('should return empty array when no low stock products', async () => {
      mockPool.query.mockResolvedValue({ rows: [] });

      const result = await productService.findLowStock();

      expect(result).toEqual([]);
    });
  });

  describe('getInventoryStats', () => {
    it('should return inventory statistics', async () => {
      const mockStats = {
        total_products: '25',
        total_stock: '450',
        low_stock_count: '3',
        average_price: '125.50'
      };

      mockPool.query.mockResolvedValue({ rows: [mockStats] });

      const result = await productService.getInventoryStats();

      expect(result).toEqual(mockStats);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('COUNT(*) as total_products')
      );
    });
  });
});
