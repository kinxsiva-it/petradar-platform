import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import {
  LostPetsApiService,
  matchLevelLabel,
  type ApiMatchReviewStatus,
  type LostPetMatchView,
  toLostPetMatchView,
} from '@petradar/frontend/lost-pets';
import {
  AlertComponent,
  EmptyStateComponent,
  LoadingSkeletonComponent,
  PrivacyBannerComponent,
  StatusBadgeComponent,
} from '@petradar/frontend/shared-ui';

type MatchDetailState = 'loading' | 'ready' | 'error' | 'not-found';

@Component({
  selector: 'pr-admin-match-detail-page',
  standalone: true,
  imports: [
    AlertComponent,
    EmptyStateComponent,
    FormsModule,
    LoadingSkeletonComponent,
    PrivacyBannerComponent,
    RouterLink,
    StatusBadgeComponent,
  ],
  styleUrl: './admin-match-detail-page.component.css',
  templateUrl: './admin-match-detail-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminMatchDetailPageComponent {
  private readonly matchesApi = inject(LostPetsApiService);
  private readonly route = inject(ActivatedRoute);
  readonly id = this.route.snapshot.paramMap.get('id');
  readonly detail = signal<LostPetMatchView | null>(null);
  readonly uiState = signal<MatchDetailState>('loading');
  readonly errorMessage = signal('');
  readonly actionMessage = signal('');
  readonly reviewing = signal(false);
  readonly rejectionReason = signal('');
  readonly canReview = computed(() => this.detail()?.reviewStatus === 'PENDING');

  constructor() {
    void this.loadDetail();
  }

  async loadDetail(): Promise<void> {
    const id = this.id;
    if (!id) {
      this.uiState.set('not-found');
      return;
    }

    this.uiState.set('loading');
    this.errorMessage.set('');
    this.actionMessage.set('');
    try {
      this.detail.set(toLostPetMatchView(await firstValueFrom(this.matchesApi.getMatch(id))));
      this.uiState.set('ready');
    } catch (error) {
      this.errorMessage.set(toUserMessage(error, 'Match detail could not be loaded.'));
      this.uiState.set(error instanceof HttpErrorResponse && error.status === 404 ? 'not-found' : 'error');
    }
  }

  async confirmMatch(): Promise<void> {
    const detail = this.detail();
    if (!detail || this.reviewing() || !window.confirm('Confirm this lost-pet match?')) {
      return;
    }

    await this.review(() => this.matchesApi.confirmMatch(detail.id), 'Match confirmed.');
  }

  async rejectMatch(): Promise<void> {
    const detail = this.detail();
    if (!detail || this.reviewing() || !window.confirm('Reject this lost-pet match?')) {
      return;
    }

    await this.review(
      () => this.matchesApi.rejectMatch(detail.id, this.rejectionReason()),
      'Match rejected.',
    );
  }

  levelLabel(detail: LostPetMatchView): string {
    return matchLevelLabel(detail.level);
  }

  statusTone(status: ApiMatchReviewStatus): 'danger' | 'match' | 'success' {
    if (status === 'CONFIRMED') {
      return 'success';
    }
    if (status === 'REJECTED') {
      return 'danger';
    }
    return 'match';
  }

  scoreBackground(score: number): string {
    return `conic-gradient(var(--color-match) ${String(score)}%, var(--color-match-subtle) 0)`;
  }

  private async review(
    action: () => ReturnType<LostPetsApiService['confirmMatch']>,
    successMessage: string,
  ): Promise<void> {
    this.reviewing.set(true);
    this.errorMessage.set('');
    this.actionMessage.set('');
    try {
      this.detail.set(toLostPetMatchView(await firstValueFrom(action())));
      this.rejectionReason.set('');
      this.actionMessage.set(successMessage);
    } catch (error) {
      this.errorMessage.set(toUserMessage(error, 'Match review could not be saved.'));
    } finally {
      this.reviewing.set(false);
    }
  }
}

function toUserMessage(error: unknown, fallback: string): string {
  if (!(error instanceof HttpErrorResponse)) {
    return fallback;
  }
  if (error.status === 0) {
    return 'The PetRadar API is unavailable. Match detail could not be loaded.';
  }
  if (error.status === 403) {
    return 'You do not have permission to review this match.';
  }
  if (error.status === 404) {
    return 'Match not found.';
  }
  if (error.status === 409) {
    return 'This match has already been reviewed. Refresh the detail to see the current status.';
  }
  return fallback;
}
