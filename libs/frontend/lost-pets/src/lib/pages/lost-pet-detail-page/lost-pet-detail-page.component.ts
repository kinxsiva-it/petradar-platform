import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { AuthStateService } from '@petradar/frontend/core';
import {
  AlertComponent,
  EmptyStateComponent,
  LoadingSkeletonComponent,
  PrivacyBannerComponent,
  StatusBadgeComponent,
} from '@petradar/frontend/shared-ui';

import { LostPetPhotoGalleryComponent } from '../../components/lost-pet-photo-gallery/lost-pet-photo-gallery.component.js';
import {
  toAuthorizedLostPetView,
  LostPetsApiService,
  toLostPetView,
  toUserMessage,
  type AuthorizedLostPetView,
  type LostPetView,
} from '../../data-access/index.js';

type DetailState = 'default' | 'loading' | 'error' | 'not-found';

@Component({
  selector: 'pr-lost-pet-detail-page',
  standalone: true,
  imports: [
    AlertComponent,
    EmptyStateComponent,
    LoadingSkeletonComponent,
    LostPetPhotoGalleryComponent,
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
  private readonly auth = inject(AuthStateService);
  private readonly lostPetsApi = inject(LostPetsApiService);

  readonly uiState = signal<DetailState>('loading');
  readonly errorMessage = signal('');
  readonly pet = signal<LostPetView | null>(null);
  readonly authorizedPet = signal<AuthorizedLostPetView | null>(null);
  readonly actionMessage = signal('');
  readonly actionError = signal('');
  readonly matching = signal(false);
  readonly canManage = computed(() => this.authorizedPet() !== null);

  constructor() {
    void this.loadDetail();
  }

  async loadDetail(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.uiState.set('not-found');
      return;
    }

    this.uiState.set('loading');
    this.errorMessage.set('');
    this.actionError.set('');
    try {
      const publicPet = await firstValueFrom(this.lostPetsApi.getLostPet(id));
      this.pet.set(toLostPetView(publicPet));
      this.uiState.set('default');
      await this.loadAuthorizedDetail(id);
    } catch (error) {
      this.errorMessage.set(toDetailMessage(error));
      this.uiState.set(error instanceof HttpErrorResponse && error.status === 404 ? 'not-found' : 'error');
    }
  }

  async runMatching(): Promise<void> {
    const pet = this.authorizedPet();
    if (!pet || this.matching()) {
      return;
    }

    this.matching.set(true);
    this.actionError.set('');
    this.actionMessage.set('');
    try {
      const response = await firstValueFrom(this.lostPetsApi.runMatching(pet.id));
      this.authorizedPet.set({ ...pet, possibleMatchCount: response.items.length });
      this.actionMessage.set(
        `${response.items.length} possible match${response.items.length === 1 ? '' : 'es'} refreshed.`,
      );
    } catch (error) {
      this.actionError.set(toUserMessage(error, 'Matching could not be run. Please try again.'));
    } finally {
      this.matching.set(false);
    }
  }

  private async loadAuthorizedDetail(id: string): Promise<void> {
    await this.auth.initializeSession();
    if (!this.auth.isAuthenticated()) {
      this.authorizedPet.set(null);
      return;
    }

    try {
      const authorized = await firstValueFrom(this.lostPetsApi.getMyLostPet(id));
      this.authorizedPet.set(toAuthorizedLostPetView(authorized));
    } catch (error) {
      if (error instanceof HttpErrorResponse && (error.status === 401 || error.status === 403)) {
        this.authorizedPet.set(null);
        return;
      }
      this.actionError.set(toUserMessage(error, 'Owner actions could not be loaded.'));
    }
  }
}

function toDetailMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse && error.status === 404) {
    return 'Lost pet not found.';
  }
  return toUserMessage(error, 'Lost-pet detail could not be loaded. Please try again.');
}

