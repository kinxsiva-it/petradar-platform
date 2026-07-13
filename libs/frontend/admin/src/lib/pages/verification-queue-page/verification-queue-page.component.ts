import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { injectMutation, injectQuery } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';

import { AlertComponent, EmptyStateComponent, LoadingSkeletonComponent, StatusBadgeComponent } from '@petradar/frontend/shared-ui';

import { AdminSummaryCardComponent } from '../../components/admin-summary-card/admin-summary-card.component.js';
import { ReportReviewPanelComponent } from '../../components/report-review-panel/report-review-panel.component.js';
import { VerificationFilterBarComponent } from '../../components/verification-filter-bar/verification-filter-bar.component.js';
import { VerificationTableComponent } from '../../components/verification-table/verification-table.component.js';
import {
  AdminSightingsApiService,
} from '../../data-access/admin-sightings-api.service.js';
import type {
  AdminModerationDetail,
  AdminModerationFilters,
  AdminModerationQueueItem,
  AdminModerationQueueResponse,
} from '../../data-access/admin-sightings-api.models.js';

type QueueState = 'loading' | 'ready' | 'error';
type ModerationVariables =
  | { action: 'approve'; id: string }
  | { action: 'reject'; id: string; reason: string };

const initialFilters: AdminModerationFilters = {
  page: 1,
  pageSize: 25,
  sort: 'OLDEST_WAITING_FIRST',
};

@Component({
  selector: 'pr-verification-queue-page',
  standalone: true,
  imports: [
    AdminSummaryCardComponent,
    AlertComponent,
    EmptyStateComponent,
    LoadingSkeletonComponent,
    ReportReviewPanelComponent,
    RouterLink,
    StatusBadgeComponent,
    VerificationFilterBarComponent,
    VerificationTableComponent,
  ],
  styleUrl: './verification-queue-page.component.css',
  templateUrl: './verification-queue-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VerificationQueuePageComponent {
  private readonly adminApi = inject(AdminSightingsApiService);
  readonly filters = signal<AdminModerationFilters>({ ...initialFilters });
  readonly queueQuery = injectQuery(() => ({
    queryKey: ['admin', 'verification-queue', this.filters()],
    queryFn: () => lastValueFrom(this.adminApi.getModerationQueue(this.filters())),
    staleTime: 30_000,
  }));
  readonly moderationMutation = injectMutation<AdminModerationDetail, unknown, ModerationVariables>(() => ({
    mutationFn: (variables) => {
      if (variables.action === 'approve') {
        return lastValueFrom(this.adminApi.approveReport(variables.id));
      }
      return lastValueFrom(this.adminApi.rejectReport(variables.id, variables.reason));
    },
  }));
  readonly response = computed<AdminModerationQueueResponse | null>(() => this.queueQuery.data() ?? null);
  readonly selected = signal<AdminModerationQueueItem | undefined>(undefined);
  readonly actionErrorMessage = signal('');
  readonly uiState = computed<QueueState>(() => {
    if (this.queueQuery.isPending()) {
      return 'loading';
    }
    if (this.queueQuery.isError()) {
      return 'error';
    }
    return 'ready';
  });
  readonly errorMessage = computed(
    () => this.actionErrorMessage() || toUserMessage(this.queueQuery.error()),
  );
  readonly actionMessage = signal('');
  readonly pendingCount = computed(() => this.response()?.total ?? 0);
  readonly urgentCount = computed(
    () =>
      this.response()?.items.filter(
        (item) => item.urgency === 'HIGH' || item.urgency === 'EMERGENCY',
      ).length ?? 0,
  );

  updateFilters(filters: AdminModerationFilters): void {
    this.actionErrorMessage.set('');
    this.filters.set(filters);
  }

  clearFilters(): void {
    this.actionErrorMessage.set('');
    this.filters.set({ ...initialFilters });
  }

  loadQueue(): void {
    this.actionErrorMessage.set('');
    void this.queueQuery.refetch();
  }

  nextPage(): void {
    const response = this.response();
    const currentPage = this.filters().page ?? 1;
    if (!response || currentPage >= response.totalPages) {
      return;
    }
    this.updateFilters({ ...this.filters(), page: currentPage + 1 });
  }

  previousPage(): void {
    const currentPage = this.filters().page ?? 1;
    if (currentPage <= 1) {
      return;
    }
    this.updateFilters({ ...this.filters(), page: currentPage - 1 });
  }

  async approve(id: string): Promise<void> {
    if (!window.confirm('Verify this animal sighting?')) {
      return;
    }
    await this.runModeration({ action: 'approve', id }, 'Sighting verified.');
  }

  async reject(id: string): Promise<void> {
    const reason = window.prompt('Enter a rejection reason.');
    if (!reason?.trim()) {
      return;
    }
    await this.runModeration(
      { action: 'reject', id, reason: reason.trim() },
      'Sighting rejected.',
    );
  }

  private async runModeration(
    variables: ModerationVariables,
    successMessage: string,
  ): Promise<void> {
    this.actionMessage.set('');
    this.actionErrorMessage.set('');
    try {
      await this.moderationMutation.mutateAsync(variables);
      this.actionMessage.set(successMessage);
      await this.queueQuery.refetch();
      this.selected.set(undefined);
    } catch (error) {
      this.actionMessage.set('');
      this.actionErrorMessage.set(toUserMessage(error));
    }
  }
}

function toUserMessage(error: unknown): string {
  if (!(error instanceof HttpErrorResponse)) {
    return 'Verification queue could not be loaded.';
  }

  if (error.status === 0) {
    return 'The PetRadar API is unavailable. Please try again soon.';
  }

  if (error.status === 409) {
    return 'This sighting has already been moderated.';
  }

  const body = error.error as { message?: string | string[] } | null;
  const message = body?.message;
  if (Array.isArray(message) && message.length > 0) {
    return message.join(' ');
  }
  if (typeof message === 'string' && message.trim()) {
    return message;
  }

  return 'Verification queue could not be loaded.';
}
