import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { injectQuery } from '@tanstack/angular-query-experimental';
import {
  createAngularTable,
  createColumnHelper,
  getCoreRowModel,
  type Cell,
  type ColumnDef,
  type Header,
} from '@tanstack/angular-table';
import { lastValueFrom } from 'rxjs';

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

const matchReviewColumnHelper = createColumnHelper<LostPetMatchView>();
const matchReviewColumns: ColumnDef<LostPetMatchView, string>[] = [
  matchReviewColumnHelper.accessor((item) => item.lostPet.name, {
    header: 'Lost pet',
    id: 'lostPet',
  }),
  matchReviewColumnHelper.accessor((item) => item.sighting.title, {
    header: 'Sighting',
    id: 'sighting',
  }),
  matchReviewColumnHelper.accessor(matchScoreValue, {
    header: 'Score',
    id: 'score',
  }),
  matchReviewColumnHelper.accessor((item) => item.reviewStatusLabel, {
    header: 'Review',
    id: 'reviewStatus',
  }),
  matchReviewColumnHelper.accessor('matchedAt', {
    header: 'Matched',
  }),
  matchReviewColumnHelper.accessor('id', {
    header: 'Action',
    id: 'action',
  }),
];
const matchReviewRowModel = getCoreRowModel<LostPetMatchView>();

function matchScoreValue(item: LostPetMatchView): string {
  return `${String(item.score)}%`;
}

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
  readonly matchesQuery = injectQuery(() => ({
    queryKey: ['admin', 'match-review', this.filters()],
    queryFn: () => lastValueFrom(this.matchesApi.listMatches(this.filters())),
    staleTime: 30_000,
  }));
  readonly response = computed<PaginatedResponse<MatchApiResponse> | null>(
    () => this.matchesQuery.data() ?? null,
  );
  readonly uiState = computed<MatchReviewState>(() => {
    if (this.matchesQuery.isPending()) {
      return 'loading';
    }
    if (this.matchesQuery.isError()) {
      return 'error';
    }
    return 'ready';
  });
  readonly errorMessage = computed(() =>
    toUserMessage(this.matchesQuery.error(), 'Match review queue could not be loaded.'),
  );
  readonly items = computed<LostPetMatchView[]>(() =>
    (this.response()?.items ?? []).map((item) => toLostPetMatchView(item)),
  );
  readonly pendingCount = computed(
    () => this.response()?.items.filter((item) => item.reviewStatus === 'PENDING').length ?? 0,
  );
  readonly highCount = computed(
    () => this.response()?.items.filter((item) => item.level === 'HIGH').length ?? 0,
  );
  readonly table = createAngularTable<LostPetMatchView>(() => ({
    columns: matchReviewColumns,
    data: this.items(),
    getCoreRowModel: matchReviewRowModel,
  }));

  loadMatches(): void {
    void this.matchesQuery.refetch();
  }

  updateStatus(status: string): void {
    this.updateFilters({ status: isMatchReviewStatus(status) ? status : undefined });
  }

  clearFilters(): void {
    this.filters.set({ page: 1, pageSize: initialFilters.pageSize });
  }

  nextPage(): void {
    const response = this.response();
    const page = this.filters().page ?? 1;
    if (!response || page >= response.totalPages) {
      return;
    }
    this.filters.update((filters) => ({ ...filters, page: page + 1 }));
  }

  previousPage(): void {
    const page = this.filters().page ?? 1;
    if (page <= 1) {
      return;
    }
    this.filters.update((filters) => ({ ...filters, page: page - 1 }));
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
  }

  headerLabel(header: Header<LostPetMatchView, unknown>): string {
    const value = header.column.columnDef.header;
    return typeof value === 'string' ? value : '';
  }

  cellValue(cell: Cell<LostPetMatchView, unknown>): string {
    const value = cell.getValue();
    if (typeof value === 'string') {
      return value;
    }
    if (typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }
    return '';
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
