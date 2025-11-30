import * as admin from 'firebase-admin';
import * as path from 'path';
import * as fs from 'fs';
import { config } from '../config';

class FirebaseService {
  private initialized = false;

  initialize(): void {
    if (this.initialized) {
      return;
    }

    try {
      const serviceAccountPath = config.firebase?.serviceAccountPath ||
        path.join(__dirname, '../../serviceAccountKey.json');

      if (fs.existsSync(serviceAccountPath)) {
        const serviceAccount = require(serviceAccountPath);
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
      } else if (config.firebase?.projectId && config.firebase?.clientEmail && config.firebase?.privateKey) {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId: config.firebase.projectId,
            clientEmail: config.firebase.clientEmail,
            privateKey: config.firebase.privateKey?.replace(/\\n/g, '\n'),
          }),
        });
      } else {
        return;
      }

      this.initialized = true;
    } catch (error) {
    }
  }

  async sendNotification(
    token: string,
    title: string,
    body: string,
    data?: Record<string, string>
  ): Promise<string | null> {
    if (!this.initialized) {
      this.initialize();
    }

    try {
      const message: admin.messaging.Message = {
        notification: {
          title,
          body,
        },
        data: data || {},
        token,
      };

      const response = await admin.messaging().send(message);
      return response;
    } catch (error) {
      throw error;
    }
  }

  async sendMulticastNotification(
    tokens: string[],
    title: string,
    body: string,
    data?: Record<string, string>
  ): Promise<admin.messaging.BatchResponse | null> {
    if (!this.initialized) {
      this.initialize();
    }

    if (tokens.length === 0) {
      return null;
    }

    try {
      const message: admin.messaging.MulticastMessage = {
        notification: {
          title,
          body,
        },
        data: data || {},
        tokens,
      };

      const response = await admin.messaging().sendEachForMulticast(message);
      return response;
    } catch (error) {
      throw error;
    }
  }

  async sendToTopic(
    topic: string,
    title: string,
    body: string,
    data?: Record<string, string>
  ): Promise<string | null> {
    if (!this.initialized) {
      this.initialize();
    }

    try {
      const message: admin.messaging.Message = {
        notification: {
          title,
          body,
        },
        data: data || {},
        topic,
      };

      const response = await admin.messaging().send(message);
      return response;
    } catch (error) {
      throw error;
    }
  }
}

export const firebaseService = new FirebaseService();
