import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { StatusBadgeComponent } from '@petradar/frontend/shared-ui';
import type { PublicLostPet } from '@petradar/frontend/mock-data';

@Component({
  selector: 'pr-lost-pet-card',
  standalone: true,
  imports: [RouterLink, StatusBadgeComponent],
  templateUrl: './lost-pet-card.component.html',
  styleUrl: './lost-pet-card.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LostPetCardComponent {
  readonly pet = input.required<PublicLostPet>();
}

