import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';

import { EmptyStateComponent, LoadingSkeletonComponent } from '@petradar/frontend/shared-ui';

import type { AdminAuditLogsFilters, AdminAuditLogsResponse } from '../../data-access/admin-audit-logs-api.models.js';
import { AdminAuditLogsApiService } from '../../data-access/admin-audit-logs-api.service.js';

type AuditState = 'loading' | 'ready' | 'error';

const initialFilters: AdminAuditLogsFilters = {
  page: 1,
  pageSize: 25,
};

@Component({
  selector: 'pr-admin-audit-logs-page',
  standalone: true,
  imports: [EmptyStateComponent, FormsModule, LoadingSkeletonComponent],
  styleUrl: './admin-audit-logs-page.component.css',
  templateUrl: './admin-audit-logs-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminAuditLogsPageComponent {
  private readonly auditLogsApi = inject(AdminAuditLogsApiService);
  readonly filters = signal<AdminAuditLogsFilters>({ ...initialFilters });
  readonly response = signal<AdminAuditLogsResponse | null>(null);
  readonly uiState = signal<AuditState>('loading');
  readonly errorMessage = signal('');

  constructor() {
    void this.loadAuditLogs();
  }

  async loadAuditLogs(): Promise<void> {
    this.uiState.set('loading');
    this.errorMessage.set('');
    try {
      this.response.set(await firstValueFrom(this.auditLogsApi.list(this.filters())));
      this.uiState.set('ready');
    } catch (error) {
      this.errorMessage.set(toUserMessage(error));
      this.uiState.set('error');
    }
  }

  updateFilter(key: keyof AdminAuditLogsFilters, value: string): void {
    this.filters.update((filters) => ({
      ...filters,
      [key]: value.trim() || undefined,
      page: 1,
    }));
    void this.loadAuditLogs();
  }

  clearFilters(): void {
    this.filters.set({ ...initialFilters });
    void this.loadAuditLogs();
  }

  page(delta: number): void {
    const response = this.response();
    const next = (this.filters().page ?? 1) + delta;
    if (!response || next < 1 || next > response.totalPages) {
      return;
    }
    this.filters.update((filters) => ({ ...filters, page: next }));
    void this.loadAuditLogs();
  }
}

function toUserMessage(error: unknown): string {
  if (!(error instanceof HttpErrorResponse)) {
    return 'Audit logs could not be loaded.';
  }
  if (error.status === 0) {
    return 'The PetRadar API is unavailable. Audit logs could not be loaded.';
  }
  if (error.status === 403) {
    return 'You do not have permission to view audit logs.';
  }
  return 'Audit logs could not be loaded.';
}
