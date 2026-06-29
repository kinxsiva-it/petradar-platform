import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { AdminWorkspaceDataSource, type AdminAccountStatus, type AdminUserRole, type VolunteerVerificationState } from '@petradar/frontend/mock-data';
import { EmptyStateComponent, LoadingSkeletonComponent, StatusBadgeComponent } from '@petradar/frontend/shared-ui';

import { AccountStatusControlComponent } from '../../components/account-status-control/account-status-control.component.js';
import { AdminActivityListComponent } from '../../components/admin-activity-list/admin-activity-list.component.js';
import { RoleEditorComponent } from '../../components/role-editor/role-editor.component.js';

@Component({
  selector: 'pr-admin-user-detail-page',
  standalone: true,
  imports: [
    AccountStatusControlComponent,
    AdminActivityListComponent,
    EmptyStateComponent,
    LoadingSkeletonComponent,
    RoleEditorComponent,
    RouterLink,
    StatusBadgeComponent,
  ],
  styleUrl: './admin-user-detail-page.component.css',
  templateUrl: './admin-user-detail-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminUserDetailPageComponent {
  private readonly router = inject(Router);
  readonly admin = inject(AdminWorkspaceDataSource);
  readonly id = this.router.url.split('/').pop()?.split('?')[0] ?? null;
  readonly user = computed(() => this.admin.findUser(this.id));
  readonly uiState = signal(new URLSearchParams(window.location.search).get('uiState') ?? 'ready');

  changeRole(payload: { role: AdminUserRole; enabled: boolean }): void {
    const user = this.user();
    if (user && window.confirm(`Confirm mock role change: ${payload.role}`)) {
      this.admin.setUserRole(user.id, payload.role, payload.enabled);
    }
  }

  changeAccount(status: AdminAccountStatus): void {
    const user = this.user();
    if (user && window.confirm(`Confirm mock account status change to ${status}`)) {
      this.admin.setAccountStatus(user.id, status);
    }
  }

  changeVolunteer(state: VolunteerVerificationState): void {
    const user = this.user();
    if (user && window.confirm(`Confirm mock volunteer verification change to ${state}`)) {
      this.admin.setVolunteerVerification(user.id, state);
    }
  }
}
