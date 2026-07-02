import { ChangeDetectionStrategy, Component } from '@angular/core';

import { AlertComponent, EmptyStateComponent } from '@petradar/frontend/shared-ui';

@Component({
  selector: 'pr-executive-reports-page',
  standalone: true,
  imports: [AlertComponent, EmptyStateComponent],
  styleUrl: './executive-reports-page.component.css',
  templateUrl: './executive-reports-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExecutiveReportsPageComponent {}
