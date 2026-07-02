import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { EmptyStateComponent } from '@petradar/frontend/shared-ui';

@Component({
  selector: 'pr-admin-rescue-board-page',
  standalone: true,
  imports: [EmptyStateComponent, RouterLink],
  styleUrl: './admin-rescue-board-page.component.css',
  templateUrl: './admin-rescue-board-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminRescueBoardPageComponent {}
