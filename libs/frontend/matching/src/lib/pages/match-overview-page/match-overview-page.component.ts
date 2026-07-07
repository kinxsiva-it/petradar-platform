import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { PrivacyBannerComponent } from '@petradar/frontend/shared-ui';

@Component({
  selector: 'pr-match-overview-page',
  standalone: true,
  imports: [PrivacyBannerComponent, RouterLink],
  styleUrl: './match-overview-page.component.css',
  templateUrl: './match-overview-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MatchOverviewPageComponent {}
