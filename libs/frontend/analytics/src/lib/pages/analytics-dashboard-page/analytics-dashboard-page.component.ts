import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { forkJoin, firstValueFrom } from 'rxjs';

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
  readonly summary = signal<AnalyticsSummaryResponse | null>(null);
  readonly bySpecies = signal<AnalyticsBySpeciesResponse | null>(null);
  readonly byStatus = signal<AnalyticsByStatusResponse | null>(null);
  readonly uiState = signal<AnalyticsState>('loading');
  readonly errorMessage = signal('');
  readonly metrics = computed(() => summaryMetrics(this.summary()));
  readonly speciesSegments = computed(() =>
    (this.bySpecies()?.items ?? []).map((item, index) => ({
      color: palette[index % palette.length],
      label: item.species ?? 'Unknown',
      value: item.count,
    })),
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

  constructor() {
    void this.loadAnalytics();
  }

  async loadAnalytics(): Promise<void> {
    this.uiState.set('loading');
    this.errorMessage.set('');
    try {
      const response = await firstValueFrom(
        forkJoin({
          bySpecies: this.analyticsApi.bySpecies(),
          byStatus: this.analyticsApi.byStatus(),
          summary: this.analyticsApi.summary(),
        }),
      );
      this.summary.set(response.summary);
      this.bySpecies.set(response.bySpecies);
      this.byStatus.set(response.byStatus);
      this.uiState.set('ready');
    } catch (error) {
      this.errorMessage.set(toUserMessage(error));
      this.uiState.set('error');
    }
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
    delta: 'Current API value',
    label,
    tone,
    value,
  };
}

function statusSegments(items: { count: number; status?: string }[]): AnalyticsChartSegment[] {
  return items.map((item, index) => ({
    color: palette[index % palette.length],
    label: item.status ?? 'Unknown',
    value: item.count,
  }));
}

function toUserMessage(error: unknown): string {
  if (!(error instanceof HttpErrorResponse)) {
    return 'Analytics could not be loaded.';
  }
  if (error.status === 0) {
    return 'The PetRadar API is unavailable. Analytics could not be loaded.';
  }
  if (error.status === 403) {
    return 'You do not have permission to view analytics.';
  }
  return 'Analytics could not be loaded.';
}
