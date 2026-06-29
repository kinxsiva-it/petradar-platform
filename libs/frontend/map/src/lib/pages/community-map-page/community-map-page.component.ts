import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  LucideCat,
  LucideCircleCheck,
  LucideDog,
  LucideHeartPulse,
  LucideLifeBuoy,
  LucidePawPrint,
  LucideSearch,
  LucideStar,
} from '@lucide/angular';
import {
  DiscoveryFilters,
  PublicDiscoveryDataSource,
  PublicSighting,
} from '@petradar/frontend/mock-data';
import { EmptyStateComponent } from '@petradar/frontend/shared-ui';
import {
  ActiveCaseSummary,
  ActiveCaseSummaryComponent,
} from '../../components/active-case-summary/active-case-summary.component.js';
import { MapCanvasComponent } from '../../components/map-canvas/map-canvas.component.js';
import {
  MapFilterChip,
  MapFilterChipsComponent,
} from '../../components/map-filter-chips/map-filter-chips.component.js';
import { MapFilterPanelComponent } from '../../components/map-filter-panel/map-filter-panel.component.js';
import { MapReportCtaComponent } from '../../components/map-report-cta/map-report-cta.component.js';
import { MapResultCountComponent } from '../../components/map-result-count/map-result-count.component.js';
import { MapResultsListComponent } from '../../components/map-results-list/map-results-list.component.js';
import { MapSearchOverlayComponent } from '../../components/map-search-overlay/map-search-overlay.component.js';
import { MapTopNavComponent } from '../../components/map-top-nav/map-top-nav.component.js';
import { SightingDetailDrawerComponent } from '../../components/sighting-detail-drawer/sighting-detail-drawer.component.js';
type MapUiState = 'default' | 'loading' | 'empty' | 'error' | 'location-denied' | 'map-unavailable';
type NearMeState = 'idle' | 'loading' | 'ready' | 'denied';
@Component({
  selector: 'pr-community-map-page',
  standalone: true,
  imports: [
    ActiveCaseSummaryComponent,
    EmptyStateComponent,
    MapCanvasComponent,
    MapFilterChipsComponent,
    MapFilterPanelComponent,
    MapReportCtaComponent,
    MapResultCountComponent,
    MapResultsListComponent,
    MapSearchOverlayComponent,
    MapTopNavComponent,
    SightingDetailDrawerComponent,
  ],
  templateUrl: './community-map-page.component.html',
  styleUrl: './community-map-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommunityMapPageComponent {
  private readonly route = inject(ActivatedRoute);
  readonly dataSource = inject(PublicDiscoveryDataSource);
  readonly uiState = signal<MapUiState>(
    (this.route.snapshot.queryParamMap.get('uiState') as MapUiState | null) ?? 'default',
  );
  readonly advancedFiltersOpen = signal(false);
  readonly casesOpen = signal(false);
  readonly nearMeState = signal<NearMeState>(
    this.uiState() === 'location-denied' ? 'denied' : 'idle',
  );
  readonly selected = computed(() => this.dataSource.selectedSighting());
  readonly selectedId = computed(() => this.selected()?.id ?? null);
  readonly visibleSightings = computed(() =>
    this.uiState() === 'empty' ? [] : this.dataSource.filteredSightings(),
  );
  readonly visibleSelected = computed(() => {
    const selected = this.selected();
    return selected && this.visibleSightings().some((item) => item.id === selected.id)
      ? selected
      : undefined;
  });
  readonly hasFilteredEmpty = computed(
    () =>
      this.dataSource.filteredSightings().length === 0 && this.dataSource.sightings().length > 0,
  );
  readonly filterChips = computed<MapFilterChip[]>(() => {
    const filters = this.dataSource.currentSightingFilters();
    return [
      {
        active: filters.species === 'Cat',
        icon: LucideCat,
        key: 'species',
        label: 'Cats',
        tone: 'cat',
        value: 'Cat',
      },
      {
        active: filters.species === 'Dog',
        icon: LucideDog,
        key: 'species',
        label: 'Dogs',
        tone: 'dog',
        value: 'Dog',
      },
      {
        active: filters.species === 'Other',
        icon: LucidePawPrint,
        key: 'species',
        label: 'Other animals',
        tone: 'other',
        value: 'Other',
      },
      {
        active: filters.condition === 'Injured',
        icon: LucideHeartPulse,
        key: 'condition',
        label: 'Injured',
        tone: 'injured',
        value: 'Injured',
      },
      {
        active: filters.status === 'Possible match',
        icon: LucideStar,
        key: 'status',
        label: 'Possible match',
        tone: 'match',
        value: 'Possible match',
      },
      {
        active: filters.status === 'Needs rescue',
        icon: LucideLifeBuoy,
        key: 'status',
        label: 'Rescue needed',
        tone: 'rescue',
        value: 'Needs rescue',
      },
      {
        active: filters.status === 'Reunited',
        icon: LucideCircleCheck,
        key: 'status',
        label: 'Reunited',
        tone: 'reunited',
        value: 'Reunited',
      },
    ];
  });
  readonly activeSummary = computed<ActiveCaseSummary>(() => {
    const sightings = this.visibleSightings();
    return {
      cats: countBy(sightings, (item) => item.species === 'Cat'),
      dogs: countBy(sightings, (item) => item.species === 'Dog'),
      injured: countBy(sightings, (item) => item.condition === 'Injured'),
      matches: countBy(sightings, (item) => item.status === 'Possible match'),
      other: countBy(sightings, (item) => item.species === 'Other'),
      rescue: countBy(sightings, (item) => item.status === 'Needs rescue'),
      reunited: countBy(sightings, (item) => item.status === 'Reunited'),
      total: sightings.length,
    };
  });
  selectSighting(id: string): void {
    this.dataSource.setSelectedSighting(id);
  }
  updateFilter(event: { key: keyof DiscoveryFilters; value: string }): void {
    this.dataSource.updateSightingFilter(
      event.key,
      event.value as DiscoveryFilters[typeof event.key],
    );
    this.ensureSelectedVisible();
  }
  clearFilters(): void {
    this.dataSource.clearSightingFilters();
    this.ensureSelectedVisible();
  }
  updateSearch(query: string): void {
    this.updateFilter({ key: 'query', value: query });
  }
  toggleChip(chip: MapFilterChip): void {
    const current = this.dataSource.currentSightingFilters()[chip.key];
    const nextValue = current === chip.value ? 'All' : chip.value;
    this.updateFilter({ key: chip.key, value: nextValue });
  }
  runNearMe(): void {
    if (this.nearMeState() === 'denied') {
      return;
    }
    this.nearMeState.set('loading');
    window.setTimeout(() => this.nearMeState.set('ready'), 650);
  }
  resetMapFilters(): void {
    this.clearFilters();
    this.casesOpen.set(false);
  }
  private ensureSelectedVisible(): void {
    const visible = this.dataSource.filteredSightings();
    const selectedId = this.selectedId();
    if (selectedId && !visible.some((item) => item.id === selectedId)) {
      this.dataSource.clearSelectedSighting();
    }
  }
}
function countBy(
  sightings: readonly PublicSighting[],
  predicate: (sighting: PublicSighting) => boolean,
): number {
  return sightings.filter(predicate).length;
}
