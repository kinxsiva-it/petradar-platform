import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';

import { RescueWorkflowDataSource, type RescueCaseStatus, type StatusTransitionOption } from '@petradar/frontend/mock-data';

@Component({
  selector: 'pr-rescue-status-stepper',
  standalone: true,
  styleUrl: './rescue-status-stepper.component.css',
  templateUrl: './rescue-status-stepper.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RescueStatusStepperComponent {
  private readonly rescue = inject(RescueWorkflowDataSource);
  readonly status = input.required<RescueCaseStatus>();
  readonly options = input.required<StatusTransitionOption[]>();
  readonly statusChanged = output<RescueCaseStatus>();

  label(status: RescueCaseStatus): string {
    return this.rescue.statusLabel(status);
  }
}
