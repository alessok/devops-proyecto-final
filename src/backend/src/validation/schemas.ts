import Joi from 'joi';

// User validation schemas
export const createUserSchema = Joi.object({
  email: Joi.string().email().required(),
  username: Joi.string().alphanum().min(3).max(30).required(),
  password: Joi.string().min(6).max(128).required(),
  firstName: Joi.string().min(2).max(50).required(),
  lastName: Joi.string().min(2).max(50).required(),
  role: Joi.string().valid('admin', 'manager', 'employee').default('employee')
});

export const updateUserSchema = Joi.object({
  email: Joi.string().email(),
  username: Joi.string().alphanum().min(3).max(30),
  firstName: Joi.string().min(2).max(50),
  lastName: Joi.string().min(2).max(50),
  role: Joi.string().valid('admin', 'manager', 'employee'),
  isActive: Joi.boolean()
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

export const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  username: Joi.string().alphanum().min(3).max(30).required(),
  password: Joi.string().min(6).max(128).required(),
  firstName: Joi.string().min(2).max(50).required(),
  lastName: Joi.string().min(2).max(50).required(),
  role: Joi.string().valid('admin', 'manager', 'employee').default('employee'),
  confirmPassword: Joi.any().optional().strip() // Allow but remove confirmPassword
}).unknown(false); // Explicitly reject other unknown fields

// Product validation schemas (matching real database structure)
export const createProductSchema = Joi.object({
  name: Joi.string().min(2).max(200).required(),
  description: Joi.string().max(1000).allow(''),
  categoryId: Joi.number().integer().positive().required(),
  price: Joi.number().positive().precision(2).required(),
  stockQuantity: Joi.number().integer().min(0).required()
});

export const updateProductSchema = Joi.object({
  name: Joi.string().min(2).max(200),
  description: Joi.string().max(1000).allow(''),
  categoryId: Joi.number().integer().positive(),
  price: Joi.number().positive().precision(2),
  stockQuantity: Joi.number().integer().min(0),
  isActive: Joi.boolean()
});

// Category validation schemas
export const createCategorySchema = Joi.object({
  name: Joi.string().min(2).max(50).required(),
  description: Joi.string().max(200).required()
});

export const updateCategorySchema = Joi.object({
  name: Joi.string().min(2).max(50),
  description: Joi.string().max(200),
  isActive: Joi.boolean()
});

// Pagination schema
export const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sortBy: Joi.string().default('id'),
  sortOrder: Joi.string().valid('asc', 'desc').default('asc'),
  search: Joi.string().allow('').default('')
});
