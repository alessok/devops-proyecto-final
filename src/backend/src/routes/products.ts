import { Router } from 'express';
import { ProductController } from '../controllers/productController';
import { validate, validateQuery } from '../validation/validator';
import { createProductSchema, updateProductSchema, paginationSchema } from '../validation/schemas';
import { authenticateToken, authorizeRoles } from '../middleware/auth';

const router = Router();
const productController = new ProductController();

// All routes require authentication
router.use(authenticateToken);

// GET routes
router.get('/', validateQuery(paginationSchema), productController.getAllProducts.bind(productController));
router.get('/stats', authorizeRoles('admin', 'manager'), productController.getInventoryStats.bind(productController));
router.get('/low-stock', authorizeRoles('admin', 'manager'), productController.getLowStockProducts.bind(productController));
router.get('/:id', productController.getProductById.bind(productController));

// POST routes (require admin or manager role)
router.post('/', 
  authorizeRoles('admin', 'manager'), 
  validate(createProductSchema), 
  productController.createProduct.bind(productController)
);

// PUT routes (require admin or manager role)
router.put('/:id', 
  authorizeRoles('admin', 'manager'), 
  validate(updateProductSchema), 
  productController.updateProduct.bind(productController)
);

router.put('/:id/stock', 
  authorizeRoles('admin', 'manager'), 
  productController.updateStock.bind(productController)
);

// DELETE routes (require admin role)
router.delete('/:id', 
  authorizeRoles('admin'), 
  productController.deleteProduct.bind(productController)
);

export default router;
