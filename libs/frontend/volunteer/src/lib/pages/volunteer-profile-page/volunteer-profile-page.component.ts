import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AlertComponent } from '@petradar/frontend/shared-ui';
import { RescueWorkflowDataSource, VolunteerAvailabilityStatus, VolunteerProfile } from '@petradar/frontend/mock-data';

import { VolunteerAvailabilityCardComponent } from '../../components/volunteer-availability-card/volunteer-availability-card.component.js';
import { VolunteerStatCardComponent } from '../../components/volunteer-stat-card/volunteer-stat-card.component.js';

@Component({
  selector: 'pr-volunteer-profile-page',
  standalone: true,
  imports: [AlertComponent, FormsModule, VolunteerAvailabilityCardComponent, VolunteerStatCardComponent],
  styleUrl: './volunteer-profile-page.component.css',
  templateUrl: './volunteer-profile-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VolunteerProfilePageComponent {
  readonly rescue = inject(RescueWorkflowDataSource);
  readonly editing = signal(false);
  readonly saved = signal(false);
  readonly error = signal('');
  draft: VolunteerProfile = { ...this.rescue.volunteerProfile(), availability: { ...this.rescue.volunteerProfile().availability } };

  edit(): void {
    this.draft = { ...this.rescue.volunteerProfile(), availability: { ...this.rescue.volunteerProfile().availability } };
    this.editing.set(true);
    this.saved.set(false);
    this.error.set('');
  }

  save(): void {
    if (!this.draft.volunteer.name.trim() || !this.draft.volunteer.email.includes('@')) {
      this.error.set('Use a volunteer name and valid email.');
      return;
    }
    this.rescue.updateVolunteerProfile(this.draft);
    this.editing.set(false);
    this.saved.set(true);
  }

  availabilityChanged(status: VolunteerAvailabilityStatus): void {
    this.draft = { ...this.draft, availability: { ...this.draft.availability, status } };
    this.rescue.updateAvailability(status);
  }
}
