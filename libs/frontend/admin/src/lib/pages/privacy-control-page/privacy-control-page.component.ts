import { ChangeDetectionStrategy, Component } from '@angular/core';

import { AlertComponent, EmptyStateComponent } from '@petradar/frontend/shared-ui';

@Component({
  selector: 'pr-privacy-control-page',
  standalone: true,
  imports: [AlertComponent, EmptyStateComponent],
  styleUrl: './privacy-control-page.component.css',
  templateUrl: './privacy-control-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrivacyControlPageComponent {}
