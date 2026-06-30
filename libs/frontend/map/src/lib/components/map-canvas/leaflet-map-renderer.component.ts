import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  effect,
  input,
  output,
  viewChild,
} from '@angular/core';

import {
  createMarkerElement,
  markerColor,
  markerTitle,
} from './map-marker-rendering.js';
import {
  defaultMapViewport,
  type MapMarkerViewModel,
  type MapViewport,
} from './map-marker-view.model.js';

interface LeafletLayer {
  addTo(map: LeafletMap): LeafletLayer;
}

interface LeafletMap {
  getCenter(): { lat: number; lng: number };
  getZoom(): number;
  invalidateSize(): LeafletMap;
  off(eventName: 'moveend' | 'zoomend', handler: () => void): LeafletMap;
  on(eventName: 'moveend' | 'zoomend', handler: () => void): LeafletMap;
  remove(): void;
  removeLayer(layer: LeafletLayer): LeafletMap;
  setView(center: [number, number], zoom: number): LeafletMap;
}

interface LeafletMarker extends LeafletLayer {
  on(eventName: 'click', handler: () => void): LeafletMarker;
}

interface LeafletApi {
  circle(center: [number, number], options: Record<string, unknown>): LeafletLayer;
  control: {
    zoom(options: Record<string, unknown>): LeafletLayer;
  };
  divIcon(options: Record<string, unknown>): LeafletLayer;
  map(element: HTMLElement, options: Record<string, unknown>): LeafletMap;
  marker(center: [number, number], options: Record<string, unknown>): LeafletMarker;
  tileLayer(url: string, options: Record<string, unknown>): LeafletLayer;
}

@Component({
  selector: 'pr-leaflet-map-renderer',
  standalone: true,
  template: '<div class="map-shell" #mapHost aria-label="OpenStreetMap public approximate animal sightings map"></div>',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LeafletMapRendererComponent implements AfterViewInit, OnDestroy {
  readonly markers = input.required<readonly MapMarkerViewModel[]>();
  readonly selectedId = input<string | null>(null);
  readonly viewport = input<MapViewport>(defaultMapViewport);
  readonly markerSelected = output<string>();
  readonly viewportChanged = output<MapViewport>();
  readonly loadFailed = output();

  private readonly host = viewChild.required<ElementRef<HTMLElement>>('mapHost');

  private leaflet: LeafletApi | undefined;
  private map: LeafletMap | undefined;
  private layers: LeafletLayer[] = [];
  private readonly emitViewport = (): void => {
    if (!this.map) {
      return;
    }

    const center = this.map.getCenter();
    this.viewportChanged.emit({
      latitude: center.lat,
      longitude: center.lng,
      zoom: this.map.getZoom(),
    });
  };

  constructor() {
    effect(() => {
      const markers = this.markers();
      const selectedId = this.selectedId();

      if (!this.map || !this.leaflet) {
        return;
      }

      this.renderMarkers(this.leaflet, markers, selectedId);
    });
  }

  ngAfterViewInit(): void {
    void this.initializeMap();
  }

  private async initializeMap(): Promise<void> {
    try {
      const leaflet = (await import('leaflet')) as unknown as LeafletApi;
      const viewport = this.viewport();

      const map = leaflet
        .map(this.host().nativeElement, {
          zoomControl: false,
        })
        .setView([viewport.latitude, viewport.longitude], viewport.zoom);

      leaflet
        .tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors',
          maxZoom: 18,
        })
        .addTo(map);

      leaflet
        .control.zoom({
          position: 'bottomright',
        })
        .addTo(map);

      map.on('moveend', this.emitViewport);
      map.on('zoomend', this.emitViewport);

      this.leaflet = leaflet;
      this.map = map;
      this.renderMarkers(leaflet, this.markers(), this.selectedId());

      window.setTimeout(() => map.invalidateSize(), 80);
    } catch {
      this.loadFailed.emit();
    }
  }

  ngOnDestroy(): void {
    this.map?.off('moveend', this.emitViewport);
    this.map?.off('zoomend', this.emitViewport);
    this.map?.remove();
    this.layers = [];
  }

  private renderMarkers(
    leaflet: LeafletApi,
    markers: readonly MapMarkerViewModel[],
    selectedId: string | null,
  ): void {
    if (!this.map) {
      return;
    }

    for (const layer of this.layers) {
      this.map.removeLayer(layer);
    }

    this.layers = [];

    for (const marker of markers) {
      const center: [number, number] = [marker.latitude, marker.longitude];
      const isSelected = selectedId === marker.id;
      const color = markerColor(marker);

      const circleLayer = leaflet
        .circle(center, {
          color,
          fillColor: color,
          fillOpacity: isSelected ? 0.2 : 0.1,
          radius: marker.radiusMeters,
          weight: isSelected ? 2 : 1,
        })
        .addTo(this.map);

      const markerLayer = leaflet
        .marker(center, {
          icon: leaflet.divIcon({
            className: 'pr-map-marker-host',
            html: createMarkerElement(marker, isSelected),
            iconAnchor: [22, 48],
            iconSize: [44, 48],
          }),
          title: markerTitle(marker),
        })
        .on('click', () => {
          this.markerSelected.emit(marker.id);
        })
        .addTo(this.map);

      this.layers.push(circleLayer, markerLayer);
    }
  }
}
