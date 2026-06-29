import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';

import {
  LucideBadgeCheck,
  LucideCat,
  LucideChevronRight,
  LucideDog,
  LucideHeartPulse,
  LucideLifeBuoy,
  LucidePawPrint,
  LucideStar,
} from '@lucide/angular';

export interface ActiveCaseSummary {
  total: number;
  cats: number;
  dogs: number;
  other: number;
  injured: number;
  matches: number;
  rescue: number;
  reunited: number;
}

@Component({
  selector: 'pr-active-case-summary',
  standalone: true,
  imports: [
    LucideBadgeCheck,
    LucideCat,
    LucideChevronRight,
    LucideDog,
    LucideHeartPulse,
    LucideLifeBuoy,
    LucidePawPrint,
    LucideStar,
  ],
  templateUrl: './active-case-summary.component.html',
  styleUrl: './active-case-summary.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActiveCaseSummaryComponent {
  readonly summary = input.required<ActiveCaseSummary>();
  readonly viewAll = output();
}