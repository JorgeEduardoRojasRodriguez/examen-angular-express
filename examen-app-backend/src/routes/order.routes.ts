import { Router } from 'express';
import { orderController } from '../controllers';
import { authMiddleware, validate } from '../middlewares';

const router = Router();

const createOrderValidation = [
  { field: 'shippingAddress', required: true, type: 'string' as const, minLength: 10 },
  { field: 'items', required: true, type: 'array' as const },
];

const updateOrderValidation = [
  { field: 'status', required: false, type: 'string' as const },
  { field: 'shippingAddress', required: false, type: 'string' as const },
];

router.use(authMiddleware);

router.get('/stats', orderController.getStats);
router.get('/', orderController.findAll);
router.get('/:id', orderController.findOne);
router.post('/', validate(createOrderValidation), orderController.create);
router.put('/:id', validate(updateOrderValidation), orderController.update);
router.delete('/:id', orderController.delete);

export default router;
