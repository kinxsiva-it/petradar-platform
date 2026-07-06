import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
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

import { EmptyStateComponent, LoadingSkeletonComponent } from '@petradar/frontend/shared-ui';

import type {
  AdminAuditLogItem,
  AdminAuditLogsFilters,
  AdminAuditLogsResponse,
} from '../../data-access/admin-audit-logs-api.models.js';
import { AdminAuditLogsApiService } from '../../data-access/admin-audit-logs-api.service.js';

type AuditState = 'loading' | 'ready' | 'error';

const initialFilters: AdminAuditLogsFilters = {
  page: 1,
  pageSize: 25,
};

const auditLogColumnHelper = createColumnHelper<AdminAuditLogItem>();
const auditLogColumns: ColumnDef<AdminAuditLogItem, string>[] = [
  auditLogColumnHelper.accessor('createdAt', {
    header: 'Time',
  }),
  auditLogColumnHelper.accessor((item) => item.actor?.displayName ?? 'System', {
    header: 'Actor',
    id: 'actor',
  }),
  auditLogColumnHelper.accessor('action', {
    header: 'Action',
  }),
  auditLogColumnHelper.accessor((item) => `${item.entityType} / ${item.entityId}`, {
    header: 'Entity',
    id: 'entity',
  }),
  auditLogColumnHelper.accessor('summary', {
    header: 'Summary',
  }),
];
const auditLogRowModel = getCoreRowModel<AdminAuditLogItem>();

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
  readonly auditLogsQuery = injectQuery(() => ({
    queryKey: ['admin', 'audit-logs', this.filters()],
    queryFn: () => lastValueFrom(this.auditLogsApi.list(this.filters())),
    staleTime: 30_000,
  }));
  readonly response = computed<AdminAuditLogsResponse | null>(() => this.auditLogsQuery.data() ?? null);
  readonly uiState = computed<AuditState>(() => {
    if (this.auditLogsQuery.isPending()) {
      return 'loading';
    }
    if (this.auditLogsQuery.isError()) {
      return 'error';
    }
    return 'ready';
  });
  readonly errorMessage = computed(() => toUserMessage(this.auditLogsQuery.error()));
  readonly auditRows = computed(() => this.response()?.items ?? []);
  readonly table = createAngularTable<AdminAuditLogItem>(() => ({
    columns: auditLogColumns,
    data: this.auditRows(),
    getCoreRowModel: auditLogRowModel,
  }));

  updateFilter(key: keyof AdminAuditLogsFilters, value: string): void {
    this.filters.update((filters) => ({
      ...filters,
      [key]: value.trim() || undefined,
      page: 1,
    }));
  }

  clearFilters(): void {
    this.filters.set({ ...initialFilters });
  }

  page(delta: number): void {
    const response = this.response();
    const next = (this.filters().page ?? 1) + delta;
    if (!response || next < 1 || next > response.totalPages) {
      return;
    }
    this.filters.update((filters) => ({ ...filters, page: next }));
  }

  headerLabel(header: Header<AdminAuditLogItem, unknown>): string {
    const value = header.column.columnDef.header;
    return typeof value === 'string' ? value : '';
  }

  cellValue(cell: Cell<AdminAuditLogItem, unknown>): string {
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
