import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { forkJoin, lastValueFrom } from 'rxjs';

import { EmptyStateComponent, LoadingSkeletonComponent } from '@petradar/frontend/shared-ui';

import { AnalyticsSummaryGridComponent } from '../../components/analytics-summary-grid/analytics-summary-grid.component.js';
import { DistributionChartComponent } from '../../components/distribution-chart/distribution-chart.component.js';
import { AnalyticsApiService } from '../../data-access/analytics-api.service.js';
import type {
  AnalyticsBySpeciesResponse,
  AnalyticsByStatusResponse,
  AnalyticsChartSegment,
  AnalyticsMetric,
  AnalyticsSummaryResponse,
} from '../../data-access/analytics-api.models.js';

type AnalyticsState = 'loading' | 'ready' | 'error';
interface AnalyticsDashboardResponse {
  bySpecies: AnalyticsBySpeciesResponse;
  byStatus: AnalyticsByStatusResponse;
  summary: AnalyticsSummaryResponse;
}

@Component({
  selector: 'pr-analytics-dashboard-page',
  standalone: true,
  imports: [
    AnalyticsSummaryGridComponent,
    DistributionChartComponent,
    EmptyStateComponent,
    LoadingSkeletonComponent,
  ],
  styleUrl: './analytics-dashboard-page.component.css',
  templateUrl: './analytics-dashboard-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnalyticsDashboardPageComponent {
  private readonly analyticsApi = inject(AnalyticsApiService);
  readonly analyticsQuery = injectQuery(() => ({
    queryKey: ['admin', 'analytics', 'dashboard'],
    queryFn: () =>
      lastValueFrom(
        forkJoin({
          bySpecies: this.analyticsApi.bySpecies(),
          byStatus: this.analyticsApi.byStatus(),
          summary: this.analyticsApi.summary(),
        }),
      ),
    staleTime: 30_000,
  }));
  readonly response = computed<AnalyticsDashboardResponse | null>(
    () => this.analyticsQuery.data() ?? null,
  );
  readonly summary = computed<AnalyticsSummaryResponse | null>(
    () => this.response()?.summary ?? null,
  );
  readonly bySpecies = computed<AnalyticsBySpeciesResponse | null>(
    () => this.response()?.bySpecies ?? null,
  );
  readonly byStatus = computed<AnalyticsByStatusResponse | null>(
    () => this.response()?.byStatus ?? null,
  );
  readonly uiState = computed<AnalyticsState>(() => {
    if (this.analyticsQuery.isPending()) {
      return 'loading';
    }
    if (this.analyticsQuery.isError()) {
      return 'error';
    }
    return 'ready';
  });
  readonly errorMessage = computed(() => toUserMessage(this.analyticsQuery.error()));
  readonly metrics = computed(() => summaryMetrics(this.summary()));
  readonly speciesSegments = computed<AnalyticsChartSegment[]>(() =>
    (this.bySpecies()?.items ?? []).map(
      (item, index): AnalyticsChartSegment => ({
        color: palette[index % palette.length] ?? '#64748b',
        label: item.species ?? 'Unknown',
        value: item.count,
      }),
    ),
  );
  readonly sightingStatusSegments = computed(() => statusSegments(this.byStatus()?.sightings ?? []));
  readonly rescueStatusSegments = computed(() => statusSegments(this.byStatus()?.rescueCases ?? []));
  readonly hasData = computed(
    () =>
      this.metrics().some((metric) => metric.value > 0) ||
      this.speciesSegments().length > 0 ||
      this.sightingStatusSegments().length > 0 ||
      this.rescueStatusSegments().length > 0,
  );

  loadAnalytics(): void {
    void this.analyticsQuery.refetch();
  }
}

const palette = ['#0f766e', '#2563eb', '#f59e0b', '#ef4444', '#7c3aed', '#0891b2'];

function summaryMetrics(summary: AnalyticsSummaryResponse | null): AnalyticsMetric[] {
  if (!summary) {
    return [];
  }
  return [
    metric('Total sightings', summary.totalSightings),
    metric('Pending sightings', summary.pendingSightings, 'warning'),
    metric('Verified sightings', summary.verifiedSightings, 'success'),
    metric('Active lost pets', summary.activeLostPets, 'match'),
    metric('Active rescue cases', summary.activeRescueCases, 'danger'),
    metric('Possible matches', summary.possibleMatches, 'match'),
    metric('Injured cases', summary.injuredCases, 'danger'),
    metric('Resolved rescues', summary.resolvedRescueCases, 'success'),
  ].filter((item): item is AnalyticsMetric => item !== null);
}

function metric(
  label: string,
  value: number | undefined,
  tone: AnalyticsMetric['tone'] = 'success',
): AnalyticsMetric | null {
  if (value === undefined) {
    return null;
  }
  return {
    delta: 'Current platform total',
    label,
    tone,
    value,
  };
}

function statusSegments(
  items: { count: number; status?: string }[],
): AnalyticsChartSegment[] {
  return items.map(
    (item, index): AnalyticsChartSegment => ({
      color: palette[index % palette.length] ?? '#64748b',
      label: item.status ?? 'Unknown',
      value: item.count,
    }),
  );
}

function toUserMessage(error: unknown): string {
  if (!(error instanceof HttpErrorResponse)) {
    return 'Analytics could not be loaded.';
  }
  if (error.status === 0) {
    return 'PetRadar analytics are temporarily unavailable. Please try again.';
  }
  if (error.status === 403) {
    return 'You do not have permission to view analytics.';
  }
  return 'Analytics could not be loaded.';
}
