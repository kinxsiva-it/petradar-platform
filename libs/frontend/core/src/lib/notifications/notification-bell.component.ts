import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  inject,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { LucideBell } from '@lucide/angular';
import { firstValueFrom } from 'rxjs';

import {
  NotificationsApiService,
  type NotificationResponse,
} from './notifications-api.service.js';

@Component({
  selector: 'pr-notification-bell',
  standalone: true,
  imports: [DatePipe, LucideBell, RouterLink],
  templateUrl: './notification-bell.component.html',
  styleUrl: './notification-bell.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationBellComponent {
  private readonly element = inject(ElementRef<HTMLElement>);
  private readonly router = inject(Router);
  readonly notifications = inject(NotificationsApiService);
  readonly errorMessage = signal('');
  readonly items = signal<NotificationResponse[]>([]);
  readonly loading = signal(false);
  readonly markingAll = signal(false);
  readonly markingId = signal<string | null>(null);
  readonly open = signal(false);

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.open() && event.target instanceof Node && !this.element.nativeElement.contains(event.target)) {
      this.close();
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.close();
  }

  toggle(): void {
    if (this.open()) {
      this.close();
      return;
    }
    this.open.set(true);
    void this.load();
  }

  close(): void {
    this.open.set(false);
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.errorMessage.set('');
    try {
      const response = await firstValueFrom(this.notifications.list('all', 15));
      this.items.set(response.items);
      await this.notifications.refreshUnreadCount();
    } catch {
      this.errorMessage.set('Notifications could not be loaded.');
    } finally {
      this.loading.set(false);
    }
  }

  async select(item: NotificationResponse): Promise<void> {
    if (this.markingId() !== null) return;
    this.markingId.set(item.id);
    this.errorMessage.set('');
    try {
      if (item.readAt === null) {
        const updated = await firstValueFrom(this.notifications.markAsRead(item.id));
        this.items.update((items) =>
          items.map((candidate) => candidate.id === item.id ? updated : candidate),
        );
        await this.notifications.refreshUnreadCount();
      }
      this.close();
      if (isSafeInternalUrl(item.actionUrl)) {
        await this.router.navigateByUrl(item.actionUrl);
      }
    } catch {
      this.errorMessage.set('The notification could not be opened.');
    } finally {
      this.markingId.set(null);
    }
  }

  async markAllRead(): Promise<void> {
    if (this.markingAll()) return;
    this.markingAll.set(true);
    this.errorMessage.set('');
    try {
      await firstValueFrom(this.notifications.markAllAsRead());
      const readAt = new Date().toISOString();
      this.items.update((items) => items.map((item) => ({ ...item, readAt: item.readAt ?? readAt })));
      await this.notifications.refreshUnreadCount();
    } catch {
      this.errorMessage.set('Notifications could not be marked as read.');
    } finally {
      this.markingAll.set(false);
    }
  }
}

function isSafeInternalUrl(value: string | null): value is string {
  return value !== null && value.startsWith('/') && !value.startsWith('//');
}
