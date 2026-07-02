import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import {
  LostPetsApiService,
  matchLevelLabel,
  type ApiMatchLevel,
  type ApiMatchReviewStatus,
  type MatchApiResponse,
  type MatchListFilters,
  type PaginatedResponse,
  toLostPetMatchView,
  type LostPetMatchView,
} from '@petradar/frontend/lost-pets';
import { EmptyStateComponent, LoadingSkeletonComponent, StatusBadgeComponent } from '@petradar/frontend/shared-ui';

type MatchReviewState = 'loading' | 'ready' | 'error';

const initialFilters: MatchListFilters = {
  page: 1,
  pageSize: 25,
  status: 'PENDING',
};

@Component({
  selector: 'pr-admin-match-review-page',
  standalone: true,
  imports: [EmptyStateComponent, FormsModule, LoadingSkeletonComponent, RouterLink, StatusBadgeComponent],
  styleUrl: './admin-match-review-page.component.css',
  templateUrl: './admin-match-review-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminMatchReviewPageComponent {
  private readonly matchesApi = inject(LostPetsApiService);
  readonly filters = signal<MatchListFilters>({ ...initialFilters });
  readonly response = signal<PaginatedResponse<MatchApiResponse> | null>(null);
  readonly uiState = signal<MatchReviewState>('loading');
  readonly errorMessage = signal('');
  readonly items = computed<LostPetMatchView[]>(() =>
    (this.response()?.items ?? []).map((item) => toLostPetMatchView(item)),
  );
  readonly pendingCount = computed(
    () => this.response()?.items.filter((item) => item.reviewStatus === 'PENDING').length ?? 0,
  );
  readonly highCount = computed(
    () => this.response()?.items.filter((item) => item.level === 'HIGH').length ?? 0,
  );

  constructor() {
    void this.loadMatches();
  }

  async loadMatches(): Promise<void> {
    this.uiState.set('loading');
    this.errorMessage.set('');
    try {
      this.response.set(await firstValueFrom(this.matchesApi.listMatches(this.filters())));
      this.uiState.set('ready');
    } catch (error) {
      this.errorMessage.set(toUserMessage(error, 'Match review queue could not be loaded.'));
      this.uiState.set('error');
    }
  }

  updateStatus(status: string): void {
    this.updateFilters({ status: isMatchReviewStatus(status) ? status : undefined });
  }

  clearFilters(): void {
    this.filters.set({ page: 1, pageSize: initialFilters.pageSize });
    void this.loadMatches();
  }

  nextPage(): void {
    const response = this.response();
    const page = this.filters().page ?? 1;
    if (!response || page >= response.totalPages) {
      return;
    }
    this.filters.update((filters) => ({ ...filters, page: page + 1 }));
    void this.loadMatches();
  }

  previousPage(): void {
    const page = this.filters().page ?? 1;
    if (page <= 1) {
      return;
    }
    this.filters.update((filters) => ({ ...filters, page: page - 1 }));
    void this.loadMatches();
  }

  levelLabel(level: ApiMatchLevel): string {
    return matchLevelLabel(level);
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

  private updateFilters(patch: Partial<MatchListFilters>): void {
    this.filters.update((filters) => ({ ...filters, ...patch, page: 1 }));
    void this.loadMatches();
  }
}

function toUserMessage(error: unknown, fallback: string): string {
  if (!(error instanceof HttpErrorResponse)) {
    return fallback;
  }
  if (error.status === 0) {
    return 'The PetRadar API is unavailable. Match review queue could not be loaded.';
  }
  if (error.status === 403) {
    return 'You do not have permission to review matches.';
  }
  return fallback;
}

function isMatchReviewStatus(status: string): status is ApiMatchReviewStatus {
  return status === 'CONFIRMED' || status === 'PENDING' || status === 'REJECTED';
}
