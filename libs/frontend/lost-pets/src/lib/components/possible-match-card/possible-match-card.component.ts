import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

import type { MatchResult, PublicSighting } from '@petradar/frontend/mock-data';

@Component({
  selector: 'pr-possible-match-card',
  standalone: true,
  imports: [RouterLink],
  styleUrl: './possible-match-card.component.css',
  templateUrl: './possible-match-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PossibleMatchCardComponent {
  readonly match = input.required<MatchResult>();
  readonly sighting = input.required<PublicSighting>();
  readonly reviewRequested = output<string>();
}
