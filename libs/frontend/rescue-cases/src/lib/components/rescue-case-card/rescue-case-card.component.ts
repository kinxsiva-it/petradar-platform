import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

import type { RescueCase } from '../../data-access/rescue-case-ui.mapper.js';

import { RescueSeverityBadgeComponent } from '../rescue-severity-badge/rescue-severity-badge.component.js';
import { RescueStatusBadgeComponent } from '../rescue-status-badge/rescue-status-badge.component.js';

@Component({
  selector: 'pr-rescue-case-card',
  standalone: true,
  imports: [RescueSeverityBadgeComponent, RescueStatusBadgeComponent, RouterLink],
  styleUrl: './rescue-case-card.component.css',
  templateUrl: './rescue-case-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RescueCaseCardComponent {
  readonly caseItem = input.required<RescueCase>();
  readonly compact = input(false);
  readonly detailBaseRoute = input('/volunteer/rescue-cases');
  readonly accepted = output<string>();
  readonly showAccept = input(false);
}
