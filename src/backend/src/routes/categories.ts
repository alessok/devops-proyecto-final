import { Router } from 'express';
import { CategoryService } from '../services/categoryService';
import { validate } from '../validation/validator';
import { createCategorySchema, updateCategorySchema } from '../validation/schemas';
import { authenticateToken, authorizeRoles } from '../middleware/auth';
import { ApiResponse } from '../types';
import { AppError } from '../middleware/errorHandler';

const router = Router();
const categoryService = new CategoryService();

// All routes require authentication
router.use(authenticateToken);

// GET all categories
router.get('/', async (req, res, next) => {
  try {
    const categories = await categoryService.findAll();

    const response: ApiResponse = {
      success: true,
      message: 'Categories retrieved successfully',
      data: categories,
      timestamp: new Date().toISOString()
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
});

// GET category by ID
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const category = await categoryService.findById(parseInt(id));

    if (!category) {
      throw new AppError('Category not found', 404);
    }

    const response: ApiResponse = {
      success: true,
      message: 'Category retrieved successfully',
      data: category,
      timestamp: new Date().toISOString()
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
});

// CREATE category (admin or manager only)
router.post('/', 
  authorizeRoles('admin', 'manager'),
  validate(createCategorySchema),
  async (req, res, next) => {
    try {
      const categoryData = req.body;

      // Check if category name already exists
      const existingCategory = await categoryService.findByName(categoryData.name);
      if (existingCategory) {
        throw new AppError('Category with this name already exists', 409);
      }

      const newCategory = await categoryService.create(categoryData);

      const response: ApiResponse = {
        success: true,
        message: 'Category created successfully',
        data: newCategory,
        timestamp: new Date().toISOString()
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }
);

// UPDATE category (admin or manager only)
router.put('/:id', 
  authorizeRoles('admin', 'manager'),
  validate(updateCategorySchema),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      if (!id) {
        throw new AppError('Category ID is required', 400);
      }
      
      const categoryData = req.body;

      const category = await categoryService.findById(parseInt(id));
      if (!category) {
        throw new AppError('Category not found', 404);
      }

      // Check if new name already exists (if name is being updated)
      if (categoryData.name && categoryData.name !== category.name) {
        const nameExists = await categoryService.findByName(categoryData.name);
        if (nameExists) {
          throw new AppError('Category with this name already exists', 409);
        }
      }

      const updatedCategory = await categoryService.update(parseInt(id), categoryData);

      const response: ApiResponse = {
        success: true,
        message: 'Category updated successfully',
        data: updatedCategory,
        timestamp: new Date().toISOString()
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
);

// DELETE category (admin only)
router.delete('/:id', 
  authorizeRoles('admin'),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      if (!id) {
        throw new AppError('Category ID is required', 400);
      }

      const category = await categoryService.findById(parseInt(id));
      if (!category) {
        throw new AppError('Category not found', 404);
      }

      // Check if category has products
      const productCount = await categoryService.getProductCount(parseInt(id));
      if (productCount > 0) {
        throw new AppError('Cannot delete category with existing products', 400);
      }

      await categoryService.delete(parseInt(id));

      const response: ApiResponse = {
        success: true,
        message: 'Category deleted successfully',
        timestamp: new Date().toISOString()
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
