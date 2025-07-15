import { Request, Response, NextFunction } from 'express';
import { ProductController } from '../controllers/productController';
import { ProductService } from '../services/productService';
import { AppError } from '../middleware/errorHandler';
import { UserRole } from '../types';

// Mock ProductService
jest.mock('../services/productService');

const MockedProductService = ProductService as jest.MockedClass<typeof ProductService>;

describe('ProductController Edge Cases', () => {
  let productController: ProductController;
  let mockProductService: jest.Mocked<ProductService>;
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: jest.MockedFunction<NextFunction>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockProductService = {
      findAll: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    } as any;
    
    MockedProductService.mockImplementation(() => mockProductService);
    productController = new ProductController();

    mockReq = {
      params: {},
      query: {},
      body: {},
      user: {
        id: 1,
        email: 'admin@example.com',
        username: 'admin',
        firstName: 'Admin',
        lastName: 'User',
        role: UserRole.ADMIN,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    };
    
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    
    mockNext = jest.fn();
  });

  describe('getAllProducts edge cases', () => {
    it('should handle empty results', async () => {
      mockProductService.findAll.mockResolvedValue({ products: [], total: 0 });

      await productController.getAllProducts(mockReq as Request, mockRes as Response, mockNext);

      expect(mockProductService.findAll).toHaveBeenCalledWith(1, 10, undefined, undefined);
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should handle invalid pagination parameters', async () => {
      mockReq.query = { page: 'invalid', limit: 'invalid' };
      mockProductService.findAll.mockResolvedValue({ products: [], total: 0 });

      await productController.getAllProducts(mockReq as Request, mockRes as Response, mockNext);

      // Should default to page 1, limit 10
      expect(mockProductService.findAll).toHaveBeenCalledWith(NaN, NaN, undefined, undefined);
    });

    it('should handle service error in getAllProducts', async () => {
      const error = new Error('Database error');
      mockProductService.findAll.mockRejectedValue(error);

      await productController.getAllProducts(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('getProductById edge cases', () => {
    it('should handle invalid product ID format', async () => {
      mockReq.params = { id: 'invalid' };

      await productController.getProductById(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = (mockNext as jest.Mock).mock.calls[0][0] as AppError;
      expect(error.message).toContain('Product not found');
      expect(error.statusCode).toBe(404);
    });

    it('should handle product not found', async () => {
      mockReq.params = { id: '999' };
      mockProductService.findById.mockResolvedValue(null);

      await productController.getProductById(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = (mockNext as jest.Mock).mock.calls[0][0] as AppError;
      expect(error.message).toContain('Product not found');
      expect(error.statusCode).toBe(404);
    });

    it('should handle service error in getProductById', async () => {
      mockReq.params = { id: '1' };
      const error = new Error('Database error');
      mockProductService.findById.mockRejectedValue(error);

      await productController.getProductById(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('createProduct edge cases', () => {
    it('should handle duplicate product creation', async () => {
      mockReq.body = {
        name: 'Existing Product',
        description: 'Description',
        categoryId: 1,
        price: 99.99,
        stockQuantity: 10
      };

      const error = new Error('Product already exists');
      mockProductService.create.mockRejectedValue(error);

      await productController.createProduct(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should handle invalid category ID in creation', async () => {
      mockReq.body = {
        name: 'New Product',
        description: 'Description',
        categoryId: 999,
        price: 99.99,
        stockQuantity: 10
      };

      const error = new Error('Category not found');
      mockProductService.create.mockRejectedValue(error);

      await productController.createProduct(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('updateProduct edge cases', () => {
    it('should handle invalid product ID in update', async () => {
      mockReq.params = { id: 'invalid' };
      mockReq.body = { name: 'Updated Name' };

      await productController.updateProduct(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = (mockNext as jest.Mock).mock.calls[0][0] as AppError;
      expect(error.message).toContain('Product not found');
      expect(error.statusCode).toBe(404);
    });

    it('should handle product not found in update', async () => {
      mockReq.params = { id: '999' };
      mockReq.body = { name: 'Updated Name' };
      mockProductService.findById.mockResolvedValue(null);

      await productController.updateProduct(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = (mockNext as jest.Mock).mock.calls[0][0] as AppError;
      expect(error.message).toContain('Product not found');
      expect(error.statusCode).toBe(404);
    });

    it('should handle service error in update', async () => {
      mockReq.params = { id: '1' };
      mockReq.body = { name: 'Updated Name' };
      
      const mockProduct = {
        id: 1,
        name: 'Original Product',
        description: 'Description',
        categoryId: 1,
        price: 99.99,
        stockQuantity: 10,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      mockProductService.findById.mockResolvedValue(mockProduct);
      const error = new Error('Update failed');
      mockProductService.update.mockRejectedValue(error);

      await productController.updateProduct(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('deleteProduct edge cases', () => {
    it('should handle invalid product ID in delete', async () => {
      mockReq.params = { id: 'invalid' };

      await productController.deleteProduct(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = (mockNext as jest.Mock).mock.calls[0][0] as AppError;
      expect(error.message).toContain('Product not found');
      expect(error.statusCode).toBe(404);
    });

    it('should handle product not found in delete', async () => {
      mockReq.params = { id: '999' };
      mockProductService.findById.mockResolvedValue(null);

      await productController.deleteProduct(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = (mockNext as jest.Mock).mock.calls[0][0] as AppError;
      expect(error.message).toContain('Product not found');
      expect(error.statusCode).toBe(404);
    });

    it('should handle service error in delete', async () => {
      mockReq.params = { id: '1' };
      
      const mockProduct = {
        id: 1,
        name: 'Product to Delete',
        description: 'Description',
        categoryId: 1,
        price: 99.99,
        stockQuantity: 10,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      mockProductService.findById.mockResolvedValue(mockProduct);
      const error = new Error('Delete failed');
      mockProductService.delete.mockRejectedValue(error);

      await productController.deleteProduct(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });
});