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
  GoogleMaps3DMapMode,
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
const google3dVisualReadyCheckDelayMs = 300;
const google3dVisualReadyTimeoutMs = 8_000;
const defaultGoogle3DMapId = 'DEMO_MAP_ID';
const overviewFov = 58;
const overviewMode: GoogleMaps3DMapMode = 'ROADMAP';
const overviewTilt = 63;
const maximumDiagnosticEvents = 12;

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
  private visualReadyStartedAt: number | null = null;
  private visualReadyTimeoutId: number | null = null;
  private map: GoogleMaps3DMapElement | null = null;
  private initializedAt: number | null = null;
  private destroyed = false;
  private failureReported = false;
  private steadyEventSeen = false;
  private diagnosticEvents: Google3DDiagnosticEvent[] = [];

  private readonly mapReadyHandler = (): void => {
    this.ngZone.run(() => {
      this.steadyEventSeen = true;
      this.recordDiagnosticEvent('google-3d-steady');
      this.checkVisualReady();
    });
  };
  private readonly mapErrorHandler = (): void => {
    this.ngZone.run(() => {
      this.recordDiagnosticEvent('google-3d-error');
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
    this.writeDiagnosticSnapshot('destroyed', 'component-destroyed');
    this.clearLoadingTimeout();
    this.clearVisualReadyTimeout();
    this.cleanupMap();
  }

  private async initializeMap(): Promise<void> {
    try {
      this.initializedAt = Date.now();
      this.writeDiagnosticSnapshot('loading-library', 'load-maps3d-started');
      const library = await this.googleMaps.loadMaps3d();
      if (this.destroyed) {
        return;
      }

      this.writeDiagnosticSnapshot('creating-map', 'maps3d-loaded');
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
        this.startVisualReadyChecks();
      });

      this.writeDiagnosticSnapshot('waiting-for-visual-ready', 'map-element-created');
      this.loadingTimeoutId = window.setTimeout(() => {
        this.recordDiagnosticEvent('load-timeout');
        this.reportLoadFailure();
      }, google3dLoadTimeoutMs);
    } catch {
      if (!this.destroyed) {
        this.recordDiagnosticEvent('maps3d-load-failed');
        this.reportLoadFailure();
      }
    }
  }

  private cameraOptions(markers: readonly MapMarkerViewModel[]): GoogleMaps3DMapOptions {
    return buildGoogle3DMapOptions(
      markers,
      this.viewport(),
      this.runtimeConfig.googleMaps3dMapId(),
    );
  }

  private startVisualReadyChecks(): void {
    this.visualReadyStartedAt = Date.now();
    this.queueVisualReadyCheck();
  }

  private queueVisualReadyCheck(): void {
    this.clearVisualReadyTimeout();
    this.visualReadyTimeoutId = window.setTimeout(() => {
      this.ngZone.run(() => {
        this.checkVisualReady();
      });
    }, google3dVisualReadyCheckDelayMs);
  }

  private checkVisualReady(): void {
    if (this.destroyed || this.failureReported) {
      return;
    }

    if (this.map && isGoogle3DVisuallyReady(this.map, this.markers().length, this.steadyEventSeen)) {
      this.finishLoading();
      return;
    }

    const startedAt = this.visualReadyStartedAt ?? Date.now();
    if (Date.now() - startedAt >= google3dVisualReadyTimeoutMs) {
      this.recordDiagnosticEvent('visual-ready-timeout');
      this.reportLoadFailure();
      return;
    }

    this.writeDiagnosticSnapshot('waiting-for-visual-ready', 'visual-ready-check');
    this.queueVisualReadyCheck();
  }

  private finishLoading(): void {
    if (this.destroyed || this.failureReported) {
      return;
    }

    this.clearLoadingTimeout();
    this.clearVisualReadyTimeout();
    this.visualReadyStartedAt = null;
    this.loading.set(false);
    this.writeDiagnosticSnapshot('ready', 'visual-ready');
  }

  private reportLoadFailure(): void {
    if (this.destroyed || this.failureReported) {
      return;
    }

    this.failureReported = true;
    this.loading.set(false);
    this.clearLoadingTimeout();
    this.clearVisualReadyTimeout();
    this.visualReadyStartedAt = null;
    this.cleanupMap();
    this.writeDiagnosticSnapshot('fallback', 'load-failed');
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

  private clearVisualReadyTimeout(): void {
    if (this.visualReadyTimeoutId === null) {
      return;
    }

    window.clearTimeout(this.visualReadyTimeoutId);
    this.visualReadyTimeoutId = null;
  }

  private recordDiagnosticEvent(event: Google3DDiagnosticEventName): void {
    const elapsedMs = this.elapsedMs();
    this.diagnosticEvents = [
      ...this.diagnosticEvents.slice(-(maximumDiagnosticEvents - 1)),
      { elapsedMs, event },
    ];
  }

  private writeDiagnosticSnapshot(
    phase: Google3DDiagnosticPhase,
    event: Google3DDiagnosticEventName,
  ): void {
    this.recordDiagnosticEvent(event);

    if (typeof window === 'undefined') {
      return;
    }

    window.__PETRADAR_GOOGLE_3D_DIAGNOSTICS__ = {
      elapsedMs: this.elapsedMs(),
      events: this.diagnosticEvents,
      googleMapsVersion: window.google?.maps.version ?? null,
      loading: this.loading(),
      mapIdSource: this.runtimeConfig.googleMaps3dMapId() ? 'configured' : 'demo',
      mode: overviewMode,
      phase,
      visualState: this.map
        ? describeGoogle3DVisualReadiness(this.map, this.markers().length, this.steadyEventSeen)
        : null,
    };
  }

  private elapsedMs(): number {
    if (this.initializedAt === null) {
      return 0;
    }

    return Date.now() - this.initializedAt;
  }
}

