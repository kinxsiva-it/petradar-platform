import { ChangeDetectionStrategy, Component } from '@angular/core';

import { EmptyStateComponent } from '@petradar/frontend/shared-ui';

@Component({
  selector: 'pr-notifications-page',
  standalone: true,
  imports: [EmptyStateComponent],
  styleUrl: './notifications-page.component.css',
  templateUrl: './notifications-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationsPageComponent {}
