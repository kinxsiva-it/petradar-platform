import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import {
  rescueStatusLabel,
  type StatusTransitionOption,
} from '../../data-access/rescue-case-ui.mapper.js';
import type { RescueCaseStatus } from '../../data-access/rescue-cases-api.models.js';

@Component({
  selector: 'pr-rescue-status-stepper',
  standalone: true,
  styleUrl: './rescue-status-stepper.component.css',
  templateUrl: './rescue-status-stepper.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RescueStatusStepperComponent {
  readonly status = input.required<RescueCaseStatus>();
  readonly options = input.required<StatusTransitionOption[]>();
  readonly statusChanged = output<RescueCaseStatus>();

  label(status: RescueCaseStatus): string {
    return rescueStatusLabel(status);
  }
}