type Google3DDiagnosticEventName =
  | 'component-destroyed'
  | 'google-3d-error'
  | 'google-3d-steady'
  | 'load-failed'
  | 'load-maps3d-started'
  | 'load-timeout'
  | 'map-element-created'
  | 'maps3d-load-failed'
  | 'maps3d-loaded'
  | 'visual-ready'
  | 'visual-ready-check'
  | 'visual-ready-timeout';

type Google3DDiagnosticPhase =
  | 'creating-map'
  | 'destroyed'
  | 'fallback'
  | 'loading-library'
  | 'ready'
  | 'waiting-for-visual-ready';

interface Google3DDiagnosticEvent {
  readonly elapsedMs: number;
  readonly event: Google3DDiagnosticEventName;
}

export interface Google3DDiagnosticSnapshot {
  readonly elapsedMs: number;
  readonly events: readonly Google3DDiagnosticEvent[];
  readonly googleMapsVersion: string | null;
  readonly loading: boolean;
  readonly mapIdSource: 'configured' | 'demo';
  readonly mode: GoogleMaps3DMapMode;
  readonly phase: Google3DDiagnosticPhase;
  readonly visualState: Google3DVisualReadinessState | null;
}

declare global {
  interface Window {
    __PETRADAR_GOOGLE_3D_DIAGNOSTICS__?: Google3DDiagnosticSnapshot;
  }
}

export interface Google3DVisualReadinessTarget {
  readonly childElementCount: number;
  getBoundingClientRect(): DOMRectReadOnly;
  readonly innerHTML: string;
  readonly isConnected: boolean;
}

export interface Google3DVisualReadinessState {
  readonly childElementCount: number;
  readonly height: number;
  readonly innerHTMLLength: number;
  readonly isConnected: boolean;
  readonly markerCount: number;
  readonly reason:
    | 'content-ready'
    | 'empty-map-ready'
    | 'not-connected'
    | 'steady-event-ready'
    | 'waiting-for-content'
    | 'zero-size';
  readonly steadyEventSeen: boolean;
  readonly width: number;
  readonly ready: boolean;
}

export function isGoogle3DVisuallyReady(
  map: Google3DVisualReadinessTarget,
  markerCount: number,
  steadyEventSeen = false,
): boolean {
  return describeGoogle3DVisualReadiness(map, markerCount, steadyEventSeen).ready;
}

export function describeGoogle3DVisualReadiness(
  map: Google3DVisualReadinessTarget,
  markerCount: number,
  steadyEventSeen = false,
): Google3DVisualReadinessState {
  const rect = map.getBoundingClientRect();
  const innerHTMLLength = map.innerHTML.trim().length;

  if (!map.isConnected) {
    return {
      childElementCount: map.childElementCount,
      height: rect.height,
      innerHTMLLength,
      isConnected: false,
      markerCount,
      ready: false,
      reason: 'not-connected',
      steadyEventSeen,
      width: rect.width,
    };
  }

  if (rect.width < 1 || rect.height < 1) {
    return {
      childElementCount: map.childElementCount,
      height: rect.height,
      innerHTMLLength,
      isConnected: true,
      markerCount,
      ready: false,
      reason: 'zero-size',
      steadyEventSeen,
      width: rect.width,
    };
  }

  if (markerCount === 0) {
    return {
      childElementCount: map.childElementCount,
      height: rect.height,
      innerHTMLLength,
      isConnected: true,
      markerCount,
      ready: true,
      reason: 'empty-map-ready',
      steadyEventSeen,
      width: rect.width,
    };
  }

  if (steadyEventSeen) {
    return {
      childElementCount: map.childElementCount,
      height: rect.height,
      innerHTMLLength,
      isConnected: true,
      markerCount,
      ready: true,
      reason: 'steady-event-ready',
      steadyEventSeen,
      width: rect.width,
    };
  }

  const hasContent = map.childElementCount > 0 || innerHTMLLength > 0;
  return {
    childElementCount: map.childElementCount,
    height: rect.height,
    innerHTMLLength,
    isConnected: true,
    markerCount,
    ready: hasContent,
    reason: hasContent ? 'content-ready' : 'waiting-for-content',
    steadyEventSeen,
    width: rect.width,
  };
}

export function buildGoogle3DMapOptions(
  markers: readonly MapMarkerViewModel[],
  viewport: MapViewport,
  configuredMapId: string | null,
): GoogleMaps3DMapOptions {
  return {
    center: cameraCenter(markers, viewport),
    fov: overviewFov,
    heading: 0,
    mapId: configuredMapId ?? defaultGoogle3DMapId,
    mode: overviewMode,
    range: cameraRange(markers, viewport),
    tilt: overviewTilt,
  };
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
