import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { StatusBadgeComponent } from '@petradar/frontend/shared-ui';
import type { PublicSighting } from '@petradar/frontend/mock-data';

@Component({
  selector: 'pr-sighting-metadata',
  standalone: true,
  imports: [StatusBadgeComponent],
  templateUrl: './sighting-metadata.component.html',
  styleUrl: './sighting-metadata.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SightingMetadataComponent {
  readonly sighting = input.required<PublicSighting>();
}

