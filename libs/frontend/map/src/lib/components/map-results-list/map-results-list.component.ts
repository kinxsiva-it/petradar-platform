import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { StatusBadgeComponent } from '@petradar/frontend/shared-ui';
import type { PublicSighting } from '@petradar/frontend/sightings';

@Component({
  selector: 'pr-map-results-list',
  standalone: true,
  imports: [StatusBadgeComponent],
  templateUrl: './map-results-list.component.html',
  styleUrl: './map-results-list.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MapResultsListComponent {
  readonly selectedId = input<string | null>(null);
  readonly sightings = input.required<readonly PublicSighting[]>();
  readonly sightingSelected = output<string>();

  toneFor(sighting: PublicSighting): 'default' | 'danger' | 'match' | 'success' | 'warning' {
    if (sighting.status === 'Needs rescue' || sighting.urgency === 'High') {
      return 'danger';
    }
    if (sighting.status === 'Possible match') {
      return 'match';
    }
    if (sighting.verificationStatus.includes('Verified')) {
      return 'success';
    }
    return 'warning';
  }
}

