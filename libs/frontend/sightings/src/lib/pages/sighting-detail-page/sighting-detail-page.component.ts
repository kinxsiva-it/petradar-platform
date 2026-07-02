import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { EmptyStateComponent, PrivacyBannerComponent } from '@petradar/frontend/shared-ui';

import { RelatedSightingsComponent } from '../../components/related-sightings/related-sightings.component.js';
import { SightingMetadataComponent } from '../../components/sighting-metadata/sighting-metadata.component.js';
import { SightingPhotoGalleryComponent } from '../../components/sighting-photo-gallery/sighting-photo-gallery.component.js';
import { SightingsApiService } from '../../data-access/sightings-api.service.js';
import { toPublicSightingView, type PublicSighting } from '../../data-access/sighting-ui.mapper.js';

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
  private readonly sightingsApi = inject(SightingsApiService);
  private readonly forcedUiState = this.route.snapshot.queryParamMap.get(
    'uiState',
  ) as DetailState | null;
  readonly uiState = signal<DetailState>(this.forcedUiState ?? 'loading');
  readonly errorMessage = signal('');
  readonly sighting = signal<PublicSighting | undefined>(undefined);
  readonly related = computed<PublicSighting[]>(() => []);

  constructor() {
    if (this.forcedUiState === 'error') {
      return;
    }
    void this.loadSighting();
  }

  private async loadSighting(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.uiState.set('error');
      this.errorMessage.set('Report not found.');
      return;
    }

    this.uiState.set('loading');
    try {
      const sighting = await firstValueFrom(this.sightingsApi.publicDetail(id));
      this.sighting.set(toPublicSightingView(sighting));
      this.uiState.set('default');
    } catch (error) {
      this.errorMessage.set(toUserMessage(error));
      this.uiState.set('error');
    }
  }
}

function toUserMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse && error.status === 0) {
    return 'The PetRadar API is unavailable. Please try again soon.';
  }

  return 'This public sighting could not be loaded.';
}
