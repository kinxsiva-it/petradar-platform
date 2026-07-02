import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { AlertComponent, EmptyStateComponent, LoadingSkeletonComponent } from '@petradar/frontend/shared-ui';

import { HeatmapInsightDrawerComponent } from '../../components/heatmap-insight-drawer/heatmap-insight-drawer.component.js';
import { HeatmapMapComponent } from '../../components/heatmap-map/heatmap-map.component.js';
import type { AnalyticsHotspotPoint } from '../../data-access/analytics-api.models.js';
import { AnalyticsApiService } from '../../data-access/analytics-api.service.js';

type HeatmapState = 'loading' | 'ready' | 'error';

@Component({
  selector: 'pr-community-heatmap-page',
  standalone: true,
  imports: [AlertComponent, EmptyStateComponent, HeatmapInsightDrawerComponent, HeatmapMapComponent, LoadingSkeletonComponent],
  styleUrl: './community-heatmap-page.component.css',
  templateUrl: './community-heatmap-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommunityHeatmapPageComponent {
  private readonly analyticsApi = inject(AnalyticsApiService);
  readonly points = signal<AnalyticsHotspotPoint[]>([]);
  readonly selected = signal<AnalyticsHotspotPoint | undefined>(undefined);
  readonly uiState = signal<HeatmapState>('loading');
  readonly errorMessage = signal('');

  constructor() {
    void this.loadHotspots();
  }

  async loadHotspots(): Promise<void> {
    this.uiState.set('loading');
    this.errorMessage.set('');
    try {
      const response = await firstValueFrom(this.analyticsApi.hotspots());
      this.points.set(response.items);
      this.selected.set(response.items[0]);
      this.uiState.set('ready');
    } catch (error) {
      this.errorMessage.set(toUserMessage(error));
      this.uiState.set('error');
    }
  }
}

function toUserMessage(error: unknown): string {
  if (!(error instanceof HttpErrorResponse)) {
    return 'Hotspots could not be loaded.';
  }
  if (error.status === 0) {
    return 'The PetRadar API is unavailable. Hotspots could not be loaded.';
  }
  if (error.status === 403) {
    return 'You do not have permission to view hotspots.';
  }
  return 'Hotspots could not be loaded.';
}
