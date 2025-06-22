import {
  createUserSchema,
  updateUserSchema,
  loginSchema,
  createProductSchema,
  updateProductSchema,
  createCategorySchema,
  updateCategorySchema,
  paginationSchema
} from '../validation/schemas';

describe('Validation Schemas', () => {
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

    it('should use default role when not provided', () => {
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
      expect(error?.message).toContain('email');
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
      expect(error?.message).toContain('username');
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
      expect(error?.message).toContain('password');
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
      expect(error?.message).toContain('role');
    });
  });

  describe('updateUserSchema', () => {
    it('should validate partial user updates', () => {
      const updateData = {
        firstName: 'UpdatedName',
        isActive: false
      };

      const { error, value } = updateUserSchema.validate(updateData);

      expect(error).toBeUndefined();
      expect(value).toEqual(updateData);
    });

    it('should allow empty updates', () => {
      const { error, value } = updateUserSchema.validate({});

      expect(error).toBeUndefined();
      expect(value).toEqual({});
    });
  });

  describe('loginSchema', () => {
    it('should validate login credentials', () => {
      const loginData = {
        email: 'test@example.com',
        password: 'password123'
      };

      const { error, value } = loginSchema.validate(loginData);

      expect(error).toBeUndefined();
      expect(value).toEqual(loginData);
    });

    it('should require both email and password', () => {
      const { error } = loginSchema.validate({ email: 'test@example.com' });

      expect(error).toBeDefined();
      expect(error?.message).toContain('password');
    });
  });

  describe('createProductSchema', () => {
    it('should validate valid product data', () => {
      const productData = {
        name: 'Test Product',
        description: 'Product description',
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
      expect(value).toEqual(productData);
    });

    it('should reject negative price', () => {
      const productData = {
        name: 'Test Product',
        description: 'Product description',
        categoryId: 1,
        price: -10,
        stockQuantity: 100
      };

      const { error } = createProductSchema.validate(productData);

      expect(error).toBeDefined();
      expect(error?.message).toContain('price');
    });

    it('should reject negative stock quantity', () => {
      const productData = {
        name: 'Test Product',
        description: 'Product description',
        categoryId: 1,
        price: 29.99,
        stockQuantity: -5
      };

      const { error } = createProductSchema.validate(productData);

      expect(error).toBeDefined();
      expect(error?.message).toContain('stockQuantity');
    });
  });

  describe('updateProductSchema', () => {
    it('should validate partial product updates', () => {
      const updateData = {
        price: 35.99,
        stockQuantity: 50
      };

      const { error, value } = updateProductSchema.validate(updateData);

      expect(error).toBeUndefined();
      expect(value).toEqual(updateData);
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
      const categoryData = {
        name: 'A',
        description: 'Valid description'
      };

      const { error } = createCategorySchema.validate(categoryData);

      expect(error).toBeDefined();
      expect(error?.message).toContain('name');
    });
  });

  describe('updateCategorySchema', () => {
    it('should validate partial category updates', () => {
      const updateData = {
        name: 'Updated Category',
        isActive: false
      };

      const { error, value } = updateCategorySchema.validate(updateData);

      expect(error).toBeUndefined();
      expect(value).toEqual(updateData);
    });
  });

  describe('paginationSchema', () => {
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

    it('should validate pagination parameters', () => {
      const paginationData = {
        page: 2,
        limit: 25,
        sortBy: 'name',
        sortOrder: 'desc',
        search: 'test'
      };

      const { error, value } = paginationSchema.validate(paginationData);

      expect(error).toBeUndefined();
      expect(value).toEqual(paginationData);
    });

    it('should reject invalid page number', () => {
      const { error } = paginationSchema.validate({ page: 0 });

      expect(error).toBeDefined();
      expect(error?.message).toContain('page');
    });

    it('should reject limit exceeding maximum', () => {
      const { error } = paginationSchema.validate({ limit: 150 });

      expect(error).toBeDefined();
      expect(error?.message).toContain('limit');
    });

    it('should reject invalid sort order', () => {
      const { error } = paginationSchema.validate({ sortOrder: 'invalid' });

      expect(error).toBeDefined();
      expect(error?.message).toContain('sortOrder');
    });
  });
});
