import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'pr-report-success',
  standalone: true,
  imports: [RouterLink],
  styleUrl: './report-success.component.css',
  templateUrl: './report-success.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportSuccessComponent {
  readonly reference = input.required<string>();
}
