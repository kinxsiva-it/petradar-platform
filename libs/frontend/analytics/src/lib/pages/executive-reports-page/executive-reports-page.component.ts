import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AdminWorkspaceDataSource } from '@petradar/frontend/mock-data';
import { AlertComponent, EmptyStateComponent, LoadingSkeletonComponent } from '@petradar/frontend/shared-ui';

import { AnalyticsSummaryGridComponent } from '../../components/analytics-summary-grid/analytics-summary-grid.component.js';
import { DistributionChartComponent } from '../../components/distribution-chart/distribution-chart.component.js';

@Component({
  selector: 'pr-executive-reports-page',
  standalone: true,
  imports: [AlertComponent, AnalyticsSummaryGridComponent, DistributionChartComponent, EmptyStateComponent, FormsModule, LoadingSkeletonComponent],
  styleUrl: './executive-reports-page.component.css',
  templateUrl: './executive-reports-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExecutiveReportsPageComponent {
  readonly admin = inject(AdminWorkspaceDataSource);
  readonly uiState = signal(new URLSearchParams(window.location.search).get('uiState') ?? 'ready');

  mockExport(kind: string): void {
    this.admin.showToast(`${kind} export is available after backend integration.`);
  }
}
