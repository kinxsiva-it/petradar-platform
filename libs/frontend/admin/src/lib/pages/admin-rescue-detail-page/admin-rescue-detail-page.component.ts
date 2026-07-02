import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { EmptyStateComponent } from '@petradar/frontend/shared-ui';

@Component({
  selector: 'pr-admin-rescue-detail-page',
  standalone: true,
  imports: [EmptyStateComponent, RouterLink],
  styleUrl: './admin-rescue-detail-page.component.css',
  templateUrl: './admin-rescue-detail-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminRescueDetailPageComponent {}
