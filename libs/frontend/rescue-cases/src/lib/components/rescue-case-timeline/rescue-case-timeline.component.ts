import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import type { RescueTimelineEntry } from '@petradar/frontend/mock-data';

@Component({
  selector: 'pr-rescue-case-timeline',
  standalone: true,
  styleUrl: './rescue-case-timeline.component.css',
  templateUrl: './rescue-case-timeline.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RescueCaseTimelineComponent {
  readonly entries = input.required<RescueTimelineEntry[]>();
}
