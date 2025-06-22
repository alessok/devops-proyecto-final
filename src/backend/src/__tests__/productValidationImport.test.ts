// Simple import test for productValidation schemas
import { 
  createProductSchema, 
  updateProductSchema 
} from '../validation/productValidation';

describe('ProductValidation Import Test', () => {
  it('should import productValidation schemas', () => {
    expect(createProductSchema).toBeDefined();
    expect(updateProductSchema).toBeDefined();
    
    // Basic validation test to ensure schemas work
    const validCreateData = {
      name: 'Test Product',
      description: 'Test Description',
      price: 99.99,
      stockQuantity: 10,
      categoryId: 1
    };

    const createResult = createProductSchema.validate(validCreateData);
    expect(createResult.error).toBeUndefined();

    const updateResult = updateProductSchema.validate({ name: 'Updated Name' });
    expect(updateResult.error).toBeUndefined();
  });
});
