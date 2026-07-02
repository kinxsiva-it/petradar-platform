import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import type { LostPetMatchView } from '../../data-access/index.js';

@Component({
  selector: 'pr-possible-match-card',
  standalone: true,
  imports: [RouterLink],
  styleUrl: './possible-match-card.component.css',
  templateUrl: './possible-match-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PossibleMatchCardComponent {
  readonly match = input.required<LostPetMatchView>();
}
