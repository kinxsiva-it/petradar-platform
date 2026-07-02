import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { StatusBadgeComponent } from '@petradar/frontend/shared-ui';

import type { LostPetView } from '../../data-access/index.js';

@Component({
  selector: 'pr-lost-pet-card',
  standalone: true,
  imports: [RouterLink, StatusBadgeComponent],
  templateUrl: './lost-pet-card.component.html',
  styleUrl: './lost-pet-card.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LostPetCardComponent {
  readonly pet = input.required<LostPetView>();

  tone(status: string): 'default' | 'match' | 'success' {
    if (status === 'Possible match') return 'match';
    if (status === 'Reunited') return 'success';
    return 'default';
  }
}

