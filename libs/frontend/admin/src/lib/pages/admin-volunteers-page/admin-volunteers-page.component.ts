import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { injectQuery } from '@tanstack/angular-query-experimental';
import {
  createAngularTable,
  createColumnHelper,
  getCoreRowModel,
  type ColumnDef,
} from '@tanstack/angular-table';
import { lastValueFrom } from 'rxjs';

import { EmptyStateComponent, LoadingSkeletonComponent, StatusBadgeComponent } from '@petradar/frontend/shared-ui';

import type {
  AdminUserSummary,
  AdminUsersFilters,
  AdminUsersResponse,
} from '../../data-access/admin-users-api.models.js';
import { AdminUsersApiService } from '../../data-access/admin-users-api.service.js';

type VolunteersState = 'loading' | 'ready' | 'error';

const pageSize = 25;
const volunteerColumnHelper = createColumnHelper<AdminUserSummary>();
const volunteerColumns: ColumnDef<AdminUserSummary, string>[] = [
  volunteerColumnHelper.accessor('displayName', {
    header: 'Volunteer',
  }),
  volunteerColumnHelper.accessor('email', {
    header: 'Email',
  }),
  volunteerColumnHelper.accessor(volunteerVerificationValue, {
    header: 'Verification',
    id: 'volunteerVerification',
  }),
  volunteerColumnHelper.accessor('id', {
    header: 'Detail',
    id: 'detail',
  }),
];
const volunteerRowModel = getCoreRowModel<AdminUserSummary>();

function volunteerVerificationValue(user: AdminUserSummary): string {
  return user.volunteerVerification;
}

@Component({
  selector: 'pr-admin-volunteers-page',
  standalone: true,
  imports: [EmptyStateComponent, FormsModule, LoadingSkeletonComponent, RouterLink, StatusBadgeComponent],
  styleUrl: './admin-volunteers-page.component.css',
  templateUrl: './admin-volunteers-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminVolunteersPageComponent {
  private readonly usersApi = inject(AdminUsersApiService);
  readonly query = signal('');
  readonly page = signal(1);
  readonly filters = computed<AdminUsersFilters>(() => ({
    page: this.page(),
    pageSize,
    query: this.query().trim() || undefined,
    role: 'VOLUNTEER',
    status: 'ACTIVE',
  }));
  readonly volunteersQuery = injectQuery(() => ({
    queryKey: ['admin', 'volunteers', this.filters()],
    queryFn: () => lastValueFrom(this.usersApi.list(this.filters())),
    staleTime: 30_000,
  }));
  readonly response = computed<AdminUsersResponse | null>(() => this.volunteersQuery.data() ?? null);
  readonly uiState = computed<VolunteersState>(() => {
    if (this.volunteersQuery.isPending()) {
      return 'loading';
    }
    if (this.volunteersQuery.isError()) {
      return 'error';
    }
    return 'ready';
  });
  readonly errorMessage = computed(() => toUserMessage(this.volunteersQuery.error()));
  readonly table = createAngularTable<AdminUserSummary>(() => ({
    columns: volunteerColumns,
    data: this.response()?.items ?? [],
    getCoreRowModel: volunteerRowModel,
  }));

  loadVolunteers(page = 1): void {
    if (this.page() === page) {
      void this.volunteersQuery.refetch();
      return;
    }
    this.page.set(page);
  }

  search(value: string): void {
    this.query.set(value);
    this.page.set(1);
  }

  initials(user: AdminUserSummary): string {
    return user.displayName
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('');
  }
}

function toUserMessage(error: unknown): string {
  if (!(error instanceof HttpErrorResponse)) {
    return 'Volunteers could not be loaded.';
  }
  if (error.status === 0) {
    return 'The PetRadar API is unavailable. Volunteers could not be loaded.';
  }
  if (error.status === 403) {
    return 'You do not have permission to view volunteers.';
  }
  return 'Volunteers could not be loaded.';
}
