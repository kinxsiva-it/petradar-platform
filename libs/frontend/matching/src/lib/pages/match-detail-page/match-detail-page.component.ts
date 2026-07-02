import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
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
import {
  LostPetsApiService,
  toLostPetMatchView,
  toUserMessage,
  type LostPetMatchView,
} from '@petradar/frontend/lost-pets';

import { MatchScoreRingComponent } from '../../components/match-score-ring/match-score-ring.component.js';

type DetailState = 'loading' | 'ready' | 'error' | 'not-found';

@Component({
  selector: 'pr-match-detail-page',
  standalone: true,
  imports: [
    AlertComponent,
    EmptyStateComponent,
    LoadingSkeletonComponent,
    MatchScoreRingComponent,
    PrivacyBannerComponent,
    RouterLink,
    StatusBadgeComponent,
  ],
  styleUrl: './match-detail-page.component.css',
  templateUrl: './match-detail-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MatchDetailPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly auth = inject(AuthStateService);
  private readonly lostPetsApi = inject(LostPetsApiService);
  readonly detail = signal<LostPetMatchView | null>(null);
  readonly uiState = signal<DetailState>('loading');
  readonly errorMessage = signal('');
  readonly actionMessage = signal('');
  readonly reviewing = signal(false);

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
    try {
      this.detail.set(toLostPetMatchView(await firstValueFrom(this.lostPetsApi.getMatch(id))));
      this.uiState.set('ready');
    } catch (error) {
      this.errorMessage.set(toUserMessage(error, 'Match detail could not be loaded.'));
      this.uiState.set(error instanceof HttpErrorResponse && error.status === 404 ? 'not-found' : 'error');
    }
  }

  async confirm(): Promise<void> {
    const detail = this.detail();
    if (!detail || this.reviewing()) {
      return;
    }
    await this.review(() => this.lostPetsApi.confirmMatch(detail.id), 'Match confirmed.');
  }

  async reject(): Promise<void> {
    const detail = this.detail();
    if (!detail || this.reviewing()) {
      return;
    }
    const reason = window.prompt('Optional rejection reason') ?? undefined;
    await this.review(() => this.lostPetsApi.rejectMatch(detail.id, reason), 'Match rejected.');
  }

  private async review(
    action: () => ReturnType<LostPetsApiService['confirmMatch']>,
    successMessage: string,
  ): Promise<void> {
    this.reviewing.set(true);
    this.actionMessage.set('');
    this.errorMessage.set('');
    try {
      this.detail.set(toLostPetMatchView(await firstValueFrom(action())));
      this.actionMessage.set(successMessage);
    } catch (error) {
      this.errorMessage.set(toUserMessage(error, 'Match review could not be saved.'));
    } finally {
      this.reviewing.set(false);
    }
  }

  canReview(): boolean {
    return this.auth.isAdmin() && this.detail()?.reviewStatus === 'PENDING';
  }
}
