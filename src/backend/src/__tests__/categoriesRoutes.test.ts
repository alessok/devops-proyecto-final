import request from 'supertest';
import { Express } from 'express';
import express from 'express';
import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../types';

// First, import the router directly to trigger code coverage
import categoriesRouter from '../routes/categories';
import { CategoryService } from '../services/categoryService';

// Mock dependencies that would cause issues in tests
jest.mock('../services/categoryService');
jest.mock('../middleware/auth', () => {
  type ReqWithUser = Request & { user?: import('../types').User };
  return {
    authenticateToken: (req: ReqWithUser, res: Response, next: NextFunction) => {
      req.user = {
        id: 1,
        email: 'admin@example.com',
        username: 'admin',
        firstName: 'Admin',
        lastName: 'User',
        password: '',
        role: UserRole.ADMIN,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      next();
    },
    authorizeRoles: () => (req: Request, res: Response, next: NextFunction) => next()
  };
});

// Mock validation middleware
jest.mock('../validation/validator', () => ({
  validate: () => (req: Request, res: Response, next: NextFunction) => next(),
  validateQuery: () => (req: Request, res: Response, next: NextFunction) => next()
}));

// Create an Express app for testing
import { errorHandler } from '../middleware/errorHandler';

describe('Categories Routes', () => {
  let app: Express;

  beforeEach(() => {
    jest.clearAllMocks();
    // Crear una nueva app y router en cada test para inyectar los mocks correctamente
    app = express();
    app.use(express.json());
    app.use('/api/categories', categoriesRouter);
    app.use(errorHandler);
  });

  describe('GET /api/categories', () => {
    it('should get all categories successfully', async () => {
      const now = new Date();
      const nowStr = now.toISOString();
      const mockCategories = [
        { id: 1, name: 'Electronics', description: 'Electronic items', isActive: true, createdAt: nowStr, updatedAt: nowStr },
        { id: 2, name: 'Clothing', description: 'Apparel and fashion', isActive: true, createdAt: nowStr, updatedAt: nowStr }
      ];

      (CategoryService.prototype.findAll as jest.Mock).mockResolvedValue(mockCategories);

      const response = await request(app)
        .get('/api/categories')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Categories retrieved successfully',
        data: [
          expect.objectContaining({
            id: 1,
            name: 'Electronics',
            description: 'Electronic items',
            isActive: true,
            createdAt: expect.any(String),
            updatedAt: expect.any(String)
          }),
          expect.objectContaining({
            id: 2,
            name: 'Clothing',
            description: 'Apparel and fashion',
            isActive: true,
            createdAt: expect.any(String),
            updatedAt: expect.any(String)
          })
        ]
      });
      expect(CategoryService.prototype.findAll).toHaveBeenCalled();
    });

    it('should handle service errors', async () => {
      (CategoryService.prototype.findAll as jest.Mock).mockRejectedValue(new Error('Database error'));

      await request(app)
        .get('/api/categories')
        .expect(500);

      expect(CategoryService.prototype.findAll).toHaveBeenCalled();
    });
  });

  describe('GET /api/categories/:id', () => {
    it('should get category by id successfully', async () => {
      const now = new Date().toISOString();
      const mockCategory = {
        id: 1,
        name: 'Electronics',
        description: 'Electronic items',
        isActive: true,
        createdAt: now,
        updatedAt: now
      };

      (CategoryService.prototype.findById as jest.Mock).mockResolvedValue(mockCategory);

      const response = await request(app)
        .get('/api/categories/1')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Category retrieved successfully',
        data: expect.objectContaining({
          id: 1,
          name: 'Electronics',
          description: 'Electronic items',
          isActive: true,
          createdAt: expect.any(String),
          updatedAt: expect.any(String)
        })
      });
      expect(CategoryService.prototype.findById).toHaveBeenCalledWith(1);
    });

    it('should handle invalid category id', async () => {
      (CategoryService.prototype.findById as jest.Mock).mockResolvedValue(null);

      await request(app)
        .get('/api/categories/999')
        .expect(404);

      expect(CategoryService.prototype.findById).toHaveBeenCalledWith(999);
    });
  });

  describe('POST /api/categories', () => {
    it('should create new category successfully', async () => {
      const categoryData = { name: 'Books', description: 'Books and literature' };
      const now = new Date().toISOString();
      const createdCategory = {
        id: 3,
        ...categoryData,
        isActive: true,
        createdAt: now,
        updatedAt: now
      };

      (CategoryService.prototype.create as jest.Mock).mockResolvedValue(createdCategory);

      const response = await request(app)
        .post('/api/categories')
        .send(categoryData)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Category created successfully',
        data: expect.objectContaining({
          id: 3,
          name: 'Books',
          description: 'Books and literature',
          isActive: true,
          createdAt: expect.any(String),
          updatedAt: expect.any(String)
        })
      });
      expect(CategoryService.prototype.create).toHaveBeenCalledWith(categoryData);
    });

    it('should handle validation errors', async () => {
      const invalidData = { name: '', description: 'Invalid category' };
      jest.resetModules();
      jest.doMock('../validation/validator', () => ({
        validate: () => (req: Request, res: Response) => res.status(400).json({ success: false, message: 'Validation error' }),
        validateQuery: () => (req: Request, res: Response, next: NextFunction) => next()
      }));
      const categoriesRouterReloaded = (await import('../routes/categories')).default;
      const appTest = express();
      appTest.use(express.json());
      appTest.use('/api/categories', categoriesRouterReloaded);
      appTest.use(errorHandler);
      const response = await request(appTest)
        .post('/api/categories')
        .send(invalidData);
      expect(response.status).toBe(400);
      expect(CategoryService.prototype.create).not.toHaveBeenCalled();
    });
  });

  describe('PUT /api/categories/:id', () => {
    it('should update category successfully', async () => {
      const updateData = { name: 'Updated Electronics', description: 'Updated description' };
      const now = new Date().toISOString();
      const updatedCategory = {
        id: 1,
        ...updateData,
        isActive: true,
        createdAt: now,
        updatedAt: now
      };
      // Mock findById para que exista la categoría antes de actualizar
      (CategoryService.prototype.findById as jest.Mock).mockResolvedValue(updatedCategory);
      (CategoryService.prototype.update as jest.Mock).mockResolvedValue(updatedCategory);

      const response = await request(app)
        .put('/api/categories/1')
        .send(updateData)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Category updated successfully',
        data: expect.objectContaining({
          id: 1,
          name: 'Updated Electronics',
          description: 'Updated description',
          isActive: true,
          createdAt: expect.any(String),
          updatedAt: expect.any(String)
        })
      });
      expect(CategoryService.prototype.update).toHaveBeenCalledWith(1, updateData);
    });

    it('should handle category not found', async () => {
      const updateData = { name: 'Updated Category' };
      (CategoryService.prototype.findById as jest.Mock).mockResolvedValue(null);
      (CategoryService.prototype.update as jest.Mock).mockResolvedValue(null);

      await request(app)
        .put('/api/categories/999')
        .send(updateData)
        .expect(404);
      // No se debe esperar que update haya sido llamado
    });
  });

  describe('DELETE /api/categories/:id', () => {
    it('should delete category successfully', async () => {
      // Mock findById para que exista la categoría antes de eliminar
      (CategoryService.prototype.findById as jest.Mock).mockResolvedValue({ id: 1 });
      (CategoryService.prototype.delete as jest.Mock).mockResolvedValue(true);

      const response = await request(app)
        .delete('/api/categories/1')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Category deleted successfully'
      });
      expect(CategoryService.prototype.delete).toHaveBeenCalledWith(1);
    });

    it('should handle category not found for deletion', async () => {
      (CategoryService.prototype.findById as jest.Mock).mockResolvedValue(null);
      (CategoryService.prototype.delete as jest.Mock).mockResolvedValue(false);

      await request(app)
        .delete('/api/categories/999')
        .expect(404);
      // No se debe esperar que delete haya sido llamado
    });
  });
});
