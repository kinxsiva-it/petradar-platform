import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import {
  LucideCat,
  LucideCircleCheck,
  LucideDog,
  LucideHeartPulse,
  LucideLifeBuoy,
  LucideLoaderCircle,
  LucideLocateFixed,
  LucideMapPinOff,
  LucidePawPrint,
  LucideStar,
} from '@lucide/angular';
import {
  type PublicSighting,
  SightingsApiService,
  toApiListFilters,
  toPublicSightingView,
} from '@petradar/frontend/sightings';
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
import type { DiscoveryFilters } from '../../components/map-filter-panel/map-filter.model.js';
import { MapReportCtaComponent } from '../../components/map-report-cta/map-report-cta.component.js';
import { MapResultCountComponent } from '../../components/map-result-count/map-result-count.component.js';
import { MapResultsListComponent } from '../../components/map-results-list/map-results-list.component.js';
import { MapSearchOverlayComponent } from '../../components/map-search-overlay/map-search-overlay.component.js';
import { SightingDetailDrawerComponent } from '../../components/sighting-detail-drawer/sighting-detail-drawer.component.js';
type MapUiState = 'default' | 'loading' | 'empty' | 'error' | 'location-denied' | 'map-unavailable';
type NearMeState = 'idle' | 'loading' | 'ready' | 'denied';
interface NearbyLocation {
  latitude: number;
  longitude: number;
  radiusMeters: number;
}

