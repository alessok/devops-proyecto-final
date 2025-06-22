import { 
  createProductSchema, 
  updateProductSchema, 
  ProductCreate, 
  ProductUpdate 
} from '../validation/productValidation';

describe('Product Validation', () => {
  describe('createProductSchema', () => {
    it('should validate valid product creation data', () => {
      const validData: ProductCreate = {
        name: 'Test Product',
        description: 'This is a test product description',
        price: 99.99,
        stockQuantity: 50,
        categoryId: 1
      };

      const { error, value } = createProductSchema.validate(validData);

      expect(error).toBeUndefined();
      expect(value).toEqual(validData);
    });

    it('should reject product with missing required fields', () => {
      const invalidData = {
        name: 'Test Product',
        // missing description, price, stockQuantity, categoryId
      };

      const { error } = createProductSchema.validate(invalidData);

      expect(error).toBeDefined();
      expect(error?.details).toHaveLength(4); // 4 missing required fields
    });

    it('should reject product with invalid name', () => {
      const invalidData = {
        name: 'T', // too short
        description: 'Valid description',
        price: 99.99,
        stockQuantity: 50,
        categoryId: 1
      };

      const { error } = createProductSchema.validate(invalidData);

      expect(error).toBeDefined();
      expect(error?.details[0].path).toContain('name');
    });

    it('should reject product with invalid price', () => {
      const invalidData = {
        name: 'Test Product',
        description: 'Valid description',
        price: -10, // negative price
        stockQuantity: 50,
        categoryId: 1
      };

      const { error } = createProductSchema.validate(invalidData);

      expect(error).toBeDefined();
      expect(error?.details[0].path).toContain('price');
    });

    it('should reject product with invalid stock quantity', () => {
      const invalidData = {
        name: 'Test Product',
        description: 'Valid description',
        price: 99.99,
        stockQuantity: -5, // negative stock
        categoryId: 1
      };

      const { error } = createProductSchema.validate(invalidData);

      expect(error).toBeDefined();
      expect(error?.details[0].path).toContain('stockQuantity');
    });

    it('should reject product with invalid category ID', () => {
      const invalidData = {
        name: 'Test Product',
        description: 'Valid description',
        price: 99.99,
        stockQuantity: 50,
        categoryId: 0 // invalid category ID
      };

      const { error } = createProductSchema.validate(invalidData);

      expect(error).toBeDefined();
      expect(error?.details[0].path).toContain('categoryId');
    });

    it('should reject product with description too long', () => {
      const invalidData = {
        name: 'Test Product',
        description: 'A'.repeat(501), // exceeds 500 character limit
        price: 99.99,
        stockQuantity: 50,
        categoryId: 1
      };

      const { error } = createProductSchema.validate(invalidData);

      expect(error).toBeDefined();
      expect(error?.details[0].path).toContain('description');
    });
  });

  describe('updateProductSchema', () => {
    it('should validate valid product update data', () => {
      const validData: ProductUpdate = {
        name: 'Updated Product',
        price: 149.99,
        stockQuantity: 25,
        isActive: true
      };

      const { error, value } = updateProductSchema.validate(validData);

      expect(error).toBeUndefined();
      expect(value).toEqual(validData);
    });

    it('should validate empty update data', () => {
      const validData = {};

      const { error, value } = updateProductSchema.validate(validData);

      expect(error).toBeUndefined();
      expect(value).toEqual(validData);
    });

    it('should validate partial update data', () => {
      const validData: Partial<ProductUpdate> = {
        name: 'Partially Updated Product',
        price: 199.99
      };

      const { error, value } = updateProductSchema.validate(validData);

      expect(error).toBeUndefined();
      expect(value).toEqual(validData);
    });

    it('should reject update with invalid name', () => {
      const invalidData = {
        name: 'T' // too short
      };

      const { error } = updateProductSchema.validate(invalidData);

      expect(error).toBeDefined();
      expect(error?.details[0].path).toContain('name');
    });

    it('should reject update with invalid price', () => {
      const invalidData = {
        price: -50 // negative price
      };

      const { error } = updateProductSchema.validate(invalidData);

      expect(error).toBeDefined();
      expect(error?.details[0].path).toContain('price');
    });

    it('should reject update with invalid stock quantity', () => {
      const invalidData = {
        stockQuantity: -10 // negative stock
      };

      const { error } = updateProductSchema.validate(invalidData);

      expect(error).toBeDefined();
      expect(error?.details[0].path).toContain('stockQuantity');
    });

    it('should reject update with invalid category ID', () => {
      const invalidData = {
        categoryId: -1 // invalid category ID
      };

      const { error } = updateProductSchema.validate(invalidData);

      expect(error).toBeDefined();
      expect(error?.details[0].path).toContain('categoryId');
    });

    it('should validate boolean isActive field', () => {
      const validData = {
        isActive: false
      };

      const { error, value } = updateProductSchema.validate(validData);

      expect(error).toBeUndefined();
      expect(value).toEqual(validData);
    });

    it('should reject non-boolean isActive field', () => {
      const invalidData = {
        isActive: 'true' // string instead of boolean
      };

      const { error } = updateProductSchema.validate(invalidData);

      expect(error).toBeDefined();
      expect(error?.details[0].path).toContain('isActive');
    });
  });
});
