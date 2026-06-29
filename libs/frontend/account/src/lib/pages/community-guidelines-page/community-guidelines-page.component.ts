import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AlertComponent, PrivacyBannerComponent } from '@petradar/frontend/shared-ui';

interface GuidelineSection {
  title: string;
  points: string[];
}

@Component({
  selector: 'pr-community-guidelines-page',
  standalone: true,
  imports: [AlertComponent, PrivacyBannerComponent, RouterLink],
  styleUrl: './community-guidelines-page.component.css',
  templateUrl: './community-guidelines-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommunityGuidelinesPageComponent {
  readonly sections: GuidelineSection[] = [
    {
      title: 'Safe reporting',
      points: [
        'Report what you see without approaching animals that appear distressed.',
        'Keep your distance and avoid blocking escape routes.',
        'Upload clear photos only when it is safe to do so.',
      ],
    },
    {
      title: 'Injured or aggressive animals',
      points: [
        'Do not touch injured animals unless trained help asks you to assist.',
        'For aggressive behavior, stay back and share approximate information.',
        'Use local emergency services for immediate danger.',
      ],
    },
    {
      title: 'Location privacy',
      points: [
        'Public pages show approximate areas only.',
        'Exact coordinates must not be shared in public notes or screenshots.',
        'Coordinate sensitive rescues through verified helpers or admins.',
      ],
    },
    {
      title: 'Respectful community behavior',
      points: [
        'Contact owners with care and avoid accusations.',
        'False reports may be reviewed and removed.',
        'Respect volunteers, clinic partners, and animal welfare teams.',
      ],
    },
  ];
}
