import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AdminWorkspaceDataSource } from '@petradar/frontend/mock-data';
import { EmptyStateComponent, LoadingSkeletonComponent } from '@petradar/frontend/shared-ui';

import { AnalyticsSummaryGridComponent } from '../../components/analytics-summary-grid/analytics-summary-grid.component.js';
import { DistributionChartComponent } from '../../components/distribution-chart/distribution-chart.component.js';
import { TrendChartComponent } from '../../components/trend-chart/trend-chart.component.js';

@Component({
  selector: 'pr-analytics-dashboard-page',
  standalone: true,
  imports: [AnalyticsSummaryGridComponent, DistributionChartComponent, EmptyStateComponent, FormsModule, LoadingSkeletonComponent, TrendChartComponent],
  styleUrl: './analytics-dashboard-page.component.css',
  templateUrl: './analytics-dashboard-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnalyticsDashboardPageComponent {
  readonly admin = inject(AdminWorkspaceDataSource);
  readonly uiState = signal(new URLSearchParams(window.location.search).get('uiState') ?? 'ready');
}
