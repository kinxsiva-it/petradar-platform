import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import type { UserRole } from '@petradar/frontend/core';
import { EmptyStateComponent, LoadingSkeletonComponent, StatusBadgeComponent } from '@petradar/frontend/shared-ui';

import { AdminSummaryCardComponent } from '../../components/admin-summary-card/admin-summary-card.component.js';
import { AdminUserTableComponent } from '../../components/admin-user-table/admin-user-table.component.js';
import type {
  AdminAccountStatus,
  AdminUsersFilters,
  AdminUsersResponse,
  VolunteerVerificationState,
} from '../../data-access/admin-users-api.models.js';
import { AdminUsersApiService } from '../../data-access/admin-users-api.service.js';

type UsersState = 'loading' | 'ready' | 'error';

const initialFilters: AdminUsersFilters = {
  page: 1,
  pageSize: 25,
};

@Component({
  selector: 'pr-admin-users-page',
  standalone: true,
  imports: [
    AdminSummaryCardComponent,
    AdminUserTableComponent,
    EmptyStateComponent,
    FormsModule,
    LoadingSkeletonComponent,
    RouterLink,
    StatusBadgeComponent,
  ],
  styleUrl: './admin-users-page.component.css',
  templateUrl: './admin-users-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminUsersPageComponent {
  private readonly usersApi = inject(AdminUsersApiService);
  readonly filters = signal<AdminUsersFilters>({ ...initialFilters });
  readonly response = signal<AdminUsersResponse | null>(null);
  readonly uiState = signal<UsersState>('loading');
  readonly errorMessage = signal('');
  readonly adminCount = computed(
    () => this.response()?.items.filter((user) => user.roles.includes('ADMIN')).length ?? 0,
  );
  readonly volunteerCount = computed(
    () => this.response()?.items.filter((user) => user.roles.includes('VOLUNTEER')).length ?? 0,
  );
  readonly suspendedCount = computed(
    () => this.response()?.items.filter((user) => user.accountStatus === 'SUSPENDED').length ?? 0,
  );

  constructor() {
    void this.loadUsers();
  }

  async loadUsers(): Promise<void> {
    this.uiState.set('loading');
    this.errorMessage.set('');
    try {
      this.response.set(await firstValueFrom(this.usersApi.list(this.filters())));
      this.uiState.set('ready');
    } catch (error) {
      this.errorMessage.set(toUserMessage(error));
      this.uiState.set('error');
    }
  }

  updateQuery(query: string): void {
    this.updateFilters({ query: query.trim() || undefined });
  }

  updateRole(role: 'All' | UserRole): void {
    this.updateFilters({ role: role === 'All' ? undefined : role });
  }

  updateStatus(status: 'All' | AdminAccountStatus): void {
    this.updateFilters({ status: status === 'All' ? undefined : status });
  }

  updateVolunteerVerification(value: 'All' | VolunteerVerificationState): void {
    this.updateFilters({ volunteerVerification: value === 'All' ? undefined : value });
  }

  clearFilters(): void {
    this.filters.set({ ...initialFilters });
    void this.loadUsers();
  }

  nextPage(): void {
    const response = this.response();
    const page = this.filters().page ?? 1;
    if (!response || page >= response.totalPages) {
      return;
    }
    this.filters.update((filters) => ({ ...filters, page: page + 1 }));
    void this.loadUsers();
  }

  previousPage(): void {
    const page = this.filters().page ?? 1;
    if (page <= 1) {
      return;
    }
    this.filters.update((filters) => ({ ...filters, page: page - 1 }));
    void this.loadUsers();
  }

  private updateFilters(patch: Partial<AdminUsersFilters>): void {
    this.filters.update((filters) => ({ ...filters, ...patch, page: 1 }));
    void this.loadUsers();
  }
}

function toUserMessage(error: unknown): string {
  if (!(error instanceof HttpErrorResponse)) {
    return 'Users could not be loaded.';
  }
  if (error.status === 0) {
    return 'The PetRadar API is unavailable. Users could not be loaded.';
  }
  if (error.status === 403) {
    return 'You do not have permission to view users.';
  }
  return 'Users could not be loaded.';
}
