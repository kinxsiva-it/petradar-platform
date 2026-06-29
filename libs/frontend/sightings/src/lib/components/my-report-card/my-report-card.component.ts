import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

import { StatusBadgeComponent } from '@petradar/frontend/shared-ui';
import type { UserReport } from '@petradar/frontend/mock-data';

@Component({
  selector: 'pr-my-report-card',
  standalone: true,
  imports: [RouterLink, StatusBadgeComponent],
  styleUrl: './my-report-card.component.css',
  templateUrl: './my-report-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyReportCardComponent {
  readonly report = input.required<UserReport>();
  readonly editRequested = output<UserReport>();

  tone(value: string): 'danger' | 'default' | 'match' | 'success' | 'warning' {
    const lower = value.toLowerCase();
    if (lower.includes('high') || lower.includes('injured') || lower.includes('rescue')) return 'danger';
    if (lower.includes('pending') || lower.includes('review')) return 'warning';
    if (lower.includes('match')) return 'match';
    if (lower.includes('verified')) return 'success';
    return 'default';
  }
}
