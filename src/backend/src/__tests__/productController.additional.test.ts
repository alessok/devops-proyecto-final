import { Request, Response, NextFunction } from 'express';
import { ProductController } from '../controllers/productController';
import { ProductService } from '../services/productService';
import { AppError } from '../middleware/errorHandler';

// Mock ProductService
jest.mock('../services/productService');
const mockProductService = ProductService as jest.MockedClass<typeof ProductService>;

describe('ProductController - Additional Coverage', () => {
  let productController: ProductController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    productController = new ProductController();
    mockRequest = {
      params: {},
      body: {},
      query: {}
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('getProducts - Edge Cases', () => {
    it('should handle database errors gracefully', async () => {
      mockRequest.query = { page: '1', limit: '10' };
      mockProductService.prototype.findAll.mockRejectedValue(new Error('Database connection failed'));

      await productController.getAllProducts(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should handle invalid pagination parameters', async () => {
      mockRequest.query = { page: 'invalid', limit: 'invalid' };
      const mockProducts = { products: [], total: 0 };
      mockProductService.prototype.findAll.mockResolvedValue(mockProducts);

      await productController.getAllProducts(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockProductService.prototype.findAll).toHaveBeenCalledWith(1, 10);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });

    it('should handle empty search results', async () => {
      mockRequest.query = { search: 'nonexistent product' };
      const mockProducts = { products: [], total: 0 };
      mockProductService.prototype.findAll.mockResolvedValue(mockProducts);

      await productController.getAllProducts(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Products retrieved successfully',
        data: {
          products: [],
          pagination: {
            currentPage: 1,
            totalPages: 0,
            totalItems: 0,
            itemsPerPage: 10
          }
        },
        timestamp: expect.any(String)
      });
    });
  });

  describe('getProductById - Edge Cases', () => {
    it('should handle invalid product ID format', async () => {
      mockRequest.params = { id: 'invalid-id' };

      await productController.getProductById(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = (mockNext as jest.Mock).mock.calls[0][0] as AppError;
      expect(error.message).toBe('Invalid product ID');
      expect(error.statusCode).toBe(400);
    });

    it('should handle product not found', async () => {
      mockRequest.params = { id: '999' };
      mockProductService.prototype.findById.mockResolvedValue(null);

      await productController.getProductById(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = (mockNext as jest.Mock).mock.calls[0][0] as AppError;
      expect(error.message).toBe('Product not found');
      expect(error.statusCode).toBe(404);
    });
  });

  describe('createProduct - Edge Cases', () => {
    it('should handle service errors during creation', async () => {
      const mockProductData = {
        name: 'Test Product',
        description: 'Test description',
        price: 99.99,
        stockQuantity: 10,
        categoryId: 1
      };
      mockRequest.body = mockProductData;
      mockProductService.prototype.create.mockRejectedValue(new Error('Category not found'));

      await productController.createProduct(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should handle duplicate product name errors', async () => {
      const mockProductData = {
        name: 'Existing Product',
        description: 'Test description',
        price: 99.99,
        stockQuantity: 10,
        categoryId: 1
      };
      mockRequest.body = mockProductData;
      mockProductService.prototype.create.mockRejectedValue(new Error('Product name already exists'));

      await productController.createProduct(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('updateProduct - Edge Cases', () => {
    it('should handle invalid product ID for update', async () => {
      mockRequest.params = { id: 'invalid' };
      mockRequest.body = { name: 'Updated Name' };

      await productController.updateProduct(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = (mockNext as jest.Mock).mock.calls[0][0] as AppError;
      expect(error.message).toBe('Invalid product ID');
    });

    it('should handle update of non-existent product', async () => {
      mockRequest.params = { id: '999' };
      mockRequest.body = { name: 'Updated Name' };
      mockProductService.prototype.update.mockResolvedValue(null);

      await productController.updateProduct(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = (mockNext as jest.Mock).mock.calls[0][0] as AppError;
      expect(error.message).toBe('Product not found');
    });

    it('should handle empty update body', async () => {
      mockRequest.params = { id: '1' };
      mockRequest.body = {};

      await productController.updateProduct(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = (mockNext as jest.Mock).mock.calls[0][0] as AppError;
      expect(error.message).toBe('No data provided for update');
    });
  });

  describe('deleteProduct - Edge Cases', () => {
    it('should handle invalid product ID for deletion', async () => {
      mockRequest.params = { id: 'invalid' };

      await productController.deleteProduct(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = (mockNext as jest.Mock).mock.calls[0][0] as AppError;
      expect(error.message).toBe('Invalid product ID');
    });

    it('should handle deletion of non-existent product', async () => {
      mockRequest.params = { id: '999' };
      mockProductService.prototype.delete.mockResolvedValue(false);

      await productController.deleteProduct(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = (mockNext as jest.Mock).mock.calls[0][0] as AppError;
      expect(error.message).toBe('Product not found');
    });

    it('should handle successful deletion', async () => {
      mockRequest.params = { id: '1' };
      mockProductService.prototype.delete.mockResolvedValue(true);

      await productController.deleteProduct(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Product deleted successfully',
        timestamp: expect.any(String)
      });
    });
  });

  describe('Error Handling Coverage', () => {
    it('should handle unexpected errors in all methods', async () => {
      const unexpectedError = new Error('Unexpected database error');
      
      // Test error in getProducts
      mockProductService.prototype.findAll.mockRejectedValue(unexpectedError);
      await productController.getAllProducts(mockRequest as Request, mockResponse as Response, mockNext);
      expect(mockNext).toHaveBeenCalledWith(unexpectedError);

      // Reset mock
      jest.clearAllMocks();

      // Test error in findById
      mockRequest.params = { id: '1' };
      mockProductService.prototype.findById.mockRejectedValue(unexpectedError);
      await productController.getProductById(mockRequest as Request, mockResponse as Response, mockNext);
      expect(mockNext).toHaveBeenCalledWith(unexpectedError);
    });
  });
});
