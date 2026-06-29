import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { PublicDiscoveryDataSource } from '@petradar/frontend/mock-data';
import { EmptyStateComponent, PrivacyBannerComponent, StatusBadgeComponent } from '@petradar/frontend/shared-ui';

import { LostPetPhotoGalleryComponent } from '../../components/lost-pet-photo-gallery/lost-pet-photo-gallery.component.js';
import { PossibleMatchSummaryComponent } from '../../components/possible-match-summary/possible-match-summary.component.js';

type DetailState = 'default' | 'loading' | 'error';

@Component({
  selector: 'pr-lost-pet-detail-page',
  standalone: true,
  imports: [
    EmptyStateComponent,
    LostPetPhotoGalleryComponent,
    PossibleMatchSummaryComponent,
    PrivacyBannerComponent,
    RouterLink,
    StatusBadgeComponent,
  ],
  templateUrl: './lost-pet-detail-page.component.html',
  styleUrl: './lost-pet-detail-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LostPetDetailPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly dataSource = inject(PublicDiscoveryDataSource);
  readonly uiState = signal<DetailState>(
    (this.route.snapshot.queryParamMap.get('uiState') as DetailState | null) ?? 'default',
  );
  readonly pet = computed(() => this.dataSource.findLostPet(this.route.snapshot.paramMap.get('id')));
}

