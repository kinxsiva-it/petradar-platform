import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { AdminWorkspaceDataSource } from '@petradar/frontend/mock-data';
import { AlertComponent, EmptyStateComponent, LoadingSkeletonComponent, PrivacyBannerComponent, StatusBadgeComponent } from '@petradar/frontend/shared-ui';

import { AdminActivityListComponent } from '../../components/admin-activity-list/admin-activity-list.component.js';
import { ReportVerificationActionsComponent } from '../../components/report-verification-actions/report-verification-actions.component.js';

@Component({
  selector: 'pr-verification-detail-page',
  standalone: true,
  imports: [
    AdminActivityListComponent,
    AlertComponent,
    EmptyStateComponent,
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
  private readonly router = inject(Router);
  readonly admin = inject(AdminWorkspaceDataSource);
  readonly id = this.router.url.split('/').pop()?.split('?')[0] ?? null;
  readonly report = computed(() => this.admin.findReport(this.id));
  readonly uiState = signal(new URLSearchParams(window.location.search).get('uiState') ?? 'ready');

  approve(id: string, note: string): void {
    this.admin.approveReport(id, note);
  }

  reject(id: string, payload: { reason: string; note: string }): void {
    this.admin.rejectReport(id, payload.reason, payload.note);
  }

  openDuplicate(): void {
    const suggestion = this.admin.duplicateSuggestions().find((item) => item.candidateReportId === this.id || item.primaryReportId === this.id);
    void this.router.navigate(['/admin/duplicates', suggestion?.id ?? 'dup-cat-00021']);
  }
}
