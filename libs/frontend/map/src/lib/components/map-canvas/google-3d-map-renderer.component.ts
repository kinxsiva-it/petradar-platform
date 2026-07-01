import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  NgZone,
  OnDestroy,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';

import { RuntimeConfigService } from '@petradar/frontend/core';

import { GoogleMapsLoaderService } from '../../services/google-maps-loader.service';
import type {
  GoogleMaps3DMapElement,
  GoogleMaps3DMapOptions,
} from '../../services/google-maps.types';
import {
  createGoogle3DMarkerLayers,
  type Google3DMarkerLayerSet,
} from './google-3d-marker-layer';
import {
  defaultMapViewport,
  type MapMarkerViewModel,
  type MapViewport,
} from './map-marker-view.model';

const google3dLoadTimeoutMs = 20_000;
const overviewFov = 58;
const overviewTilt = 63;

@Component({
  selector: 'pr-google-3d-map-renderer',
  standalone: true,
  template: `
    @if (loading()) {
      <section class="map-provider-loading" aria-live="polite">Loading Google 3D...</section>
    }
    <div
      class="map-shell google-3d-shell"
      #mapHost
      aria-label="Google 3D public approximate animal sightings map"
    ></div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Google3DMapRendererComponent implements AfterViewInit, OnDestroy {
  readonly markers = input.required<readonly MapMarkerViewModel[]>();
  readonly selectedId = input<string | null>(null);
  readonly viewport = input<MapViewport>(defaultMapViewport);
  readonly markerSelected = output<string>();
  readonly loadFailed = output();
  readonly loading = signal(true);

  private readonly googleMaps = inject(GoogleMapsLoaderService);
  private readonly host = viewChild.required<ElementRef<HTMLElement>>('mapHost');
  private readonly ngZone = inject(NgZone);
  private readonly runtimeConfig = inject(RuntimeConfigService);

  private layerSet: Google3DMarkerLayerSet | null = null;
  private loadingTimeoutId: number | null = null;
  private map: GoogleMaps3DMapElement | null = null;
  private destroyed = false;
  private failureReported = false;

  private readonly mapReadyHandler = (): void => {
    this.ngZone.run(() => {
      this.clearLoadingTimeout();
      this.loading.set(false);
    });
  };
  private readonly mapErrorHandler = (): void => {
    this.ngZone.run(() => {
      this.reportLoadFailure();
    });
  };

  constructor() {
    effect(() => {
      const markers = this.markers();
      const selectedId = this.selectedId();

      if (!this.layerSet) {
        return;
      }

      this.layerSet.sync(markers, selectedId);
    });
  }

  ngAfterViewInit(): void {
    void this.initializeMap();
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.clearLoadingTimeout();
    this.cleanupMap();
  }

  private async initializeMap(): Promise<void> {
    try {
      const library = await this.googleMaps.loadMaps3d();
      if (this.destroyed) {
        return;
      }

      this.ngZone.runOutsideAngular(() => {
        const options = this.cameraOptions(this.markers());
        const map = new library.Map3DElement(options);
        map.style.display = 'block';
        map.style.height = '100%';
        map.style.minHeight = '100%';
        map.style.width = '100%';
        map.setAttribute('aria-label', 'Google 3D approximate animal sightings map');
        map.addEventListener('gmp-steadychange', this.mapReadyHandler);
        map.addEventListener('gmp-steadystate', this.mapReadyHandler);
        map.addEventListener('gmp-error', this.mapErrorHandler);
        map.addEventListener('gmp-map-id-error', this.mapErrorHandler);

        this.host().nativeElement.replaceChildren(map);
        this.map = map;
        this.layerSet = createGoogle3DMarkerLayers(
          library,
          map,
          this.markers(),
          this.selectedId(),
          (id) => {
            this.ngZone.run(() => {
              this.markerSelected.emit(id);
            });
          },
        );
      });

      this.loadingTimeoutId = window.setTimeout(() => {
        this.reportLoadFailure();
      }, google3dLoadTimeoutMs);
    } catch {
      if (!this.destroyed) {
        this.reportLoadFailure();
      }
    }
  }

  private cameraOptions(markers: readonly MapMarkerViewModel[]): GoogleMaps3DMapOptions {
    const mapId = this.runtimeConfig.googleMaps3dMapId();
    const options: GoogleMaps3DMapOptions = {
      center: cameraCenter(markers, this.viewport()),
      fov: overviewFov,
      heading: 0,
      mode: 'HYBRID',
      range: cameraRange(markers, this.viewport()),
      tilt: overviewTilt,
    };

    if (mapId) {
      options.mapId = mapId;
    }

    return options;
  }

  private reportLoadFailure(): void {
    if (this.destroyed || this.failureReported) {
      return;
    }

    this.failureReported = true;
    this.loading.set(false);
    this.clearLoadingTimeout();
    this.cleanupMap();
    this.loadFailed.emit();
  }

  private cleanupMap(): void {
    this.layerSet?.cleanup();
    this.layerSet = null;

    if (!this.map) {
      return;
    }

    this.map.removeEventListener('gmp-steadychange', this.mapReadyHandler);
    this.map.removeEventListener('gmp-steadystate', this.mapReadyHandler);
    this.map.removeEventListener('gmp-error', this.mapErrorHandler);
    this.map.removeEventListener('gmp-map-id-error', this.mapErrorHandler);
    this.map.remove();
    this.map = null;
  }

  private clearLoadingTimeout(): void {
    if (this.loadingTimeoutId === null) {
      return;
    }

    window.clearTimeout(this.loadingTimeoutId);
    this.loadingTimeoutId = null;
  }
}

function cameraCenter(
  markers: readonly MapMarkerViewModel[],
  viewport: MapViewport,
): GoogleMaps3DMapOptions['center'] {
  if (markers.length === 0) {
    return {
      altitude: 0,
      lat: viewport.latitude,
      lng: viewport.longitude,
    };
  }

  const total = markers.reduce(
    (sum, marker) => ({
      latitude: sum.latitude + marker.latitude,
      longitude: sum.longitude + marker.longitude,
    }),
    { latitude: 0, longitude: 0 },
  );

  return {
    altitude: 0,
    lat: total.latitude / markers.length,
    lng: total.longitude / markers.length,
  };
}

function cameraRange(markers: readonly MapMarkerViewModel[], viewport: MapViewport): number {
  if (markers.length < 2) {
    return rangeFromZoom(viewport.zoom);
  }

  const latitudes = markers.map((marker) => marker.latitude);
  const longitudes = markers.map((marker) => marker.longitude);
  const latitudeSpanMeters = (Math.max(...latitudes) - Math.min(...latitudes)) * 111_000;
  const longitudeSpanMeters =
    (Math.max(...longitudes) - Math.min(...longitudes)) *
    111_000 *
    Math.cos((cameraCenter(markers, viewport).lat * Math.PI) / 180);
  const spanMeters = Math.max(Math.abs(latitudeSpanMeters), Math.abs(longitudeSpanMeters));

  if (spanMeters < 500) {
    return 900;
  }

  if (spanMeters < 1_500) {
    return 1_300;
  }

  return clamp(spanMeters * 0.8, 1_500, 2_500);
}

function rangeFromZoom(zoom: number): number {
  return clamp(7_500 / 2 ** Math.max(zoom - 10, 0), 750, 1_200);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
