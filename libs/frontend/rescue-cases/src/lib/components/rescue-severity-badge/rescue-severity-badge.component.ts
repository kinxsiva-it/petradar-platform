import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import type { RescueSeverity } from '../../data-access/rescue-cases-api.models.js';

const toneClasses: Record<RescueSeverity, string> = {
  EMERGENCY: 'emergency',
  HIGH: 'high',
  LOW: 'low',
  MEDIUM: 'medium',
};

@Component({
  selector: 'pr-rescue-severity-badge',
  standalone: true,
  styleUrl: './rescue-severity-badge.component.css',
  template: `<span [class]="classes()">{{ label() }}</span>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RescueSeverityBadgeComponent {
  readonly severity = input.required<RescueSeverity>();
  readonly label = computed(() => this.severity().charAt(0) + this.severity().slice(1).toLowerCase());
  readonly classes = computed(() => `severity-badge ${toneClasses[this.severity()]}`);
}
