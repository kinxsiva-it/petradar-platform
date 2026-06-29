import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { AlertComponent } from '@petradar/frontend/shared-ui';
import { UserSettings, UserWorkspaceDataSource } from '@petradar/frontend/mock-data';

@Component({
  selector: 'pr-settings-page',
  standalone: true,
  imports: [AlertComponent, FormsModule, RouterLink],
  styleUrl: './settings-page.component.css',
  templateUrl: './settings-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsPageComponent {
  readonly workspace = inject(UserWorkspaceDataSource);
  draft: UserSettings = { ...this.workspace.settings() };

  save(): void {
    this.workspace.updateSettings(this.draft);
  }

  reset(): void {
    this.workspace.resetSettings();
    this.draft = { ...this.workspace.settings() };
  }
}
