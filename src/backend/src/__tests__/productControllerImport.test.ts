import { ProductController } from '../controllers/productController';

// Simple test that just imports and instantiates the controller
describe('ProductController Import Test', () => {
  it('should import and instantiate ProductController', () => {
    const controller = new ProductController();
    expect(controller).toBeDefined();
    expect(controller.getAllProducts).toBeDefined();
    expect(controller.getProductById).toBeDefined();
    expect(controller.createProduct).toBeDefined();
    expect(controller.updateProduct).toBeDefined();
    expect(controller.deleteProduct).toBeDefined();
  });
});
