import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';

import {
  AlertComponent,
  EmptyStateComponent,
  LoadingSkeletonComponent,
  StatusBadgeComponent,
} from '@petradar/frontend/shared-ui';

import type { AdminPrivacyCenterResponse } from '../../data-access/admin-privacy-policy-api.models.js';
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
  readonly response = signal<AdminPrivacyCenterResponse | null>(null);
  readonly uiState = signal<PrivacyPageState>('loading');
  readonly errorMessage = signal('');
  readonly actionMessage = signal('');
  readonly saving = signal(false);
  readonly radiusDraft = signal(300);
  readonly moderationBacklog = computed(() => {
    const moderation = this.response()?.moderation;
    return (moderation?.pendingSightingsCount ?? 0) + (moderation?.needsReviewSightingsCount ?? 0);
  });

  constructor() {
    void this.loadPrivacyCenter();
  }

  async loadPrivacyCenter(): Promise<void> {
    this.uiState.set('loading');
    this.errorMessage.set('');
    this.actionMessage.set('');
    try {
      this.applyResponse(await firstValueFrom(this.privacyApi.detail()));
      this.uiState.set('ready');
    } catch (error) {
      this.errorMessage.set(toUserMessage(error, 'Privacy and moderation status could not be loaded.'));
      this.uiState.set('error');
    }
  }

  updateRadiusDraft(value: number | string): void {
    const radius = Number(value);
    if (Number.isFinite(radius)) {
      this.radiusDraft.set(Math.round(radius));
    }
  }

  resetDraft(): void {
    const policy = this.response()?.policy;
    if (!policy) {
      return;
    }
    this.radiusDraft.set(policy.defaultRadiusMeters);
    this.errorMessage.set('');
    this.actionMessage.set('');
  }

  async savePolicy(): Promise<void> {
    const policy = this.response()?.policy;
    if (!policy || this.saving()) {
      return;
    }

    const radius = this.radiusDraft();
    if (radius < policy.minimumRadiusMeters || radius > policy.maximumRadiusMeters) {
      this.errorMessage.set(
        `Public radius must be between ${String(policy.minimumRadiusMeters)} and ${String(policy.maximumRadiusMeters)} meters.`,
      );
      return;
    }

    this.saving.set(true);
    this.errorMessage.set('');
    this.actionMessage.set('');
    try {
      this.applyResponse(
        await firstValueFrom(
          this.privacyApi.updatePublicLocationPolicy({ defaultRadiusMeters: radius }),
        ),
      );
      this.actionMessage.set('Public-location privacy policy was updated.');
    } catch (error) {
      this.errorMessage.set(toUserMessage(error, 'Privacy policy could not be saved.'));
    } finally {
      this.saving.set(false);
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

  private applyResponse(response: AdminPrivacyCenterResponse): void {
    this.response.set(response);
    this.radiusDraft.set(response.policy.defaultRadiusMeters);
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
