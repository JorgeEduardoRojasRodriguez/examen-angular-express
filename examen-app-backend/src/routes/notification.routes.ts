import { Router } from 'express';
import { notificationController } from '../controllers/notification.controller';
import { authMiddleware } from '../middlewares';

const router = Router();

router.use(authMiddleware);

router.post('/send', notificationController.sendToToken);
router.post('/send-multicast', notificationController.sendToMultiple);
router.post('/send-topic', notificationController.sendToTopic);
router.post('/test', notificationController.testNotification);

export default router;
