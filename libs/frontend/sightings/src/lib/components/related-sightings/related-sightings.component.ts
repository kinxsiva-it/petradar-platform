import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { StatusBadgeComponent } from '@petradar/frontend/shared-ui';
import type { PublicSighting } from '../../data-access/sighting-ui.mapper.js';

@Component({
  selector: 'pr-related-sightings',
  standalone: true,
  imports: [RouterLink, StatusBadgeComponent],
  templateUrl: './related-sightings.component.html',
  styleUrl: './related-sightings.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RelatedSightingsComponent {
  readonly sightings = input.required<readonly PublicSighting[]>();
}

