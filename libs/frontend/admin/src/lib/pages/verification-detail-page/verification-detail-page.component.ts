import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { AlertComponent, EmptyStateComponent, LoadingSkeletonComponent, PrivacyBannerComponent, StatusBadgeComponent } from '@petradar/frontend/shared-ui';

import { AdminActivityListComponent } from '../../components/admin-activity-list/admin-activity-list.component.js';
import { ReportVerificationActionsComponent } from '../../components/report-verification-actions/report-verification-actions.component.js';
import {
  AdminSightingsApiService,
} from '../../data-access/admin-sightings-api.service.js';
import type { AdminModerationDetail } from '../../data-access/admin-sightings-api.models.js';

type DetailState = 'loading' | 'ready' | 'error' | 'not-found';

@Component({
  selector: 'pr-verification-detail-page',
  standalone: true,
  imports: [
    AdminActivityListComponent,
    AlertComponent,
    EmptyStateComponent,
    FormsModule,
    LoadingSkeletonComponent,
    PrivacyBannerComponent,
    ReportVerificationActionsComponent,
    RouterLink,
    StatusBadgeComponent,
  ],
  styleUrl: './verification-detail-page.component.css',
  templateUrl: './verification-detail-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VerificationDetailPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly adminApi = inject(AdminSightingsApiService);
  readonly id = this.route.snapshot.paramMap.get('id');
  readonly report = signal<AdminModerationDetail | null>(null);
  readonly uiState = signal<DetailState>('loading');
  readonly errorMessage = signal('');
  readonly actionMessage = signal('');
  readonly processing = signal(false);
  readonly rescueProcessing = signal(false);
  readonly mergeProcessing = signal(false);
  readonly mergeTargetSightingId = signal('');

  constructor() {
    void this.loadDetail();
  }

  async loadDetail(): Promise<void> {
    if (!this.id) {
      this.uiState.set('not-found');
      return;
    }

    this.uiState.set('loading');
    this.errorMessage.set('');
    try {
      this.report.set(await firstValueFrom(this.adminApi.getModerationDetail(this.id)));
      this.uiState.set('ready');
    } catch (error) {
      this.errorMessage.set(toUserMessage(error));
      this.uiState.set(error instanceof HttpErrorResponse && error.status === 404 ? 'not-found' : 'error');
    }
  }

  async approve(): Promise<void> {
    const report = this.report();
    if (!report?.canVerify || this.processing()) {
      return;
    }

    this.processing.set(true);
    this.errorMessage.set('');
    this.actionMessage.set('');
    try {
      this.report.set(await firstValueFrom(this.adminApi.verifySighting(report.id)));
      this.actionMessage.set('Sighting verified.');
    } catch (error) {
      this.errorMessage.set(toUserMessage(error));
    } finally {
      this.processing.set(false);
    }
  }

  async reject(reason: string): Promise<void> {
    const report = this.report();
    if (!report?.canReject || this.processing()) {
      return;
    }

    this.processing.set(true);
    this.errorMessage.set('');
    this.actionMessage.set('');
    try {
      this.report.set(await firstValueFrom(this.adminApi.rejectSighting(report.id, reason)));
      this.actionMessage.set('Sighting rejected.');
    } catch (error) {
      this.errorMessage.set(toUserMessage(error));
    } finally {
      this.processing.set(false);
    }
  }

  async createRescueCase(): Promise<void> {
    const report = this.report();
    if (!report || this.rescueProcessing()) {
      return;
    }
    if (!window.confirm('Convert this sighting into a rescue case?')) {
      return;
    }

    this.rescueProcessing.set(true);
    this.errorMessage.set('');
    this.actionMessage.set('');
    try {
      const rescueCase = await firstValueFrom(this.adminApi.convertToRescue(report.id));
      this.actionMessage.set('Rescue case created.');
      await this.router.navigate(['/rescue-cases', rescueCase.id]);
    } catch (error) {
      this.errorMessage.set(toUserMessage(error));
    } finally {
      this.rescueProcessing.set(false);
    }
  }

  async mergeDuplicate(): Promise<void> {
    const report = this.report();
    const targetId = this.mergeTargetSightingId().trim();
    if (!report || !targetId || this.mergeProcessing()) {
      return;
    }
    if (targetId === report.id) {
      this.errorMessage.set('Target sighting must be different from the source sighting.');
      return;
    }
    if (!window.confirm('Mark this sighting as a duplicate of the target sighting ID?')) {
      return;
    }

    this.mergeProcessing.set(true);
    this.errorMessage.set('');
    this.actionMessage.set('');
    try {
      await firstValueFrom(this.adminApi.mergeSighting(report.id, targetId));
      this.report.set(await firstValueFrom(this.adminApi.getModerationDetail(report.id)));
      this.mergeTargetSightingId.set('');
      this.actionMessage.set('Sighting marked as duplicate.');
    } catch (error) {
      this.errorMessage.set(toUserMessage(error));
    } finally {
      this.mergeProcessing.set(false);
    }
  }
}

function toUserMessage(error: unknown): string {
  if (!(error instanceof HttpErrorResponse)) {
    return 'Report detail could not be loaded.';
  }

  if (error.status === 0) {
    return 'The PetRadar API is unavailable. Please try again soon.';
  }
  if (error.status === 403) {
    return 'You do not have permission to moderate this sighting.';
  }
  if (error.status === 404) {
    return 'Sighting not found.';
  }
  if (error.status === 409) {
    return 'This record already has a conflicting state or active rescue case.';
  }

  const body = error.error as { message?: string | string[] } | null;
  const message = body?.message;
  if (Array.isArray(message) && message.length > 0) {
    return message.join(' ');
  }
  if (typeof message === 'string' && message.trim()) {
    return message;
  }

  return 'Report detail could not be loaded.';
}
