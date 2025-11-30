import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { ToastService } from '../../../../shared/services/toast.service';

interface NotificationForm {
  token: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}

interface NotificationLog {
  id: string;
  type: 'token';
  title: string;
  body: string;
  target: string;
  status: 'success' | 'error';
  timestamp: Date;
  response?: any;
}

@Component({
  selector: 'app-notification-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './notification-list.component.html',
  styleUrl: './notification-list.component.css'
})
export class NotificationListComponent {
  private apiUrl = `${environment.apiUrl}/notifications`;

  token = signal('');
  title = signal('');
  body = signal('');

  sending = signal(false);
  logs = signal<NotificationLog[]>([]);

  constructor(
    private http: HttpClient,
    private toastService: ToastService
  ) {}

  sendNotification(): void {
    if (!this.title().trim() || !this.body().trim()) {
      this.toastService.error('Título y mensaje son requeridos');
      return;
    }

    if (!this.token().trim()) {
      this.toastService.error('El token FCM es requerido');
      return;
    }

    this.sending.set(true);

    const payload = {
      token: this.token(),
      title: this.title(),
      body: this.body()
    };
    const target = this.token().substring(0, 30) + '...';

    this.http.post<any>(`${this.apiUrl}/send`, payload).subscribe({
      next: (response) => {
        this.sending.set(false);
        this.toastService.success(response.message || 'Notificación enviada');

        this.addLog({
          type: 'token',
          title: this.title(),
          body: this.body(),
          target,
          status: 'success',
          response: response.data
        });

        this.clearForm();
      },
      error: (error) => {
        this.sending.set(false);
        this.toastService.error(error.error?.message || 'Error al enviar notificación');

        this.addLog({
          type: 'token',
          title: this.title(),
          body: this.body(),
          target,
          status: 'error',
          response: error.error
        });
      }
    });
  }

  private addLog(log: Omit<NotificationLog, 'id' | 'timestamp'>): void {
    const newLog: NotificationLog = {
      ...log,
      id: Date.now().toString(),
      timestamp: new Date()
    };
    this.logs.set([newLog, ...this.logs()].slice(0, 20)); // Mantener últimos 20
  }

  clearForm(): void {
    this.title.set('');
    this.body.set('');
  }

  clearLogs(): void {
    this.logs.set([]);
  }

  getTypeLabel(type: string): string {
    return 'Token único';
  }

  formatTime(date: Date): string {
    return new Intl.DateTimeFormat('es', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date);
  }
}
