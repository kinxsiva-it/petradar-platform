import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { rescueStatusLabel } from '../../data-access/rescue-case-ui.mapper.js';
import type { RescueCaseStatus } from '../../data-access/rescue-cases-api.models.js';

@Component({
  selector: 'pr-rescue-status-badge',
  standalone: true,
  styleUrl: './rescue-status-badge.component.css',
  template: `<span [class]="classes()">{{ label() }}</span>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RescueStatusBadgeComponent {
  readonly status = input.required<RescueCaseStatus>();
  readonly label = computed(() => rescueStatusLabel(this.status()));
  readonly classes = computed(() => `status-badge ${this.status().toLowerCase().replaceAll('_', '-')}`);
}
