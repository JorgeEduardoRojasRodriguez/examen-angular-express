import { Router } from 'express';
import { taskController } from '../controllers';
import { authMiddleware, validate } from '../middlewares';

const router = Router();

const createTaskValidation = [
  { field: 'title', required: true, type: 'string' as const, minLength: 3 },
  { field: 'description', required: false, type: 'string' as const },
];

const updateTaskValidation = [
  { field: 'title', required: false, type: 'string' as const, minLength: 3 },
  { field: 'description', required: false, type: 'string' as const },
];

router.use(authMiddleware);

router.post('/', validate(createTaskValidation), taskController.create);
router.get('/', taskController.findAll);
router.get('/:id', taskController.findOne);
router.put('/:id', validate(updateTaskValidation), taskController.update);
router.delete('/:id', taskController.delete);

export default router;
