import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AdminWorkspaceDataSource, type PrivacySettings } from '@petradar/frontend/mock-data';
import { AlertComponent, EmptyStateComponent, LoadingSkeletonComponent } from '@petradar/frontend/shared-ui';

import { AdminActivityListComponent } from '../../components/admin-activity-list/admin-activity-list.component.js';

@Component({
  selector: 'pr-privacy-control-page',
  standalone: true,
  imports: [AdminActivityListComponent, AlertComponent, EmptyStateComponent, FormsModule, LoadingSkeletonComponent],
  styleUrl: './privacy-control-page.component.css',
  templateUrl: './privacy-control-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrivacyControlPageComponent {
  readonly admin = inject(AdminWorkspaceDataSource);
  readonly draft = signal<PrivacySettings>({ ...this.admin.privacySettings() });
  readonly uiState = signal(new URLSearchParams(window.location.search).get('uiState') ?? 'ready');

  update<K extends keyof PrivacySettings>(key: K, value: PrivacySettings[K]): void {
    this.draft.update((settings) => ({ ...settings, [key]: value }));
  }

  save(): void {
    if (this.admin.savePrivacySettings(this.draft())) {
      this.draft.set({ ...this.admin.privacySettings() });
    }
  }

  reset(): void {
    this.admin.resetPrivacySettings();
    this.draft.set({ ...this.admin.privacySettings() });
  }
}
