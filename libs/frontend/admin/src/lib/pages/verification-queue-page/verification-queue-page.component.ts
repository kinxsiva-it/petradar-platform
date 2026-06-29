import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AdminWorkspaceDataSource, type AdminReport } from '@petradar/frontend/mock-data';
import { AlertComponent, EmptyStateComponent, LoadingSkeletonComponent, StatusBadgeComponent } from '@petradar/frontend/shared-ui';

import { AdminSummaryCardComponent } from '../../components/admin-summary-card/admin-summary-card.component.js';
import { ReportReviewPanelComponent } from '../../components/report-review-panel/report-review-panel.component.js';
import { VerificationFilterBarComponent } from '../../components/verification-filter-bar/verification-filter-bar.component.js';
import { VerificationTableComponent } from '../../components/verification-table/verification-table.component.js';

@Component({
  selector: 'pr-verification-queue-page',
  standalone: true,
  imports: [
    AdminSummaryCardComponent,
    AlertComponent,
    EmptyStateComponent,
    LoadingSkeletonComponent,
    ReportReviewPanelComponent,
    RouterLink,
    StatusBadgeComponent,
    VerificationFilterBarComponent,
    VerificationTableComponent,
  ],
  styleUrl: './verification-queue-page.component.css',
  templateUrl: './verification-queue-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VerificationQueuePageComponent {
  readonly admin = inject(AdminWorkspaceDataSource);
  readonly selected = signal<AdminReport | undefined>(this.admin.filteredReports()[0]);
  readonly uiState = signal(new URLSearchParams(window.location.search).get('uiState') ?? 'ready');

  approve(id: string): void {
    this.admin.approveReport(id, 'Approved from verification queue quick action.');
    this.selected.set(this.admin.filteredReports()[0]);
  }

  reject(id: string): void {
    this.admin.rejectReport(id, 'Insufficient information for verification', 'Rejected from queue quick action.');
    this.selected.set(this.admin.filteredReports()[0]);
  }
}
