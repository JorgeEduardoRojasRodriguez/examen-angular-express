import { Router } from 'express';
import { productController } from '../controllers';
import { authMiddleware, validate } from '../middlewares';

const router = Router();

const createProductValidation = [
  { field: 'name', required: true, type: 'string' as const, minLength: 2 },
  { field: 'price', required: true, type: 'number' as const },
  { field: 'stock', required: true, type: 'number' as const },
  { field: 'category', required: true, type: 'string' as const },
];

const updateProductValidation = [
  { field: 'name', required: false, type: 'string' as const, minLength: 2 },
  { field: 'price', required: false, type: 'number' as const },
  { field: 'stock', required: false, type: 'number' as const },
  { field: 'category', required: false, type: 'string' as const },
];

router.get('/categories', productController.getCategories);
router.get('/', productController.findAll);
router.get('/:id', productController.findOne);
router.post('/', authMiddleware, validate(createProductValidation), productController.create);
router.put('/:id', authMiddleware, validate(updateProductValidation), productController.update);
router.delete('/:id', authMiddleware, productController.delete);

export default router;
