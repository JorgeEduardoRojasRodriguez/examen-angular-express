import { Router } from 'express';
import { authController } from '../controllers';
import { validate } from '../middlewares';

const router = Router();

const loginValidation = [
  { field: 'email', required: true, type: 'email' as const },
  { field: 'password', required: true, type: 'string' as const, minLength: 6 },
];

const registerValidation = [
  { field: 'email', required: true, type: 'email' as const },
  { field: 'password', required: true, type: 'string' as const, minLength: 6 },
  { field: 'firstName', required: true, type: 'string' as const, minLength: 2 },
  { field: 'lastName', required: true, type: 'string' as const, minLength: 2 },
];

router.post('/login', validate(loginValidation), authController.login);
router.post('/register', validate(registerValidation), authController.register);

export default router;
