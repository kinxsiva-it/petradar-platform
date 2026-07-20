import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { injectMutation, injectQuery } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';

import {
  AlertComponent,
  EmptyStateComponent,
  LoadingSkeletonComponent,
  StatusBadgeComponent,
} from '@petradar/frontend/shared-ui';

import type {
  AdminPrivacyCenterResponse,
  UpdateAdminPrivacyPolicyRequest,
} from '../../data-access/admin-privacy-policy-api.models.js';
import { AdminPrivacyPolicyApiService } from '../../data-access/admin-privacy-policy-api.service.js';

type PrivacyPageState = 'loading' | 'ready' | 'error';

@Component({
  selector: 'pr-privacy-control-page',
  standalone: true,
  imports: [AlertComponent, EmptyStateComponent, FormsModule, LoadingSkeletonComponent, StatusBadgeComponent],
  styleUrl: './privacy-control-page.component.css',
  templateUrl: './privacy-control-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrivacyControlPageComponent {
  private readonly privacyApi = inject(AdminPrivacyPolicyApiService);
  readonly privacyQuery = injectQuery(() => ({
    queryKey: ['admin', 'privacy-policy'],
    queryFn: () => lastValueFrom(this.privacyApi.detail()),
    staleTime: 30_000,
  }));
  readonly privacyMutation = injectMutation<
    AdminPrivacyCenterResponse,
    unknown,
    UpdateAdminPrivacyPolicyRequest
  >(() => ({
    mutationFn: (request) => lastValueFrom(this.privacyApi.updatePublicLocationPolicy(request)),
  }));
  readonly response = computed<AdminPrivacyCenterResponse | null>(
    () => this.privacyQuery.data() ?? null,
  );
  readonly uiState = computed<PrivacyPageState>(() => {
    if (this.privacyQuery.isPending()) {
      return 'loading';
    }
    if (this.privacyQuery.isError()) {
      return 'error';
    }
    return 'ready';
  });
  readonly actionErrorMessage = signal('');
  readonly errorMessage = computed(() => {
    const actionError = this.actionErrorMessage();
    if (actionError) {
      return actionError;
    }
    return this.privacyQuery.isError()
      ? toUserMessage(this.privacyQuery.error(), 'Privacy and moderation status could not be loaded.')
      : '';
  });
  readonly actionMessage = signal('');
  readonly saving = computed(() => this.privacyMutation.isPending());
  readonly radiusDraft = signal(300);
  readonly hasUnsavedChanges = computed(() => {
    const policy = this.response()?.policy;
    return policy ? this.radiusDraft() !== policy.defaultRadiusMeters : false;
  });
  readonly radiusIsValid = computed(() => {
    const policy = this.response()?.policy;
    const radius = this.radiusDraft();
    return policy
      ? radius >= policy.minimumRadiusMeters && radius <= policy.maximumRadiusMeters
      : false;
  });
  readonly moderationBacklog = computed(() => {
    const moderation = this.response()?.moderation;
    return (moderation?.pendingSightingsCount ?? 0) + (moderation?.needsReviewSightingsCount ?? 0);
  });

  private readonly syncRadiusDraftAfterLoad = effect(() => {
    const dataUpdatedAt = this.privacyQuery.dataUpdatedAt();
    const policy = this.response()?.policy;
    if (dataUpdatedAt === 0 || !policy) {
      return;
    }
    this.radiusDraft.set(policy.defaultRadiusMeters);
  });

  loadPrivacyCenter(): void {
    this.actionErrorMessage.set('');
    this.actionMessage.set('');
    void this.privacyQuery.refetch();
  }

  updateRadiusDraft(value: number | string): void {
    const radius = Number(value);
    if (Number.isFinite(radius)) {
      this.radiusDraft.set(Math.round(radius));
      this.actionErrorMessage.set('');
      this.actionMessage.set('');
    }
  }

  resetDraft(): void {
    const policy = this.response()?.policy;
    if (!policy) {
      return;
    }
    this.radiusDraft.set(policy.defaultRadiusMeters);
    this.actionErrorMessage.set('');
    this.actionMessage.set('');
  }

  async savePolicy(): Promise<void> {
    const policy = this.response()?.policy;
    if (!policy || this.saving()) {
      return;
    }

    const radius = this.radiusDraft();
    this.actionErrorMessage.set('');
    this.actionMessage.set('');
    if (radius < policy.minimumRadiusMeters || radius > policy.maximumRadiusMeters) {
      this.actionErrorMessage.set(
        `Public radius must be between ${String(policy.minimumRadiusMeters)} and ${String(policy.maximumRadiusMeters)} meters.`,
      );
      return;
    }

    try {
      await this.privacyMutation.mutateAsync({ defaultRadiusMeters: radius });
      await this.privacyQuery.refetch();
      this.actionMessage.set('Public-location privacy policy was updated.');
    } catch (error) {
      this.actionErrorMessage.set(toUserMessage(error, 'Privacy policy could not be saved.'));
    }
  }

  policySourceLabel(source: string): string {
    if (source === 'audit-log') {
      return 'Persisted policy';
    }
    if (source === 'environment') {
      return 'Environment default';
    }
    return 'Safe default';
  }

  protectedControlLabel(key: string): string {
    if (key === 'publicExactLocationExposure') {
      return 'Exact location exposure';
    }
    if (key === 'publicReporterContactExposure') {
      return 'Reporter contact exposure';
    }
    return 'Protected public data';
  }

  formatTimestamp(value: string | null): string {
    if (!value) {
      return 'No activity recorded';
    }

    const timestamp = new Date(value);
    return Number.isNaN(timestamp.getTime()) ? value : timestamp.toLocaleString();
  }
}

function toUserMessage(error: unknown, fallback: string): string {
  if (!(error instanceof HttpErrorResponse)) {
    return fallback;
  }
  if (error.status === 0) {
    return 'The PetRadar API is unavailable. Privacy and moderation status could not be loaded.';
  }
  if (error.status === 400) {
    return 'The requested privacy policy value is not supported.';
  }
  if (error.status === 403) {
    return 'You do not have permission to manage privacy policy.';
  }
  return fallback;
}
