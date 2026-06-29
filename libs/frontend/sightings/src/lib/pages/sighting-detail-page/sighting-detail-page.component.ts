import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { PublicDiscoveryDataSource } from '@petradar/frontend/mock-data';
import { EmptyStateComponent, PrivacyBannerComponent } from '@petradar/frontend/shared-ui';

import { RelatedSightingsComponent } from '../../components/related-sightings/related-sightings.component.js';
import { SightingMetadataComponent } from '../../components/sighting-metadata/sighting-metadata.component.js';
import { SightingPhotoGalleryComponent } from '../../components/sighting-photo-gallery/sighting-photo-gallery.component.js';

type DetailState = 'default' | 'loading' | 'error';

@Component({
  selector: 'pr-sighting-detail-page',
  standalone: true,
  imports: [
    EmptyStateComponent,
    PrivacyBannerComponent,
    RelatedSightingsComponent,
    RouterLink,
    SightingMetadataComponent,
    SightingPhotoGalleryComponent,
  ],
  templateUrl: './sighting-detail-page.component.html',
  styleUrl: './sighting-detail-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SightingDetailPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly dataSource = inject(PublicDiscoveryDataSource);
  readonly uiState = signal<DetailState>(
    (this.route.snapshot.queryParamMap.get('uiState') as DetailState | null) ?? 'default',
  );
  readonly sighting = computed(() =>
    this.dataSource.findSighting(this.route.snapshot.paramMap.get('id')),
  );
  readonly related = computed(() =>
    this.sighting()
      ? this.dataSource.relatedSightings(this.sighting()?.id ?? '', this.sighting()?.species)
      : [],
  );
}
