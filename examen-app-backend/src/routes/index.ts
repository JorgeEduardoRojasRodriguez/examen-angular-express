import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import taskRoutes from './task.routes';
import productRoutes from './product.routes';
import orderRoutes from './order.routes';
import notificationRoutes from './notification.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/tasks', taskRoutes);
router.use('/products', productRoutes);
router.use('/orders', orderRoutes);
router.use('/notifications', notificationRoutes);

export default router;
