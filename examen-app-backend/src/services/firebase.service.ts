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
      let serviceAccountPath = config.firebase?.serviceAccountPath || '';

      if (serviceAccountPath && !path.isAbsolute(serviceAccountPath)) {
        serviceAccountPath = path.join(process.cwd(), serviceAccountPath);
      }

      if (!serviceAccountPath) {
        serviceAccountPath = path.join(process.cwd(), 'serviceAccountKey.json');
      }

      if (fs.existsSync(serviceAccountPath)) {
        const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
        this.initialized = true;
      } else if (config.firebase?.projectId && config.firebase?.clientEmail && config.firebase?.privateKey) {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId: config.firebase.projectId,
            clientEmail: config.firebase.clientEmail,
            privateKey: config.firebase.privateKey.replace(/\\n/g, '\n'),
          }),
        });
        this.initialized = true;
      }
    } catch (error) {
      console.error('Firebase initialization error:', error);
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
