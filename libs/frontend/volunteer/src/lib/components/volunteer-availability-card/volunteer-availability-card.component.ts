import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import type { VolunteerAvailability, VolunteerAvailabilityStatus } from '@petradar/frontend/mock-data';

@Component({
  selector: 'pr-volunteer-availability-card',
  standalone: true,
  styleUrl: './volunteer-availability-card.component.css',
  templateUrl: './volunteer-availability-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VolunteerAvailabilityCardComponent {
  readonly availability = input.required<VolunteerAvailability>();
  readonly statusChanged = output<VolunteerAvailabilityStatus>();
  readonly statuses: VolunteerAvailabilityStatus[] = ['Available', 'Busy', 'Off duty'];
}
