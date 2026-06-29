import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AdminWorkspaceDataSource, type HeatmapPointAggregate } from '@petradar/frontend/mock-data';
import { AlertComponent, EmptyStateComponent, LoadingSkeletonComponent } from '@petradar/frontend/shared-ui';

import { HeatmapInsightDrawerComponent } from '../../components/heatmap-insight-drawer/heatmap-insight-drawer.component.js';
import { HeatmapMapComponent } from '../../components/heatmap-map/heatmap-map.component.js';

@Component({
  selector: 'pr-community-heatmap-page',
  standalone: true,
  imports: [AlertComponent, EmptyStateComponent, FormsModule, HeatmapInsightDrawerComponent, HeatmapMapComponent, LoadingSkeletonComponent],
  styleUrl: './community-heatmap-page.component.css',
  templateUrl: './community-heatmap-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommunityHeatmapPageComponent {
  readonly admin = inject(AdminWorkspaceDataSource);
  readonly selected = signal<HeatmapPointAggregate | undefined>(this.admin.heatmapPoints()[0]);
  readonly uiState = signal(new URLSearchParams(window.location.search).get('uiState') ?? 'ready');
}
