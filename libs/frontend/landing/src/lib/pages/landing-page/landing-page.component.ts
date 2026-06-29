import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { landingFeatures, landingMetrics } from '@petradar/frontend/mock-data';
import { PrivacyBannerComponent } from '@petradar/frontend/shared-ui';

@Component({
  selector: 'pr-landing-page',
  standalone: true,
  imports: [PrivacyBannerComponent, RouterLink],
  templateUrl: './landing-page.component.html',
  styleUrl: './landing-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingPageComponent {
  readonly features = landingFeatures;
  readonly metrics = landingMetrics;
}
