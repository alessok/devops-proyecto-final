import Joi from 'joi';

// Product validation schemas using Joi
export const createProductSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  description: Joi.string().max(500).required(),
  price: Joi.number().positive().required(),
  stockQuantity: Joi.number().integer().min(0).required(),
  categoryId: Joi.number().integer().positive().required()
});

export const updateProductSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  description: Joi.string().max(500).optional(),
  price: Joi.number().positive().optional(),
  stockQuantity: Joi.number().integer().min(0).optional(),
  categoryId: Joi.number().integer().positive().optional(),
  isActive: Joi.boolean().optional()
});

// Note: Joi doesn't have built-in type inference like Zod
// You may need to define these types manually
export interface ProductCreate {
  name: string;
  description: string;
  price: number;
  stockQuantity: number;
  categoryId: number;
}

export interface ProductUpdate {
  name?: string;
  description?: string;
  price?: number;
  stockQuantity?: number;
  categoryId?: number;
  isActive?: boolean;
}
