import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { firstValueFrom, type Observable } from 'rxjs';

import { API_BASE_PATH } from '../auth/api-base-path.js';

export type NotificationType =
  | 'SIGHTING_VERIFIED'
  | 'SIGHTING_REJECTED'
  | 'MATCH_FOUND'
  | 'MATCH_CONFIRMED'
  | 'MATCH_REJECTED'
  | 'RESCUE_ASSIGNED'
  | 'RESCUE_STATUS_UPDATED';

export interface NotificationResponse {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  actionUrl: string | null;
  readAt: string | null;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationsApiService {
  private readonly http = inject(HttpClient);
  private readonly basePath = `${inject(API_BASE_PATH)}/notifications`;
  private readonly unreadCountState = signal(0);
  readonly unreadCount = this.unreadCountState.asReadonly();

  list(status: 'all' | 'unread' = 'all', limit = 20): Observable<{ items: NotificationResponse[] }> {
    return this.http.get<{ items: NotificationResponse[] }>(this.basePath, {
      params: new HttpParams().set('status', status).set('limit', limit),
    });
  }

  markAsRead(id: string): Observable<NotificationResponse> {
    return this.http.patch<NotificationResponse>(
      `${this.basePath}/${encodeURIComponent(id)}/read`,
      {},
    );
  }

  markAllAsRead(): Observable<{ updatedCount: number }> {
    return this.http.patch<{ updatedCount: number }>(`${this.basePath}/read-all`, {});
  }

  async refreshUnreadCount(): Promise<void> {
    const response = await firstValueFrom(
      this.http.get<{ unreadCount: number }>(`${this.basePath}/unread-count`),
    );
    this.unreadCountState.set(response.unreadCount);
  }

  clearUnreadCount(): void {
    this.unreadCountState.set(0);
  }
}
