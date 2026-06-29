import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

export interface ActiveCaseSummary {
  cats: number;
  dogs: number;
  injured: number;
  matches: number;
  other: number;
  rescue: number;
  reunited: number;
  total: number;
}

@Component({
  selector: 'pr-active-case-summary',
  standalone: true,
  templateUrl: './active-case-summary.component.html',
  styleUrl: './active-case-summary.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActiveCaseSummaryComponent {
  readonly summary = input.required<ActiveCaseSummary>();
  readonly viewAll = output<void>();
}
