import { Request, Response, NextFunction } from 'express';
import { firebaseService } from '../services/firebase.service';

export class NotificationController {
  async sendToToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token, title, body, data } = req.body;

      if (!token || !title || !body) {
        res.status(400).json({
          success: false,
          message: 'Token, title and body are required',
        });
        return;
      }

      const response = await firebaseService.sendNotification(token, title, body, data);

      res.status(200).json({
        success: true,
        message: 'Notification sent successfully',
        data: { messageId: response },
      });
    } catch (error: any) {
      if (error.code === 'messaging/invalid-registration-token') {
        res.status(400).json({
          success: false,
          message: 'Invalid FCM token',
          error: error.message,
        });
        return;
      }

      if (error.code === 'messaging/registration-token-not-registered') {
        res.status(400).json({
          success: false,
          message: 'FCM token is no longer valid',
          error: error.message,
        });
        return;
      }

      next(error);
    }
  }

  async sendToMultiple(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tokens, title, body, data } = req.body;

      if (!tokens || !Array.isArray(tokens) || tokens.length === 0) {
        res.status(400).json({
          success: false,
          message: 'Tokens array is required and must not be empty',
        });
        return;
      }

      if (!title || !body) {
        res.status(400).json({
          success: false,
          message: 'Title and body are required',
        });
        return;
      }

      const response = await firebaseService.sendMulticastNotification(tokens, title, body, data);

      res.status(200).json({
        success: true,
        message: 'Multicast notification sent',
        data: {
          successCount: response?.successCount || 0,
          failureCount: response?.failureCount || 0,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async sendToTopic(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { topic, title, body, data } = req.body;

      if (!topic || !title || !body) {
        res.status(400).json({
          success: false,
          message: 'Topic, title and body are required',
        });
        return;
      }

      const response = await firebaseService.sendToTopic(topic, title, body, data);

      res.status(200).json({
        success: true,
        message: 'Topic notification sent successfully',
        data: { messageId: response },
      });
    } catch (error) {
      next(error);
    }
  }

  async testNotification(req: Request, res: Response): Promise<void> {
    const { token, title, body } = req.body;

    res.status(200).json({
      success: true,
      message: 'Test notification logged (not actually sent)',
      data: {
        token,
        title,
        body,
        timestamp: new Date().toISOString(),
      },
    });
  }
}

export const notificationController = new NotificationController();
