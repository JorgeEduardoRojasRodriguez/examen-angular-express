import { Router } from 'express';
import { userController } from '../controllers';
import { authMiddleware, validate } from '../middlewares';

const router = Router();

const createUserValidation = [
  { field: 'email', required: true, type: 'email' as const },
  { field: 'password', required: true, type: 'string' as const, minLength: 6 },
  { field: 'firstName', required: true, type: 'string' as const, minLength: 2 },
  { field: 'lastName', required: true, type: 'string' as const, minLength: 2 },
];

const updateUserValidation = [
  { field: 'email', required: false, type: 'email' as const },
  { field: 'firstName', required: false, type: 'string' as const, minLength: 2 },
  { field: 'lastName', required: false, type: 'string' as const, minLength: 2 },
];

router.post('/', validate(createUserValidation), userController.create);
router.get('/', authMiddleware, userController.findAll);
router.get('/:id', authMiddleware, userController.findOne);
router.put('/:id', authMiddleware, validate(updateUserValidation), userController.update);
router.delete('/:id', authMiddleware, userController.delete);

export default router;
