import { CategoryService } from '../services/categoryService';
import { pool } from '../config/database';

// Mock the database module
jest.mock('../config/database');

describe('CategoryService', () => {
  let categoryService: CategoryService;
  let mockPool: { query: jest.Mock };

  beforeAll(() => {
    mockPool = { query: jest.fn() };
    (pool as unknown as { query: jest.Mock }).query = mockPool.query;
    categoryService = new CategoryService();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('findById', () => {
    it('should return category when found', async () => {
      const mockCategory = {
        id: 1,
        name: 'Electronics',
        description: 'Electronic devices and accessories',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockPool.query.mockResolvedValue({ rows: [mockCategory] });

      const result = await categoryService.findById(1);

      expect(result).toEqual(mockCategory);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('FROM categories WHERE id = $1'),
        [1]
      );
    });

    it('should return null when category not found', async () => {
      mockPool.query.mockResolvedValue({ rows: [] });

      const result = await categoryService.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('findByName', () => {
    it('should return category when found by name', async () => {
      const mockCategory = {
        id: 1,
        name: 'Electronics',
        description: 'Electronic devices and accessories',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockPool.query.mockResolvedValue({ rows: [mockCategory] });

      const result = await categoryService.findByName('Electronics');

      expect(result).toEqual(mockCategory);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('FROM categories WHERE name = $1'),
        ['Electronics']
      );
    });

    it('should return null when category not found by name', async () => {
      mockPool.query.mockResolvedValue({ rows: [] });

      const result = await categoryService.findByName('NonExistent');

      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return all active categories', async () => {
      const mockCategories = [
        {
          id: 1,
          name: 'Electronics',
          description: 'Electronic devices',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 2,
          name: 'Clothing',
          description: 'Apparel and accessories',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      mockPool.query.mockResolvedValue({ rows: mockCategories });

      const result = await categoryService.findAll();

      expect(result).toEqual(mockCategories);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('FROM categories')
      );
    });

    it('should return empty array when no categories found', async () => {
      mockPool.query.mockResolvedValue({ rows: [] });

      const result = await categoryService.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('create', () => {
    it('should create category successfully', async () => {
      const categoryData = {
        name: 'Books',
        description: 'Books and literature'
      };

      const mockCreatedCategory = {
        id: 3,
        ...categoryData,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockPool.query.mockResolvedValue({ rows: [mockCreatedCategory] });

      const result = await categoryService.create(categoryData);

      expect(result).toEqual(mockCreatedCategory);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO categories (name, description)'),
        [categoryData.name, categoryData.description]
      );
    });
  });

  describe('update', () => {
    it('should update category successfully', async () => {
      const updateData = {
        name: 'Updated Electronics',
        description: 'Updated description'
      };

      const mockUpdatedCategory = {
        id: 1,
        name: 'Updated Electronics',
        description: 'Updated description',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockPool.query.mockResolvedValue({ rows: [mockUpdatedCategory] });

      const result = await categoryService.update(1, updateData);

      expect(result).toEqual(mockUpdatedCategory);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE categories SET'),
        expect.arrayContaining(['Updated Electronics', 'Updated description', 1])
      );
    });

    it('should update only name when only name provided', async () => {
      const updateData = { name: 'New Name' };

      const mockUpdatedCategory = {
        id: 1,
        name: 'New Name',
        description: 'Original description',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockPool.query.mockResolvedValue({ rows: [mockUpdatedCategory] });

      const result = await categoryService.update(1, updateData);

      expect(result).toEqual(mockUpdatedCategory);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE categories SET'),
        expect.arrayContaining(['New Name', 1])
      );
    });

    it('should update isActive status', async () => {
      const updateData = { isActive: false };

      const mockUpdatedCategory = {
        id: 1,
        name: 'Electronics',
        description: 'Electronic devices',
        isActive: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockPool.query.mockResolvedValue({ rows: [mockUpdatedCategory] });

      const result = await categoryService.update(1, updateData);

      expect(result).toEqual(mockUpdatedCategory);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE categories SET'),
        expect.arrayContaining([false, 1])
      );
    });

    it('should return existing category when no fields to update', async () => {
      const mockCategory = {
        id: 1,
        name: 'Electronics',
        description: 'Electronic devices',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Mock findById call
      mockPool.query.mockResolvedValue({ rows: [mockCategory] });

      const result = await categoryService.update(1, {});

      expect(result).toEqual(mockCategory);
    });

    it('should return null when category not found', async () => {
      const updateData = { name: 'New Name' };

      mockPool.query.mockResolvedValue({ rows: [] });

      const result = await categoryService.update(999, updateData);

      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    it('should soft delete category successfully', async () => {
      mockPool.query.mockResolvedValue({ rowCount: 1 });

      const result = await categoryService.delete(1);

      expect(result).toBe(true);
      expect(mockPool.query).toHaveBeenCalledWith(
        'UPDATE categories SET is_active = false, updated_at = NOW() WHERE id = $1',
        [1]
      );
    });

    it('should return false when category not found', async () => {
      mockPool.query.mockResolvedValue({ rowCount: 0 });

      const result = await categoryService.delete(999);

      expect(result).toBe(false);
    });
  });

  describe('getProductCount', () => {
    it('should return product count for category', async () => {
      mockPool.query.mockResolvedValue({ rows: [{ count: '5' }] });

      const result = await categoryService.getProductCount(1);

      expect(result).toBe(5);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT COUNT(*) as count FROM products'),
        [1]
      );
    });

    it('should return 0 when no products in category', async () => {
      mockPool.query.mockResolvedValue({ rows: [{ count: '0' }] });

      const result = await categoryService.getProductCount(1);

      expect(result).toBe(0);
    });
  });
});
