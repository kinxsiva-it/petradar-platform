import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';

import { RuntimeConfigService } from '@petradar/frontend/core';

import { GoogleMapsLoaderService } from '../../services/google-maps-loader.service.js';
import type {
  GoogleMapsListener,
  GoogleMapsMap,
  GoogleMapsMarkerLibrary,
  GoogleMapsNamespace,
} from '../../services/google-maps.types.js';
import { createGoogleMarkerLayers, type GoogleMarkerLayerSet } from './google-map-marker-layer.js';
import {
  defaultMapViewport,
  type MapMarkerViewModel,
  type MapViewport,
} from './map-marker-view.model.js';

const defaultGoogleVectorMapId = 'DEMO_MAP_ID';

@Component({
  selector: 'pr-google-map-renderer',
  standalone: true,
  template: `
    @if (loading()) {
      <section class="map-provider-loading" aria-live="polite">Loading Google Maps...</section>
    }
    <div class="map-shell" #mapHost aria-label="Google Maps public approximate animal sightings map"></div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GoogleMapRendererComponent implements AfterViewInit, OnDestroy {
  readonly markers = input.required<readonly MapMarkerViewModel[]>();
  readonly selectedId = input<string | null>(null);
  readonly viewport = input<MapViewport>(defaultMapViewport);
  readonly markerSelected = output<string>();
  readonly viewportChanged = output<MapViewport>();
  readonly loadFailed = output();
  readonly loading = signal(true);

  private readonly googleMaps = inject(GoogleMapsLoaderService);
  private readonly runtimeConfig = inject(RuntimeConfigService);
  private readonly host = viewChild.required<ElementRef<HTMLElement>>('mapHost');

  private api: GoogleMapsNamespace | undefined;
  private map: GoogleMapsMap | undefined;
  private markerLibrary: GoogleMapsMarkerLibrary | undefined;
  private markerLayerSet: GoogleMarkerLayerSet | null = null;
  private listeners: GoogleMapsListener[] = [];

  constructor() {
    effect(() => {
      const markers = this.markers();
      const selectedId = this.selectedId();

      if (!this.map || !this.api || !this.markerLibrary) {
        return;
      }

      this.renderMarkers(this.api, this.markerLibrary, this.map, markers, selectedId);
    });
  }

  ngAfterViewInit(): void {
    void this.initializeMap();
  }

  private async initializeMap(): Promise<void> {
    try {
      const [api, markerLibrary] = await Promise.all([
        this.googleMaps.load(),
        this.googleMaps.loadMarkerLibrary(),
      ]);
      const viewport = this.viewport();
      const map = new api.maps.Map(this.host().nativeElement, {
        center: {
          lat: viewport.latitude,
          lng: viewport.longitude,
        },
        clickableIcons: false,
        fullscreenControl: false,
        mapId: this.runtimeConfig.googleMaps3dMapId() ?? defaultGoogleVectorMapId,
        mapTypeControl: false,
        streetViewControl: false,
        zoom: viewport.zoom,
        zoomControl: true,
      });

      this.listeners.push(
        map.addListener('idle', () => {
          const center = map.getCenter();
          if (!center) {
            return;
          }

          this.viewportChanged.emit({
            latitude: center.lat(),
            longitude: center.lng(),
            zoom: map.getZoom() ?? viewport.zoom,
          });
        }),
      );

      this.api = api;
      this.map = map;
      this.markerLibrary = markerLibrary;
      this.loading.set(false);
      this.renderMarkers(api, markerLibrary, map, this.markers(), this.selectedId());
    } catch {
      this.loading.set(false);
      this.loadFailed.emit();
    }
  }

  ngOnDestroy(): void {
    this.clearLayers();
    for (const listener of this.listeners) {
      listener.remove();
    }
    this.listeners = [];
    if (this.api && this.map) {
      this.api.maps.event.clearInstanceListeners(this.map);
    }
    this.map = undefined;
    this.markerLibrary = undefined;
  }

  private renderMarkers(
    api: GoogleMapsNamespace,
    markerLibrary: GoogleMapsMarkerLibrary,
    map: GoogleMapsMap,
    markers: readonly MapMarkerViewModel[],
    selectedId: string | null,
  ): void {
    this.clearLayers();
    this.markerLayerSet = createGoogleMarkerLayers(
      api,
      markerLibrary,
      map,
      markers,
      selectedId,
      (id) => {
        this.markerSelected.emit(id);
      },
    );
  }

  private clearLayers(): void {
    this.markerLayerSet?.cleanup();
    this.markerLayerSet = null;
  }
}
