import { Injectable, inject } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { PushNotifications, Token, PushNotificationSchema, ActionPerformed } from '@capacitor/push-notifications';
import { Firestore, doc, setDoc, Timestamp } from '@angular/fire/firestore';
import { Messaging, getToken, onMessage } from '@angular/fire/messaging';
import { AuthService } from './auth.service';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';

export interface FCMToken {
  token: string;
  platform: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationPayload {
  title: string;
  body: string;
  id: string;
  data?: any;
}

@Injectable({
  providedIn: 'root'
})
export class FcmService {
  private firestore = inject(Firestore);
  private messaging = inject(Messaging);
  private authService = inject(AuthService);

  private fcmToken$ = new BehaviorSubject<string | null>(null);
  private notifications$ = new BehaviorSubject<NotificationPayload | null>(null);

  token$ = this.fcmToken$.asObservable();
  notification$ = this.notifications$.asObservable();

  async initPush(): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      await this.registerNativePush();
    } else {
      await this.registerWebPush();
    }
  }

  private async registerNativePush(): Promise<void> {
    try {
      let permStatus = await PushNotifications.checkPermissions();

      if (permStatus.receive === 'prompt') {
        permStatus = await PushNotifications.requestPermissions();
      }

      if (permStatus.receive !== 'granted') {
        return;
      }

      await PushNotifications.register();
      this.addNativeListeners();

    } catch {
    }
  }

  private addNativeListeners(): void {
    PushNotifications.addListener('registration', async (token: Token) => {
      this.fcmToken$.next(token.value);
      await this.saveTokenToFirestore(token.value);
    });

    PushNotifications.addListener('registrationError', () => {});

    PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
      const payload: NotificationPayload = {
        title: notification.title || '',
        body: notification.body || '',
        id: notification.id,
        data: notification.data
      };
      this.notifications$.next(payload);
    });

    PushNotifications.addListener('pushNotificationActionPerformed', (action: ActionPerformed) => {
      const payload: NotificationPayload = {
        title: action.notification.title || '',
        body: action.notification.body || '',
        id: action.notification.id,
        data: action.notification.data
      };
      this.notifications$.next(payload);
    });
  }

  private async registerWebPush(): Promise<void> {
    try {
      const permission = await Notification.requestPermission();

      if (permission !== 'granted') {
        return;
      }

      const vapidKey = environment.firebase.vapidKey;

      if (!vapidKey) {
        return;
      }

      let serviceWorkerRegistration: ServiceWorkerRegistration | undefined;
      if ('serviceWorker' in navigator) {
        try {
          serviceWorkerRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
          this.listenToServiceWorkerMessages();
        } catch {
        }
      }

      const token = await getToken(this.messaging, {
        vapidKey,
        serviceWorkerRegistration
      });

      if (token) {
        this.fcmToken$.next(token);
        await this.saveTokenToFirestore(token);
        this.listenToWebMessages();
      }

    } catch {
    }
  }

  private listenToWebMessages(): void {
    onMessage(this.messaging, (payload) => {
      const notification: NotificationPayload = {
        title: payload.notification?.title || payload.data?.['title'] || 'Notificación',
        body: payload.notification?.body || payload.data?.['body'] || '',
        id: payload.messageId || Date.now().toString(),
        data: payload.data
      };

      this.notifications$.next(notification);

      if (Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.body,
          icon: '/assets/icon/favicon.png'
        });
      }
    });
  }

  private listenToServiceWorkerMessages(): void {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && (event.data.type === 'FCM_MESSAGE' || event.data.type === 'NOTIFICATION_CLICKED')) {
          const data = event.data.data || event.data;
          const notification: NotificationPayload = {
            title: data.title || data.notification?.title || 'Notificación',
            body: data.body || data.notification?.body || '',
            id: data.messageId || Date.now().toString(),
            data: data.data || data
          };

          this.notifications$.next(notification);
        }
      });
    }
  }

  private async saveTokenToFirestore(token: string): Promise<void> {
    try {
      const user = this.authService.getCurrentUser();
      if (!user) {
        return;
      }

      const platform = Capacitor.isNativePlatform() ? Capacitor.getPlatform() : 'web';

      const tokenRef = doc(this.firestore, 'fcm_tokens', `${user.id}_${platform}`);
      await setDoc(tokenRef, {
        token,
        platform,
        userId: user.id.toString(),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      }, { merge: true });
    } catch {
    }
  }

  simulateNotification(title: string, body: string, data?: any): void {
    const notification: NotificationPayload = {
      title,
      body,
      id: Date.now().toString(),
      data: data || {}
    };

    this.notifications$.next(notification);

    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/assets/icon/favicon.png'
      });
    }
  }

  getCurrentToken(): string | null {
    return this.fcmToken$.getValue();
  }

  async removeAllListeners(): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      await PushNotifications.removeAllListeners();
    }
    this.fcmToken$.next(null);
    this.notifications$.next(null);
  }
}
