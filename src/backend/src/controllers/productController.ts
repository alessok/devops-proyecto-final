import { Request, Response, NextFunction } from 'express';
import { ProductService } from '../services/productService';
import { AppError } from '../middleware/errorHandler';
import { ApiResponse, PaginatedResponse } from '../types';

export class ProductController {
  private productService: ProductService;

  constructor(productService?: ProductService) {
    this.productService = productService || new ProductService();
  }

  async getAllProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page = 1, limit = 10, search, categoryId } = req.query as any;
      const { products, total } = await this.productService.findAll(
        parseInt(page),
        parseInt(limit),
        search,
        categoryId ? parseInt(categoryId) : undefined
      );
      const totalPages = Math.ceil(total / limit);
      const paginatedResponse: PaginatedResponse<any> = {
        data: products,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      };
      const response: ApiResponse<PaginatedResponse<any>> = {
        success: true,
        message: 'Products retrieved successfully',
        data: paginatedResponse,
        timestamp: new Date().toISOString()
      };
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  async getProductById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      if (!id) {
        throw new AppError('Product ID is required', 400);
      }
      const product = await this.productService.findById(parseInt(id));
      if (!product) {
        throw new AppError('Product not found', 404);
      }
      const response: ApiResponse = {
        success: true,
        message: 'Product retrieved successfully',
        data: product,
        timestamp: new Date().toISOString()
      };
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  async createProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const productData = req.body;
      const newProduct = await this.productService.create(productData);
      const response: ApiResponse = {
        success: true,
        message: 'Product created successfully',
        data: newProduct,
        timestamp: new Date().toISOString()
      };
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  async updateProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      if (!id) {
        throw new AppError('Product ID is required', 400);
      }
      const productData = req.body;
      const existingProduct = await this.productService.findById(parseInt(id));
      if (!existingProduct) {
        throw new AppError('Product not found', 404);
      }
      const updatedProduct = await this.productService.update(parseInt(id), productData);
      const response: ApiResponse = {
        success: true,
        message: 'Product updated successfully',
        data: updatedProduct,
        timestamp: new Date().toISOString()
      };
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  async deleteProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      if (!id) {
        throw new AppError('Product ID is required', 400);
      }
      const product = await this.productService.findById(parseInt(id));
      if (!product) {
        throw new AppError('Product not found', 404);
      }
      await this.productService.delete(parseInt(id));
      const response: ApiResponse = {
        success: true,
        message: 'Product deleted successfully',
        timestamp: new Date().toISOString()
      };
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  async updateStock(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      if (!id) {
        throw new AppError('Product ID is required', 400);
      }
      const { quantity } = req.body;
      if (typeof quantity !== 'number') {
        throw new AppError('Quantity must be a number', 400);
      }
      const product = await this.productService.findById(parseInt(id));
      if (!product) {
        throw new AppError('Product not found', 404);
      }
      const updatedProduct = await this.productService.updateStock(parseInt(id), quantity);
      const response: ApiResponse = {
        success: true,
        message: 'Stock updated successfully',
        data: updatedProduct,
        timestamp: new Date().toISOString()
      };
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  async getLowStockProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const products = await this.productService.findLowStock();
      const response: ApiResponse = {
        success: true,
        message: 'Low stock products retrieved successfully',
        data: products,
        timestamp: new Date().toISOString()
      };
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  async getInventoryStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await this.productService.getInventoryStats();
      const response: ApiResponse = {
        success: true,
        message: 'Inventory statistics retrieved successfully',
        data: stats,
        timestamp: new Date().toISOString()
      };
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
}
