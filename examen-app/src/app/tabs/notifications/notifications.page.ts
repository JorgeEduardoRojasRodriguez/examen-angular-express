import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController, ToastController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { FcmService } from '../../services/fcm.service';
import { AppHeaderComponent } from '../../components/app-header/app-header.component';

interface NotificationLog {
  id: string;
  title: string;
  body: string;
  data?: any;
  receivedAt: Date;
}

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.page.html',
  styleUrls: ['./notifications.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, AppHeaderComponent]
})
export class NotificationsPage implements OnInit, OnDestroy {
  fcmToken: string | null = null;
  notificationLogs: NotificationLog[] = [];
  private fcmSubscription?: Subscription;
  private notificationSubscription?: Subscription;

  constructor(
    private fcmService: FcmService,
    private alertController: AlertController,
    private toastController: ToastController
  ) {}

  ngOnInit() {
    this.initFCM();
  }

  ngOnDestroy() {
    this.fcmSubscription?.unsubscribe();
    this.notificationSubscription?.unsubscribe();
  }

  private initFCM() {
    this.fcmService.initPush();

    this.fcmSubscription = this.fcmService.token$.subscribe(token => {
      this.fcmToken = token;
    });

    this.notificationSubscription = this.fcmService.notification$.subscribe(notification => {
      if (notification) {
        this.addNotificationLog(notification);
        this.showNotificationAlert(notification);
      }
    });
  }

  private addNotificationLog(notification: any) {
    const log: NotificationLog = {
      id: notification.id || Date.now().toString(),
      title: notification.title || 'Sin título',
      body: notification.body || 'Sin contenido',
      data: notification.data,
      receivedAt: new Date()
    };
    this.notificationLogs.unshift(log);
  }

  async showNotificationAlert(notification: any) {
    const alert = await this.alertController.create({
      header: notification.title || 'Notificación',
      message: notification.body || 'Nueva notificación recibida',
      buttons: ['OK']
    });
    await alert.present();
  }

  async copyToken() {
    if (this.fcmToken) {
      try {
        await navigator.clipboard.writeText(this.fcmToken);
        this.showToast('Token copiado al portapapeles', 'success');
      } catch {
        this.showToast('Error al copiar token', 'danger');
      }
    }
  }

  testNotification() {
    this.fcmService.simulateNotification(
      '¡Prueba FCM!',
      'Esta es una notificación de prueba desde Firebase Cloud Messaging',
      { type: 'test', timestamp: new Date().toISOString() }
    );
  }

  clearLogs() {
    this.notificationLogs = [];
    this.showToast('Historial limpiado', 'medium');
  }

  async showToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }
}
