import {
  createUserSchema,
  updateUserSchema,
  loginSchema,
  registerSchema,
  createProductSchema,
  updateProductSchema,
  createCategorySchema,
  updateCategorySchema,
  paginationSchema
} from '../validation/schemas';

describe('Validation Schemas Additional Tests', () => {
  describe('createUserSchema', () => {
    it('should validate valid user data', () => {
      const validData = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        role: 'employee'
      };

      const { error, value } = createUserSchema.validate(validData);
      expect(error).toBeUndefined();
      expect(value).toEqual(validData);
    });

    it('should apply default role when not provided', () => {
      const userData = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe'
      };

      const { error, value } = createUserSchema.validate(userData);
      expect(error).toBeUndefined();
      expect(value.role).toBe('employee');
    });

    it('should reject invalid email format', () => {
      const invalidData = {
        email: 'invalid-email',
        username: 'testuser',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe'
      };

      const { error } = createUserSchema.validate(invalidData);
      expect(error).toBeDefined();
      expect(error?.details?.[0]?.message).toContain('email');
    });

    it('should reject short username', () => {
      const invalidData = {
        email: 'test@example.com',
        username: 'ab',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe'
      };

      const { error } = createUserSchema.validate(invalidData);
      expect(error).toBeDefined();
      expect(error?.details?.[0]?.message).toContain('username');
    });

    it('should reject short password', () => {
      const invalidData = {
        email: 'test@example.com',
        username: 'testuser',
        password: '123',
        firstName: 'John',
        lastName: 'Doe'
      };

      const { error } = createUserSchema.validate(invalidData);
      expect(error).toBeDefined();
      expect(error?.details?.[0]?.message).toContain('password');
    });

    it('should reject invalid role', () => {
      const invalidData = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        role: 'invalid-role'
      };

      const { error } = createUserSchema.validate(invalidData);
      expect(error).toBeDefined();
      expect(error?.details?.[0]?.message).toContain('role');
    });
  });

  describe('updateUserSchema', () => {
    it('should validate partial user update', () => {
      const updateData = {
        email: 'newemail@example.com',
        firstName: 'Jane'
      };

      const { error, value } = updateUserSchema.validate(updateData);
      expect(error).toBeUndefined();
      expect(value).toEqual(updateData);
    });

    it('should validate isActive boolean field', () => {
      const updateData = {
        isActive: false
      };

      const { error, value } = updateUserSchema.validate(updateData);
      expect(error).toBeUndefined();
      expect(value.isActive).toBe(false);
    });

    it('should reject invalid email in update', () => {
      const invalidData = {
        email: 'invalid-email-format'
      };

      const { error } = updateUserSchema.validate(invalidData);
      expect(error).toBeDefined();
    });
  });

  describe('loginSchema', () => {
    it('should validate valid login data', () => {
      const loginData = {
        email: 'user@example.com',
        password: 'password123'
      };

      const { error, value } = loginSchema.validate(loginData);
      expect(error).toBeUndefined();
      expect(value).toEqual(loginData);
    });

    it('should reject missing email', () => {
      const invalidData = {
        password: 'password123'
      };

      const { error } = loginSchema.validate(invalidData);
      expect(error).toBeDefined();
      expect(error?.details?.[0]?.message).toContain('email');
    });

    it('should reject missing password', () => {
      const invalidData = {
        email: 'user@example.com'
      };

      const { error } = loginSchema.validate(invalidData);
      expect(error).toBeDefined();
      expect(error?.details?.[0]?.message).toContain('password');
    });
  });

  describe('registerSchema', () => {
    it('should validate valid registration data', () => {
      const registerData = {
        email: 'newuser@example.com',
        username: 'newuser',
        password: 'password123',
        firstName: 'New',
        lastName: 'User',
        role: 'employee'
      };

      const { error, value } = registerSchema.validate(registerData);
      expect(error).toBeUndefined();
      expect(value).toEqual(registerData);
    });

    it('should strip confirmPassword field', () => {
      const registerData = {
        email: 'newuser@example.com',
        username: 'newuser',
        password: 'password123',
        firstName: 'New',
        lastName: 'User',
        confirmPassword: 'password123'
      };

      const { error, value } = registerSchema.validate(registerData);
      expect(error).toBeUndefined();
      expect(value.confirmPassword).toBeUndefined();
    });

    it('should reject unknown fields', () => {
      const registerData = {
        email: 'newuser@example.com',
        username: 'newuser',
        password: 'password123',
        firstName: 'New',
        lastName: 'User',
        unknownField: 'should be rejected'
      };

      const { error } = registerSchema.validate(registerData);
      expect(error).toBeDefined();
    });
  });

  describe('createProductSchema', () => {
    it('should validate valid product data', () => {
      const productData = {
        name: 'Test Product',
        description: 'A test product',
        categoryId: 1,
        price: 29.99,
        stockQuantity: 100
      };

      const { error, value } = createProductSchema.validate(productData);
      expect(error).toBeUndefined();
      expect(value).toEqual(productData);
    });

    it('should allow empty description', () => {
      const productData = {
        name: 'Test Product',
        description: '',
        categoryId: 1,
        price: 29.99,
        stockQuantity: 100
      };

      const { error, value } = createProductSchema.validate(productData);
      expect(error).toBeUndefined();
      expect(value.description).toBe('');
    });

    it('should reject negative price', () => {
      const invalidData = {
        name: 'Test Product',
        description: 'A test product',
        categoryId: 1,
        price: -10,
        stockQuantity: 100
      };

      const { error } = createProductSchema.validate(invalidData);
      expect(error).toBeDefined();
      expect(error?.details?.[0]?.message).toContain('price');
    });

    it('should reject negative stock quantity', () => {
      const invalidData = {
        name: 'Test Product',
        description: 'A test product',
        categoryId: 1,
        price: 29.99,
        stockQuantity: -5
      };

      const { error } = createProductSchema.validate(invalidData);
      expect(error).toBeDefined();
      expect(error?.details?.[0]?.message).toContain('stockQuantity');
    });
  });

  describe('updateProductSchema', () => {
    it('should validate partial product update', () => {
      const updateData = {
        name: 'Updated Product',
        price: 39.99
      };

      const { error, value } = updateProductSchema.validate(updateData);
      expect(error).toBeUndefined();
      expect(value).toEqual(updateData);
    });

    it('should validate isActive field', () => {
      const updateData = {
        isActive: false
      };

      const { error, value } = updateProductSchema.validate(updateData);
      expect(error).toBeUndefined();
      expect(value.isActive).toBe(false);
    });
  });

  describe('createCategorySchema', () => {
    it('should validate valid category data', () => {
      const categoryData = {
        name: 'Electronics',
        description: 'Electronic devices and accessories'
      };

      const { error, value } = createCategorySchema.validate(categoryData);
      expect(error).toBeUndefined();
      expect(value).toEqual(categoryData);
    });

    it('should reject short category name', () => {
      const invalidData = {
        name: 'A',
        description: 'Valid description'
      };

      const { error } = createCategorySchema.validate(invalidData);
      expect(error).toBeDefined();
      expect(error?.details?.[0]?.message).toContain('name');
    });
  });

  describe('updateCategorySchema', () => {
    it('should validate partial category update', () => {
      const updateData = {
        name: 'Updated Category'
      };

      const { error, value } = updateCategorySchema.validate(updateData);
      expect(error).toBeUndefined();
      expect(value).toEqual(updateData);
    });
  });

  describe('paginationSchema', () => {
    it('should validate valid pagination parameters', () => {
      const paginationData = {
        page: 2,
        limit: 20,
        sortBy: 'name',
        sortOrder: 'desc',
        search: 'test'
      };

      const { error, value } = paginationSchema.validate(paginationData);
      expect(error).toBeUndefined();
      expect(value).toEqual(paginationData);
    });

    it('should apply default values', () => {
      const { error, value } = paginationSchema.validate({});
      expect(error).toBeUndefined();
      expect(value).toEqual({
        page: 1,
        limit: 10,
        sortBy: 'id',
        sortOrder: 'asc',
        search: ''
      });
    });

    it('should reject invalid page number', () => {
      const invalidData = {
        page: 0
      };

      const { error } = paginationSchema.validate(invalidData);
      expect(error).toBeDefined();
      expect(error?.details?.[0]?.message).toContain('page');
    });

    it('should reject limit exceeding maximum', () => {
      const invalidData = {
        limit: 150
      };

      const { error } = paginationSchema.validate(invalidData);
      expect(error).toBeDefined();
      expect(error?.details?.[0]?.message).toContain('limit');
    });

    it('should reject invalid sort order', () => {
      const invalidData = {
        sortOrder: 'invalid'
      };

      const { error } = paginationSchema.validate(invalidData);
      expect(error).toBeDefined();
      expect(error?.details?.[0]?.message).toContain('sortOrder');
    });
  });
});