import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AlertComponent, StatusBadgeComponent } from '@petradar/frontend/shared-ui';
import { ContactPreference, CurrentUserProfile, UserWorkspaceDataSource } from '@petradar/frontend/mock-data';

@Component({
  selector: 'pr-profile-page',
  standalone: true,
  imports: [AlertComponent, FormsModule, StatusBadgeComponent],
  styleUrl: './profile-page.component.css',
  templateUrl: './profile-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfilePageComponent {
  readonly workspace = inject(UserWorkspaceDataSource);
  readonly editing = signal(false);
  readonly saveSuccess = signal(false);
  readonly validationError = signal('');
  readonly contactOptions: ContactPreference[] = ['Email', 'Phone', 'In-app message'];

  draft: CurrentUserProfile = { ...this.workspace.currentUser() };

  readonly history = computed(() => ({
    lostPets: this.workspace.userLostPets().length,
    reports: this.workspace.userReports().length,
    reunited: this.workspace.userLostPets().filter((pet) => pet.status === 'Reunited').length,
  }));

  edit(): void {
    this.draft = { ...this.workspace.currentUser() };
    this.editing.set(true);
    this.saveSuccess.set(false);
    this.validationError.set('');
  }

  cancel(): void {
    this.editing.set(false);
    this.validationError.set('');
  }

  save(): void {
    if (!this.draft.name.trim() || !this.draft.email.includes('@')) {
      this.validationError.set('Use a display name and valid email.');
      return;
    }
    this.workspace.updateProfile(this.draft);
    this.editing.set(false);
    this.saveSuccess.set(true);
  }
}
