import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { firstValueFrom, type Observable } from 'rxjs';

import type { UserRole } from '@petradar/frontend/core';
import {
  AlertComponent,
  EmptyStateComponent,
  LoadingSkeletonComponent,
  StatusBadgeComponent,
} from '@petradar/frontend/shared-ui';

import type {
  AdminAccountStatus,
  AdminUserSummary,
  VolunteerVerificationState,
} from '../../data-access/admin-users-api.models.js';
import { AdminUsersApiService } from '../../data-access/admin-users-api.service.js';

type DetailState = 'loading' | 'ready' | 'error' | 'not-found';
type UserAction = 'roles' | 'status' | 'volunteerVerification';

const availableRoles: readonly UserRole[] = ['GUEST', 'REPORTER', 'PET_OWNER', 'VOLUNTEER', 'ADMIN'];
const accountStatuses: readonly AdminAccountStatus[] = ['ACTIVE', 'SUSPENDED', 'PENDING_REVIEW'];
const volunteerVerificationStates: readonly VolunteerVerificationState[] = [
  'PENDING',
  'VERIFIED',
  'REJECTED',
];

@Component({
  selector: 'pr-admin-user-detail-page',
  standalone: true,
  imports: [
    AlertComponent,
    EmptyStateComponent,
    FormsModule,
    LoadingSkeletonComponent,
    RouterLink,
    StatusBadgeComponent,
  ],
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
  readonly actionMessage = signal('');
  readonly roleDraft = signal<readonly UserRole[]>([]);
  readonly statusDraft = signal<AdminAccountStatus>('ACTIVE');
  readonly volunteerVerificationDraft = signal<VolunteerVerificationState>('PENDING');
  readonly savingAction = signal<UserAction | null>(null);
  readonly availableRoles = availableRoles;
  readonly accountStatuses = accountStatuses;
  readonly volunteerVerificationStates = volunteerVerificationStates;
  readonly isVolunteer = computed(() => this.user()?.roles.includes('VOLUNTEER') ?? false);

  constructor() {
    void this.loadUser();
  }

  async loadUser(): Promise<void> {
    const id = this.id;
    if (!id) {
      this.uiState.set('not-found');
      return;
    }

    this.uiState.set('loading');
    this.errorMessage.set('');
    this.actionMessage.set('');
    try {
      this.applyUser(await firstValueFrom(this.usersApi.detail(id)));
      this.uiState.set('ready');
    } catch (error) {
      this.errorMessage.set(toUserMessage(error));
      this.uiState.set(error instanceof HttpErrorResponse && error.status === 404 ? 'not-found' : 'error');
    }
  }

  roleChecked(role: UserRole): boolean {
    return this.roleDraft().includes(role);
  }

  updateRoleDraft(role: UserRole, event: Event): void {
    if (!(event.target instanceof HTMLInputElement)) {
      return;
    }

    const checked = event.target.checked;
    this.roleDraft.update((roles) =>
      checked ? uniqueRoles([...roles, role]) : roles.filter((current) => current !== role),
    );
  }

  updateStatusDraft(status: string): void {
    if (isAccountStatus(status)) {
      this.statusDraft.set(status);
    }
  }

  updateVolunteerVerificationDraft(volunteerVerification: string): void {
    if (isVolunteerVerificationState(volunteerVerification)) {
      this.volunteerVerificationDraft.set(volunteerVerification);
    }
  }

  resetDrafts(): void {
    const user = this.user();
    if (!user) {
      return;
    }
    this.syncDrafts(user);
    this.errorMessage.set('');
    this.actionMessage.set('');
  }

  async saveRoles(): Promise<void> {
    const id = this.id;
    const roles = [...this.roleDraft()];
    if (!id || this.savingAction() || roles.length === 0) {
      return;
    }

    await this.saveAction(
      'roles',
      () => this.usersApi.updateRoles(id, { roles }),
      'User roles were updated.',
    );
  }

  async saveStatus(): Promise<void> {
    const id = this.id;
    if (!id || this.savingAction()) {
      return;
    }

    await this.saveAction(
      'status',
      () => this.usersApi.updateStatus(id, { status: this.statusDraft() }),
      'Account status was updated.',
    );
  }

  async saveVolunteerVerification(): Promise<void> {
    const id = this.id;
    if (!id || this.savingAction() || !this.isVolunteer()) {
      return;
    }

    await this.saveAction(
      'volunteerVerification',
      () =>
        this.usersApi.updateVolunteerVerification(id, {
          volunteerVerification: this.volunteerVerificationDraft(),
        }),
      'Volunteer verification was updated.',
    );
  }

  private async saveAction(
    action: UserAction,
    request: () => Observable<AdminUserSummary>,
    successMessage: string,
  ): Promise<void> {
    this.savingAction.set(action);
    this.errorMessage.set('');
    this.actionMessage.set('');
    try {
      this.applyUser(await firstValueFrom(request()));
      this.actionMessage.set(successMessage);
    } catch (error) {
      this.errorMessage.set(toActionMessage(error));
    } finally {
      this.savingAction.set(null);
    }
  }

  private applyUser(user: AdminUserSummary): void {
    this.user.set(user);
    this.syncDrafts(user);
  }

  private syncDrafts(user: AdminUserSummary): void {
    this.roleDraft.set(user.roles);
    this.statusDraft.set(user.accountStatus);
    this.volunteerVerificationDraft.set(
      user.volunteerVerification === 'NOT_APPLICABLE' ? 'PENDING' : user.volunteerVerification,
    );
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

function toActionMessage(error: unknown): string {
  if (!(error instanceof HttpErrorResponse)) {
    return 'User action could not be saved.';
  }
  if (error.status === 0) {
    return 'The PetRadar API is unavailable. User action could not be saved.';
  }
  if (error.status === 400) {
    return 'The requested user action is invalid.';
  }
  if (error.status === 403) {
    return 'You do not have permission to perform that user action.';
  }
  if (error.status === 404) {
    return 'User not found.';
  }
  if (error.status === 409) {
    return 'That user action conflicts with the current account state.';
  }
  return 'User action could not be saved.';
}

function uniqueRoles(roles: readonly UserRole[]): UserRole[] {
  return Array.from(new Set(roles));
}

function isAccountStatus(status: string): status is AdminAccountStatus {
  return status === 'ACTIVE' || status === 'SUSPENDED' || status === 'PENDING_REVIEW';
}

function isVolunteerVerificationState(
  volunteerVerification: string,
): volunteerVerification is VolunteerVerificationState {
  return (
    volunteerVerification === 'NOT_APPLICABLE' ||
    volunteerVerification === 'PENDING' ||
    volunteerVerification === 'VERIFIED' ||
    volunteerVerification === 'REJECTED'
  );
}
