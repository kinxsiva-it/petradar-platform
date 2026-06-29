import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';

import { EmptyStateComponent, LoadingSkeletonComponent } from '@petradar/frontend/shared-ui';
import { NotificationKind, UserWorkspaceDataSource } from '@petradar/frontend/mock-data';

import { NotificationItemComponent } from '../../components/notification-item/notification-item.component.js';

type NotificationFilter = 'All' | 'Unread' | NotificationKind;

@Component({
  selector: 'pr-notifications-page',
  standalone: true,
  imports: [EmptyStateComponent, LoadingSkeletonComponent, NotificationItemComponent],
  styleUrl: './notifications-page.component.css',
  templateUrl: './notifications-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationsPageComponent {
  readonly workspace = inject(UserWorkspaceDataSource);
  readonly uiState = signal<'default' | 'loading' | 'error'>('default');
  readonly filter = signal<NotificationFilter>('All');
  readonly filters: NotificationFilter[] = ['All', 'Unread', 'match', 'report-approved', 'report-rejected', 'rescue-status'];

  readonly filteredNotifications = computed(() => {
    const filter = this.filter();
    return this.workspace.notifications().filter((item) => {
      if (filter === 'All') return true;
      if (filter === 'Unread') return !item.read;
      return item.kind === filter;
    });
  });
}
