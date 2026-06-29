import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';

import { RescueWorkflowDataSource, type RescueCaseStatus } from '@petradar/frontend/mock-data';

@Component({
  selector: 'pr-rescue-status-badge',
  standalone: true,
  styleUrl: './rescue-status-badge.component.css',
  template: `<span [class]="classes()">{{ label() }}</span>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RescueStatusBadgeComponent {
  private readonly rescue = inject(RescueWorkflowDataSource);
  readonly status = input.required<RescueCaseStatus>();
  readonly label = computed(() => this.rescue.statusLabel(this.status()));
  readonly classes = computed(() => `status-badge ${this.status().toLowerCase().replaceAll('_', '-')}`);
}
