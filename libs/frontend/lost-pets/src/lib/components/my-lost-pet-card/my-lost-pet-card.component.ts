import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

import { StatusBadgeComponent } from '@petradar/frontend/shared-ui';

import type { ApiLostPetStatus, AuthorizedLostPetView } from '../../data-access/index.js';

@Component({
  selector: 'pr-my-lost-pet-card',
  standalone: true,
  imports: [RouterLink, StatusBadgeComponent],
  styleUrl: './my-lost-pet-card.component.css',
  templateUrl: './my-lost-pet-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyLostPetCardComponent {
  readonly pet = input.required<AuthorizedLostPetView>();
  readonly statusChanged = output<{ id: string; status: ApiLostPetStatus }>();

  tone(status: string): 'default' | 'match' | 'success' | 'warning' {
    if (status === 'Possible match') return 'match';
    if (status === 'Reunited') return 'success';
    if (status === 'Closed') return 'default';
    return 'warning';
  }
}
