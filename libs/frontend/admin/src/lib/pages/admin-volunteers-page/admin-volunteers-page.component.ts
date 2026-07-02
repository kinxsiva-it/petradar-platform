import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { EmptyStateComponent, LoadingSkeletonComponent, StatusBadgeComponent } from '@petradar/frontend/shared-ui';

import type { AdminUserSummary, AdminUsersResponse } from '../../data-access/admin-users-api.models.js';
import { AdminUsersApiService } from '../../data-access/admin-users-api.service.js';

type VolunteersState = 'loading' | 'ready' | 'error';

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
  readonly response = signal<AdminUsersResponse | null>(null);
  readonly uiState = signal<VolunteersState>('loading');
  readonly errorMessage = signal('');

  constructor() {
    void this.loadVolunteers();
  }

  async loadVolunteers(page = 1): Promise<void> {
    this.uiState.set('loading');
    this.errorMessage.set('');
    try {
      this.response.set(
        await firstValueFrom(
          this.usersApi.list({
            page,
            pageSize: 25,
            query: this.query().trim() || undefined,
            role: 'VOLUNTEER',
            status: 'ACTIVE',
          }),
        ),
      );
      this.uiState.set('ready');
    } catch (error) {
      this.errorMessage.set(toUserMessage(error));
      this.uiState.set('error');
    }
  }

  search(value: string): void {
    this.query.set(value);
    void this.loadVolunteers(1);
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