const defaultSightingFilters: DiscoveryFilters = {
  condition: 'All',
  query: '',
  species: 'All',
  status: 'All',
  verification: 'All',
};
@Component({
  selector: 'pr-community-map-page',
  standalone: true,
  imports: [
    ActiveCaseSummaryComponent,
    EmptyStateComponent,
    LucideLoaderCircle,
    LucideLocateFixed,
    LucideMapPinOff,
    MapCanvasComponent,
    MapFilterChipsComponent,
    MapFilterPanelComponent,
    MapReportCtaComponent,
    MapResultCountComponent,
    MapResultsListComponent,
    MapSearchOverlayComponent,
    SightingDetailDrawerComponent,
  ],
  templateUrl: './community-map-page.component.html',
  styleUrl: './community-map-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommunityMapPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly sightingsApi = inject(SightingsApiService);
  private readonly forcedUiState = this.route.snapshot.queryParamMap.get(
    'uiState',
  ) as MapUiState | null;
  readonly uiState = signal<MapUiState>(this.forcedUiState ?? 'loading');
  readonly errorMessage = signal('');
  readonly advancedFiltersOpen = signal(false);
  readonly casesOpen = signal(false);
  readonly nearMeState = signal<NearMeState>(
    this.uiState() === 'location-denied' ? 'denied' : 'idle',
  );
  readonly nearbyLocation = signal<NearbyLocation | null>(null);
  readonly filters = signal<DiscoveryFilters>({ ...defaultSightingFilters });
  readonly sightings = signal<PublicSighting[]>([]);
  readonly selectedSightingId = signal<string | null>(null);
  readonly selected = computed(() => this.findSighting(this.selectedSightingId()));
  readonly selectedId = computed(() => this.selected()?.id ?? null);
  readonly currentSightingFilters = computed(() => this.filters());
  readonly visibleSightings = computed(() => (this.uiState() === 'empty' ? [] : this.sightings()));
  readonly visibleSelected = computed(() => {
    const selected = this.selected();
    return selected && this.visibleSightings().some((item) => item.id === selected.id)
      ? selected
      : undefined;
  });
  readonly hasFilteredEmpty = computed(
    () => this.visibleSightings().length === 0 && hasActiveFilters(this.filters()),
  );
  readonly filterChips = computed<MapFilterChip[]>(() => {
    const filters = this.currentSightingFilters();
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
  constructor() {
    if (this.forcedUiState === 'error' || this.forcedUiState === 'map-unavailable') {
      return;
    }
    void this.loadSightings();
  }
  selectSighting(id: string): void {
    this.selectedSightingId.set(id);
  }
  updateFilter(event: { key: keyof DiscoveryFilters; value: string }): void {
    this.filters.update((filters) => ({
      ...filters,
      [event.key]: event.value,
    }));
    void this.loadSightings();
  }
  clearFilters(): void {
    this.filters.set({ ...defaultSightingFilters });
    void this.loadSightings();
  }
  updateSearch(query: string): void {
    this.updateFilter({ key: 'query', value: query });
  }
  toggleChip(chip: MapFilterChip): void {
    const current = this.currentSightingFilters()[chip.key];
    const nextValue = current === chip.value ? 'All' : chip.value;
    this.updateFilter({ key: chip.key, value: nextValue });
  }
  runNearMe(): void {
    if (this.nearMeState() === 'denied') {
      return;
    }
    this.nearMeState.set('loading');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.nearbyLocation.set({
          latitude: roundCoordinate(position.coords.latitude),
          longitude: roundCoordinate(position.coords.longitude),
          radiusMeters: 5_000,
        });
        this.nearMeState.set('ready');
        void this.loadSightings();
      },
      () => {
        this.nearMeState.set('denied');
      },
      { enableHighAccuracy: true, maximumAge: 60_000, timeout: 10_000 },
    );
  }
  resetMapFilters(): void {
    this.clearFilters();
    this.nearbyLocation.set(null);
    if (this.nearMeState() === 'ready') {
      this.nearMeState.set('idle');
    }
    this.casesOpen.set(false);
  }
  private async loadSightings(): Promise<void> {
    this.uiState.set('loading');
    this.errorMessage.set('');
    try {
      const filters = this.currentSightingFilters();
      const nearbyLocation = this.nearbyLocation();
      const response = await firstValueFrom(
        this.sightingsApi.listPublic(
          toApiListFilters({
            condition: filters.condition,
            latitude: nearbyLocation?.latitude,
            lifecycleStatus: filters.status,
            longitude: nearbyLocation?.longitude,
            pageSize: 50,
            query: filters.query,
            radiusMeters: nearbyLocation?.radiusMeters,
            species: filters.species,
            verificationStatus: filters.verification,
          }),
        ),
      );
      this.sightings.set(response.items.map(toPublicSightingView));
      this.uiState.set(
        response.items.length === 0 && !hasActiveFilters(filters) ? 'empty' : 'default',
      );
      this.ensureSelectedVisible();
    } catch (error) {
      this.errorMessage.set(toUserMessage(error));
      this.uiState.set('error');
    }
  }
  private ensureSelectedVisible(): void {
    const visible = this.visibleSightings();
    const selectedId = this.selectedId();
    if (selectedId && !visible.some((item) => item.id === selectedId)) {
      this.selectedSightingId.set(null);
    }
  }
  private findSighting(id: string | null): PublicSighting | undefined {
    return this.sightings().find((sighting) => sighting.id === id || sighting.reference === id);
  }
}

function roundCoordinate(value: number): number {
  return Number(value.toFixed(6));
}
function countBy(
  sightings: readonly PublicSighting[],
  predicate: (sighting: PublicSighting) => boolean,
): number {
  return sightings.filter(predicate).length;
}

function hasActiveFilters(filters: DiscoveryFilters): boolean {
  return (
    filters.query.trim().length > 0 ||
    filters.species !== 'All' ||
    filters.condition !== 'All' ||
    filters.status !== 'All' ||
    filters.verification !== 'All'
  );
}

function toUserMessage(error: unknown): string {
  if (!(error instanceof HttpErrorResponse)) {
    return 'Public sightings could not be loaded.';
  }

  if (error.status === 0) {
    return 'The PetRadar API is unavailable. Public sightings could not be loaded.';
  }

  return 'Public sightings could not be loaded.';
}
