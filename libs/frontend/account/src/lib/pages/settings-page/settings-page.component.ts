import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AlertComponent } from '@petradar/frontend/shared-ui';

@Component({
  selector: 'pr-settings-page',
  standalone: true,
  imports: [AlertComponent, RouterLink],
  styleUrl: './settings-page.component.css',
  templateUrl: './settings-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsPageComponent {}
