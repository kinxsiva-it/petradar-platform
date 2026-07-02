import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { AlertComponent, EmptyStateComponent, LoadingSkeletonComponent, StatusBadgeComponent } from '@petradar/frontend/shared-ui';

import type { AdminUserSummary } from '../../data-access/admin-users-api.models.js';
import { AdminUsersApiService } from '../../data-access/admin-users-api.service.js';

type DetailState = 'loading' | 'ready' | 'error' | 'not-found';

@Component({
  selector: 'pr-admin-user-detail-page',
  standalone: true,
  imports: [AlertComponent, EmptyStateComponent, LoadingSkeletonComponent, RouterLink, StatusBadgeComponent],
  styleUrl: './admin-user-detail-page.component.css',
  templateUrl: './admin-user-detail-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminUserDetailPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly usersApi = inject(AdminUsersApiService);
  readonly id = this.route.snapshot.paramMap.get('id');
  readonly user = signal<AdminUserSummary | null>(null);
  readonly uiState = signal<DetailState>('loading');
  readonly errorMessage = signal('');

  constructor() {
    void this.loadUser();
  }

  async loadUser(): Promise<void> {
    if (!this.id) {
      this.uiState.set('not-found');
      return;
    }

    this.uiState.set('loading');
    this.errorMessage.set('');
    try {
      this.user.set(await firstValueFrom(this.usersApi.detail(this.id)));
      this.uiState.set('ready');
    } catch (error) {
      this.errorMessage.set(toUserMessage(error));
      this.uiState.set(error instanceof HttpErrorResponse && error.status === 404 ? 'not-found' : 'error');
    }
  }
}

function toUserMessage(error: unknown): string {
  if (!(error instanceof HttpErrorResponse)) {
    return 'User detail could not be loaded.';
  }
  if (error.status === 0) {
    return 'The PetRadar API is unavailable. User detail could not be loaded.';
  }
  if (error.status === 403) {
    return 'You do not have permission to view this user.';
  }
  if (error.status === 404) {
    return 'User not found.';
  }
  return 'User detail could not be loaded.';
}
