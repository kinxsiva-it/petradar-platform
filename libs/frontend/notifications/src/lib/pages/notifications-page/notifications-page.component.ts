import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { NotificationsApiService, type NotificationResponse } from '@petradar/frontend/core';

@Component({
  selector: 'pr-notifications-page',
  standalone: true,
  imports: [DatePipe, RouterLink],
  styleUrl: './notifications-page.component.css',
  templateUrl: './notifications-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationsPageComponent implements OnInit {
  private readonly api = inject(NotificationsApiService);
  readonly errorMessage = signal('');
  readonly filter = signal<'all' | 'unread'>('all');
  readonly items = signal<NotificationResponse[]>([]);
  readonly loading = signal(true);
  readonly markingAll = signal(false);
  readonly markingId = signal<string | null>(null);
  readonly hasUnread = computed(() => this.items().some((item) => item.readAt === null));

  ngOnInit(): void {
    void this.load();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.errorMessage.set('');
    try {
      const response = await firstValueFrom(this.api.list(this.filter(), 50));
      this.items.set(response.items);
      await this.api.refreshUnreadCount();
    } catch {
      this.errorMessage.set('Notifications could not be loaded. Please try again.');
    } finally {
      this.loading.set(false);
    }
  }

  setFilter(filter: 'all' | 'unread'): void {
    this.filter.set(filter);
    void this.load();
  }

  async markRead(item: NotificationResponse): Promise<void> {
    if (item.readAt !== null) return;
    this.markingId.set(item.id);
    try {
      const updated = await firstValueFrom(this.api.markAsRead(item.id));
      this.items.update((items) => items.map((candidate) => candidate.id === item.id ? updated : candidate));
      if (this.filter() === 'unread') {
        this.items.update((items) => items.filter((candidate) => candidate.id !== item.id));
      }
      await this.api.refreshUnreadCount();
    } catch {
      this.errorMessage.set('The notification could not be marked as read.');
    } finally {
      this.markingId.set(null);
    }
  }

  async markAllRead(): Promise<void> {
    this.markingAll.set(true);
    try {
      await firstValueFrom(this.api.markAllAsRead());
      if (this.filter() === 'unread') this.items.set([]);
      else this.items.update((items) => items.map((item) => ({ ...item, readAt: item.readAt ?? new Date().toISOString() })));
      await this.api.refreshUnreadCount();
    } catch {
      this.errorMessage.set('Notifications could not be marked as read.');
    } finally {
      this.markingAll.set(false);
    }
  }
}
