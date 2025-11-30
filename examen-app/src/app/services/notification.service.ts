import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';

export interface SendNotificationRequest {
  token: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}

export interface SendMulticastRequest {
  tokens: string[];
  title: string;
  body: string;
  data?: Record<string, string>;
}

export interface SendTopicRequest {
  topic: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}

export interface NotificationResponse {
  success: boolean;
  message: string;
  data?: {
    messageId?: string;
    successCount?: number;
    failureCount?: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly API_URL = environment.apiUrl;

  constructor(private http: HttpClient) {}

  sendToToken(request: SendNotificationRequest): Observable<NotificationResponse> {
    return this.http.post<NotificationResponse>(
      `${this.API_URL}/notifications/send`,
      request
    );
  }

  sendToMultiple(request: SendMulticastRequest): Observable<NotificationResponse> {
    return this.http.post<NotificationResponse>(
      `${this.API_URL}/notifications/send-multicast`,
      request
    );
  }

  sendToTopic(request: SendTopicRequest): Observable<NotificationResponse> {
    return this.http.post<NotificationResponse>(
      `${this.API_URL}/notifications/send-topic`,
      request
    );
  }

  sendTest(request: SendNotificationRequest): Observable<NotificationResponse> {
    return this.http.post<NotificationResponse>(
      `${this.API_URL}/notifications/test`,
      request
    );
  }
}
