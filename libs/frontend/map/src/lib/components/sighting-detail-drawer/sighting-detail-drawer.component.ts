import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

import type { PublicSighting } from '@petradar/frontend/sightings';
import { StatusBadgeComponent } from '@petradar/frontend/shared-ui';

@Component({
  selector: 'pr-sighting-detail-drawer',
  standalone: true,
  imports: [RouterLink, StatusBadgeComponent],
  templateUrl: './sighting-detail-drawer.component.html',
  styleUrl: './sighting-detail-drawer.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SightingDetailDrawerComponent {
  readonly closed = output();
  readonly sighting = input.required<PublicSighting>();

  toneFor(): 'danger' | 'match' | 'success' | 'warning' {
    const sighting = this.sighting();
    if (sighting.condition === 'Injured' || sighting.urgency === 'High') {
      return 'danger';
    }
    if (sighting.status === 'Possible match') {
      return 'match';
    }
    if (sighting.status === 'Reunited' || sighting.verificationStatus.includes('Verified')) {
      return 'success';
    }
    return 'warning';
  }
}
