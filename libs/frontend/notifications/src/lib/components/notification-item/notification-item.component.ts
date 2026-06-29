import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

import type { UserNotification } from '@petradar/frontend/mock-data';

@Component({
  selector: 'pr-notification-item',
  standalone: true,
  imports: [RouterLink],
  styleUrl: './notification-item.component.css',
  templateUrl: './notification-item.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationItemComponent {
  readonly notification = input.required<UserNotification>();
  readonly read = output<string>();
}
