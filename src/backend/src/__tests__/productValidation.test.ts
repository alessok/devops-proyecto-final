import {
  createProductSchema,
  updateProductSchema,
  paginationSchema
} from '../validation/schemas';

describe('Product Validation', () => {
  describe('createProductSchema', () => {
    it('should validate valid product data', () => {
      const validProduct = {
        name: 'Test Product',
        description: 'A test product description',
        price: 29.99,
        stockQuantity: 100,
        categoryId: 1
      };

      const { error, value } = createProductSchema.validate(validProduct);
      
      expect(error).toBeUndefined();
      expect(value).toEqual(validProduct);
    });

    it('should reject invalid product data', () => {
      const invalidProduct = {
        name: 'A', // too short
        description: '', // allow empty but let's test really invalid
        price: -10, // negative
        stockQuantity: -5, // negative
        categoryId: 'invalid' // not a number
      };

      const { error } = createProductSchema.validate(invalidProduct);
      
      expect(error).toBeDefined();
      expect(error?.details.length).toBeGreaterThan(0);
    });

    it('should require all fields', () => {
      const incompleteProduct = {
        name: 'Test Product'
        // missing other required fields
      };

      const { error } = createProductSchema.validate(incompleteProduct);
      
      expect(error).toBeDefined();
      expect(error?.details.length).toBeGreaterThan(0);
    });
  });

  describe('updateProductSchema', () => {
    it('should validate partial product updates', () => {
      const updateData = {
        name: 'Updated Product',
        price: 39.99
      };

      const { error, value } = updateProductSchema.validate(updateData);
      
      expect(error).toBeUndefined();
      expect(value).toEqual(updateData);
    });

    it('should allow empty updates', () => {
      const { error, value } = updateProductSchema.validate({});
      
      expect(error).toBeUndefined();
      expect(value).toEqual({});
    });

    it('should reject invalid update data', () => {
      const invalidUpdate = {
        name: 'A', // too short
        price: -10 // negative
      };

      const { error } = updateProductSchema.validate(invalidUpdate);
      
      expect(error).toBeDefined();
    });
  });

  describe('paginationSchema', () => {
    it('should validate query parameters', () => {
      const queryParams = {
        page: 1,
        limit: 10,
        search: 'test',
        sortBy: 'name',
        sortOrder: 'asc'
      };

      const { error, value } = paginationSchema.validate(queryParams);
      
      expect(error).toBeUndefined();
      expect(value.page).toBe(1);
      expect(value.limit).toBe(10);
    });

    it('should apply default values', () => {
      const { error, value } = paginationSchema.validate({});
      
      expect(error).toBeUndefined();
      expect(value.page).toBe(1);
      expect(value.limit).toBe(10);
      expect(value.sortBy).toBe('id');
      expect(value.sortOrder).toBe('asc');
    });

    it('should validate limit range', () => {
      const invalidQuery = {
        limit: 200 // exceeds max
      };

      const { error } = paginationSchema.validate(invalidQuery);
      
      expect(error).toBeDefined();
    });
  });
});
