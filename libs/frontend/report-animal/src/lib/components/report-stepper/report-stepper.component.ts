import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'pr-report-stepper',
  standalone: true,
  styleUrl: './report-stepper.component.css',
  templateUrl: './report-stepper.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportStepperComponent {
  readonly current = input.required<number>();
  readonly steps = input.required<string[]>();
  readonly stepSelected = output<number>();
}
