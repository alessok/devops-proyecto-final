import { ProductService } from '../services/productService';
import pool from '../config/database';

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
        .mockResolvedValueOnce({ rows: [{ count: '1' }] })
        .mockResolvedValueOnce({ rows: mockProducts });

      const result = await productService.findAll(1, 10);

      expect(result.products).toEqual(mockProducts);
      expect(result.total).toBe(1);
    });
  });

  describe('create', () => {
    it('should create product successfully', async () => {
      const productData = {
        name: 'New Product',
        description: 'New Description',
        price: 149.99,
        categoryId: 1,
        stockQuantity: 20,
        minStockLevel: 5
      };

      const mockCreatedProduct = {
        id: 1,
        name: productData.name,
        description: productData.description,
        price: productData.price,
        category_id: productData.categoryId,
        stock_quantity: productData.stockQuantity,
        min_stock_level: productData.minStockLevel,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      };

      mockPool.query.mockResolvedValue({ rows: [mockCreatedProduct] });

      const result = await productService.create(productData);

      expect(result).toEqual(mockCreatedProduct);
    });
  });
});
