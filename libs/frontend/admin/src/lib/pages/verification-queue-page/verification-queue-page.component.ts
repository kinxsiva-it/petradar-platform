import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { AlertComponent, EmptyStateComponent, LoadingSkeletonComponent, StatusBadgeComponent } from '@petradar/frontend/shared-ui';

import { AdminSummaryCardComponent } from '../../components/admin-summary-card/admin-summary-card.component.js';
import { ReportReviewPanelComponent } from '../../components/report-review-panel/report-review-panel.component.js';
import { VerificationFilterBarComponent } from '../../components/verification-filter-bar/verification-filter-bar.component.js';
import { VerificationTableComponent } from '../../components/verification-table/verification-table.component.js';
import {
  AdminSightingsApiService,
} from '../../data-access/admin-sightings-api.service.js';
import type {
  AdminModerationFilters,
  AdminModerationQueueItem,
  AdminModerationQueueResponse,
} from '../../data-access/admin-sightings-api.models.js';

type QueueState = 'loading' | 'ready' | 'error';

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
  private requestVersion = 0;
  readonly filters = signal<AdminModerationFilters>({ ...initialFilters });
  readonly response = signal<AdminModerationQueueResponse | null>(null);
  readonly selected = signal<AdminModerationQueueItem | undefined>(undefined);
  readonly uiState = signal<QueueState>('loading');
  readonly errorMessage = signal('');
  readonly actionMessage = signal('');
  readonly pendingCount = computed(() => this.response()?.total ?? 0);
  readonly urgentCount = computed(
    () =>
      this.response()?.items.filter(
        (item) => item.urgency === 'HIGH' || item.urgency === 'EMERGENCY',
      ).length ?? 0,
  );

  constructor() {
    void this.loadQueue();
  }

  async loadQueue(): Promise<void> {
    const version = ++this.requestVersion;
    this.uiState.set('loading');
    this.errorMessage.set('');
    try {
      const response = await firstValueFrom(this.adminApi.getModerationQueue(this.filters()));
      if (version !== this.requestVersion) {
        return;
      }
      this.response.set(response);
      this.selected.set(response.items[0]);
      this.uiState.set('ready');
    } catch (error) {
      if (version !== this.requestVersion) {
        return;
      }
      this.errorMessage.set(toUserMessage(error));
      this.uiState.set('error');
    }
  }

  updateFilters(filters: AdminModerationFilters): void {
    this.filters.set(filters);
    void this.loadQueue();
  }

  clearFilters(): void {
    this.filters.set({ ...initialFilters });
    void this.loadQueue();
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
    await this.runModeration(() => this.adminApi.approveReport(id), 'Sighting verified.');
  }

  async reject(id: string): Promise<void> {
    const reason = window.prompt('Enter a rejection reason.');
    if (!reason?.trim()) {
      return;
    }
    await this.runModeration(
      () => this.adminApi.rejectReport(id, reason.trim()),
      'Sighting rejected.',
    );
  }

  private async runModeration(
    action: () => ReturnType<AdminSightingsApiService['verifySighting']>,
    successMessage: string,
  ): Promise<void> {
    this.actionMessage.set('');
    try {
      await firstValueFrom(action());
      this.actionMessage.set(successMessage);
      await this.loadQueue();
    } catch (error) {
      this.errorMessage.set(toUserMessage(error));
      this.uiState.set('error');
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
