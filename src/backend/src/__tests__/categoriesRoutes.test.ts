import request from 'supertest';
import { Express } from 'express';
import express from 'express';

// First, import the router directly to trigger code coverage
import categoriesRouter from '../routes/categories';

// Mock dependencies that would cause issues in tests
jest.mock('../services/categoryService');
jest.mock('../middleware/auth', () => ({
  authenticateToken: (req: any, res: any, next: any) => {
    req.user = { id: 1, role: 'admin' };
    next();
  },
  authorizeRoles: (...roles: any[]) => (req: any, res: any, next: any) => next()
}));

// Mock validation middleware
jest.mock('../validation/validator', () => ({
  validate: (schema: any) => (req: any, res: any, next: any) => next(),
  validateQuery: (schema: any) => (req: any, res: any, next: any) => next()
}));

import { CategoryService } from '../services/categoryService';

const MockedCategoryService = CategoryService as jest.MockedClass<typeof CategoryService>;

// Create an Express app for testing
import { errorHandler } from '../middleware/errorHandler';

const app: Express = express();
app.use(express.json());
app.use('/api/categories', categoriesRouter);
app.use(errorHandler);

describe('Categories Routes', () => {
  let mockCategoryService: jest.Mocked<CategoryService>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockCategoryService = {
      findAll: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    } as any;

    MockedCategoryService.mockImplementation(() => mockCategoryService);
  });

  describe('GET /api/categories', () => {
    it('should get all categories successfully', async () => {
      const mockCategories = [
        { id: 1, name: 'Electronics', description: 'Electronic items' },
        { id: 2, name: 'Clothing', description: 'Apparel and fashion' }
      ];

      mockCategoryService.findAll.mockResolvedValue(mockCategories);

      const response = await request(app)
        .get('/api/categories')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Categories retrieved successfully',
        data: mockCategories
      });
      expect(mockCategoryService.findAll).toHaveBeenCalled();
    });

    it('should handle service errors', async () => {
      mockCategoryService.findAll.mockRejectedValue(new Error('Database error'));

      await request(app)
        .get('/api/categories')
        .expect(500);

      expect(mockCategoryService.findAll).toHaveBeenCalled();
    });
  });

  describe('GET /api/categories/:id', () => {
    it('should get category by id successfully', async () => {
      const mockCategory = { id: 1, name: 'Electronics', description: 'Electronic items' };

      mockCategoryService.findById.mockResolvedValue(mockCategory);

      const response = await request(app)
        .get('/api/categories/1')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Category retrieved successfully',
        data: mockCategory
      });
      expect(mockCategoryService.findById).toHaveBeenCalledWith(1);
    });

    it('should handle invalid category id', async () => {
      mockCategoryService.findById.mockResolvedValue(null);

      await request(app)
        .get('/api/categories/999')
        .expect(404);

      expect(mockCategoryService.findById).toHaveBeenCalledWith(999);
    });
  });

  describe('POST /api/categories', () => {
    it('should create new category successfully', async () => {
      const categoryData = { name: 'Books', description: 'Books and literature' };
      const createdCategory = { id: 3, ...categoryData };

      mockCategoryService.create.mockResolvedValue(createdCategory);

      const response = await request(app)
        .post('/api/categories')
        .send(categoryData)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Category created successfully',
        data: createdCategory
      });
      expect(mockCategoryService.create).toHaveBeenCalledWith(categoryData);
    });

    it('should handle validation errors', async () => {
      const invalidData = { name: '', description: 'Invalid category' };

      await request(app)
        .post('/api/categories')
        .send(invalidData)
        .expect(400);

      expect(mockCategoryService.create).not.toHaveBeenCalled();
    });
  });

  describe('PUT /api/categories/:id', () => {
    it('should update category successfully', async () => {
      const updateData = { name: 'Updated Electronics', description: 'Updated description' };
      const updatedCategory = { id: 1, ...updateData };

      mockCategoryService.update.mockResolvedValue(updatedCategory);

      const response = await request(app)
        .put('/api/categories/1')
        .send(updateData)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Category updated successfully',
        data: updatedCategory
      });
      expect(mockCategoryService.update).toHaveBeenCalledWith(1, updateData);
    });

    it('should handle category not found', async () => {
      const updateData = { name: 'Updated Category' };
      mockCategoryService.update.mockResolvedValue(null);

      await request(app)
        .put('/api/categories/999')
        .send(updateData)
        .expect(404);

      expect(mockCategoryService.update).toHaveBeenCalledWith(999, updateData);
    });
  });

  describe('DELETE /api/categories/:id', () => {
    it('should delete category successfully', async () => {
      mockCategoryService.delete.mockResolvedValue(true);

      const response = await request(app)
        .delete('/api/categories/1')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Category deleted successfully'
      });
      expect(mockCategoryService.delete).toHaveBeenCalledWith(1);
    });

    it('should handle category not found for deletion', async () => {
      mockCategoryService.delete.mockResolvedValue(false);

      await request(app)
        .delete('/api/categories/999')
        .expect(404);

      expect(mockCategoryService.delete).toHaveBeenCalledWith(999);
    });
  });
});
