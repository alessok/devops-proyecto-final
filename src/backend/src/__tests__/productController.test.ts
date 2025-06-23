import { Request, Response, NextFunction } from 'express';
import { ProductController } from '../controllers/productController';
import { ProductService } from '../services/productService';
import { AppError } from '../middleware/errorHandler';

// Mock ProductService
jest.mock('../services/productService');

const MockedProductService = ProductService as jest.MockedClass<typeof ProductService>;

describe('ProductController', () => {
  let productController: ProductController;
  let mockProductService: jest.Mocked<ProductService>;
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

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

    // Inyección explícita de la instancia mockeada
    productController = new ProductController(mockProductService);
    
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    mockNext = jest.fn();
    
    mockReq = {
      query: {},
      body: {},
      params: {}
    };
    
    mockRes = {
      status: mockStatus,
      json: mockJson
    };
  });

  describe('getAllProducts', () => {
    it('should get all products with pagination', async () => {
      const mockProducts = [
        {
          id: 1,
          name: 'Product 1',
          description: 'desc',
          price: 100,
          categoryId: 1,
          stockQuantity: 10,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 2,
          name: 'Product 2',
          description: 'desc',
          price: 200,
          categoryId: 2,
          stockQuantity: 5,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      mockReq.query = { page: '1', limit: '10' };
      mockProductService.findAll.mockResolvedValue({ products: mockProducts, total: 2 });

      await productController.getAllProducts(mockReq as Request, mockRes as Response, mockNext);

      expect(mockProductService.findAll).toHaveBeenCalledWith(1, 10, undefined, undefined);
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Products retrieved successfully',
          data: expect.objectContaining({
            data: mockProducts,
            pagination: expect.objectContaining({
              currentPage: 1,
              totalPages: 1,
              totalItems: 2,
              itemsPerPage: 10
            })
          })
        })
      );
    });

    it('should handle search and category filter', async () => {
      const mockProducts = [
        {
          id: 1,
          name: 'Electronics Product',
          description: 'desc',
          price: 100,
          categoryId: 1,
          stockQuantity: 10,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      mockReq.query = { page: '1', limit: '10', search: 'electronics', categoryId: '1' };
      mockProductService.findAll.mockResolvedValue({ products: mockProducts, total: 1 });

      await productController.getAllProducts(mockReq as Request, mockRes as Response, mockNext);

      expect(mockProductService.findAll).toHaveBeenCalledWith(1, 10, 'electronics', 1);
      expect(mockStatus).toHaveBeenCalledWith(200);
    });

    it('should handle service errors', async () => {
      mockReq.query = { page: '1', limit: '10' };
      const error = new Error('Database error');
      mockProductService.findAll.mockRejectedValue(error);

      await productController.getAllProducts(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('getProductById', () => {
    it('should get product by id successfully', async () => {
      const mockProduct = {
        id: 1,
        name: 'Product 1',
        description: 'desc',
        price: 100,
        categoryId: 1,
        stockQuantity: 10,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      mockReq.params = { id: '1' };
      mockProductService.findById.mockResolvedValue(mockProduct);

      await productController.getProductById(mockReq as Request, mockRes as Response, mockNext);

      expect(mockProductService.findById).toHaveBeenCalledWith(1);
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Product retrieved successfully',
          data: mockProduct
        })
      );
    });

    it('should handle product not found', async () => {
      mockReq.params = { id: '999' };
      mockProductService.findById.mockResolvedValue(null);

      await productController.getProductById(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.any(AppError)
      );
    });

    it('should handle service errors', async () => {
      mockReq.params = { id: '1' };
      const error = new Error('Database error');
      mockProductService.findById.mockRejectedValue(error);

      await productController.getProductById(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('createProduct', () => {
    it('should create product successfully', async () => {
      const productData = {
        name: 'New Product',
        description: 'desc',
        price: 150,
        categoryId: 1,
        stockQuantity: 10
      };
      const createdProduct = {
        id: 1,
        ...productData,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockReq.body = productData;
      mockProductService.create.mockResolvedValue(createdProduct);

      await productController.createProduct(mockReq as Request, mockRes as Response, mockNext);

      expect(mockProductService.create).toHaveBeenCalledWith(productData);
      expect(mockStatus).toHaveBeenCalledWith(201);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Product created successfully',
          data: createdProduct
        })
      );
    });

    it('should handle service errors during creation', async () => {
      const productData = { name: 'New Product', price: 150 };
      const error = new Error('Creation failed');

      mockReq.body = productData;
      mockProductService.create.mockRejectedValue(error);

      await productController.createProduct(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('updateProduct', () => {
    it('should update product successfully', async () => {
      const updateData = { name: 'Updated Product', price: 200 };
      const updatedProduct = {
        id: 1,
        name: 'Updated Product',
        description: 'desc',
        price: 200,
        categoryId: 1,
        stockQuantity: 10,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockReq.params = { id: '1' };
      mockReq.body = updateData;
      // Mock findById para que devuelva un producto existente
      mockProductService.findById.mockResolvedValue(updatedProduct);
      mockProductService.update.mockResolvedValue(updatedProduct);

      await productController.updateProduct(mockReq as Request, mockRes as Response, mockNext);

      expect(mockProductService.findById).toHaveBeenCalledWith(1);
      expect(mockProductService.update).toHaveBeenCalledWith(1, updateData);
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Product updated successfully',
          data: updatedProduct
        })
      );
    });

    it('should handle product not found for update', async () => {
      const updateData = { name: 'Updated Product' };

      mockReq.params = { id: '999' };
      mockReq.body = updateData;
      // Mock findById para que devuelva null
      mockProductService.findById.mockResolvedValue(null);

      await productController.updateProduct(mockReq as Request, mockRes as Response, mockNext);

      expect(mockProductService.findById).toHaveBeenCalledWith(999);
      expect(mockNext).toHaveBeenCalledWith(
        expect.any(AppError)
      );
    });

    it('should handle service errors during update', async () => {
      const updateData = { name: 'Updated Product' };
      const error = new Error('Update failed');

      mockReq.params = { id: '1' };
      mockReq.body = updateData;
      // Mock findById para que devuelva un producto existente
      const existingProduct = {
        id: 1,
        name: 'Product 1',
        description: 'desc',
        price: 100,
        categoryId: 1,
        stockQuantity: 10,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      mockProductService.findById.mockResolvedValue(existingProduct);
      mockProductService.update.mockRejectedValue(error);

      await productController.updateProduct(mockReq as Request, mockRes as Response, mockNext);

      expect(mockProductService.findById).toHaveBeenCalledWith(1);
      expect(mockProductService.update).toHaveBeenCalledWith(1, updateData);
      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('deleteProduct', () => {
    it('should delete product successfully', async () => {
      mockReq.params = { id: '1' };
      // Mock findById para que devuelva un producto existente
      const existingProduct = {
        id: 1,
        name: 'Product 1',
        description: 'desc',
        price: 100,
        categoryId: 1,
        stockQuantity: 10,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      mockProductService.findById.mockResolvedValue(existingProduct);
      mockProductService.delete.mockResolvedValue(true);

      await productController.deleteProduct(mockReq as Request, mockRes as Response, mockNext);

      expect(mockProductService.findById).toHaveBeenCalledWith(1);
      expect(mockProductService.delete).toHaveBeenCalledWith(1);
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Product deleted successfully'
        })
      );
    });

    it('should handle product not found for deletion', async () => {
      mockReq.params = { id: '999' };
      // Mock findById para que devuelva null
      mockProductService.findById.mockResolvedValue(null);

      await productController.deleteProduct(mockReq as Request, mockRes as Response, mockNext);

      expect(mockProductService.findById).toHaveBeenCalledWith(999);
      expect(mockNext).toHaveBeenCalledWith(
        expect.any(AppError)
      );
    });

    it('should handle service errors during deletion', async () => {
      const error = new Error('Deletion failed');

      mockReq.params = { id: '1' };
      // Mock findById para que devuelva un producto existente
      const existingProduct = {
        id: 1,
        name: 'Product 1',
        description: 'desc',
        price: 100,
        categoryId: 1,
        stockQuantity: 10,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      mockProductService.findById.mockResolvedValue(existingProduct);
      mockProductService.delete.mockRejectedValue(error);

      await productController.deleteProduct(mockReq as Request, mockRes as Response, mockNext);

      expect(mockProductService.findById).toHaveBeenCalledWith(1);
      expect(mockProductService.delete).toHaveBeenCalledWith(1);
      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });
});
