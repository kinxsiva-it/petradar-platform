import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { Injector, runInInjectionContext, signal } from '@angular/core';

import type {
  GoogleMaps3DLibrary,
  GoogleMaps3DMapElement,
  GoogleMaps3DMarkerElement,
  GoogleMaps3DMarkerOptions,
  GoogleMapsAdvancedMarkerElement,
  GoogleMapsAdvancedMarkerOptions,
  GoogleMapsCircle,
  GoogleMapsListener,
  GoogleMapsMap,
  GoogleMapsMarkerLibrary,
  GoogleMapsNamespace,
  GoogleMapsPinElement,
} from '../../services/google-maps.types';
import { createGoogle3DMarkerLayers } from './google-3d-marker-layer';
import {
  buildGoogle3DMapOptions,
  describeGoogle3DVisualReadiness,
  isGoogle3DVisuallyReady,
  type Google3DVisualReadinessTarget,
} from './google-3d-map-renderer.component';
import { createGoogleMarkerLayers } from './google-map-marker-layer';
import { MapCanvasComponent } from './map-canvas.component';
import { markerColor, markerTone } from './map-marker-rendering';
import { toMapMarkers, type MapMarkerViewModel } from './map-marker-view.model';
import { MapProviderStateService } from '../../services/map-provider-state.service';

const marker: MapMarkerViewModel = {
  condition: 'Injured',
  id: 'dog-1',
  latitude: 13.7648,
  locationLabel: 'Victory Monument, Bangkok',
  longitude: 100.5381,
  radiusMeters: 350,
  species: 'Dog',
  status: 'Needs rescue',
  title: 'Injured white dog',
  urgency: 'High',
};

describe('map provider rendering', () => {
  it('shares public-safe marker data across providers', () => {
    const markers = toMapMarkers([
      {
        approximateLocation: {
          area: 'Ari',
          label: 'Near Ari, Bangkok',
          latitude: 13.7819,
          longitude: 100.5451,
          radiusMeters: 300,
        },
        collarStatus: 'Unknown',
        color: 'Orange',
        condition: 'Possible lost pet',
        description: 'Public approximate sighting.',
        distanceLabel: '320 m away',
        id: 'cat-1',
        photoUrls: [],
        reference: 'CAT-1',
        reporterLabel: 'Reporter',
        seenAt: 'Today',
        species: 'Cat',
        status: 'Possible match',
        title: 'Orange cat',
        urgency: 'Medium',
        verificationStatus: 'Pending',
      },
    ]);

    expect(markers[0]).toMatchObject({
      id: 'cat-1',
      latitude: 13.7819,
      longitude: 100.5451,
      radiusMeters: 300,
      status: 'Possible match',
    });
    expect(JSON.stringify(markers[0])).not.toContain('photoUrls');
  });

  it('keeps existing Leaflet marker visual semantics functional', () => {
    expect(markerColor(marker)).toBe('#ef4444');
    expect(markerTone(marker)).toBe('injured');
  });

  it('emits provider-neutral marker selection from Google markers', () => {
    const selected = vi.fn();
    const { api, markerHandlers, markerLibrary } = fakeGoogleApi();

    createGoogleMarkerLayers(api, markerLibrary, fakeMap(), [marker], null, selected);
    markerHandlers[0]?.();

    expect(selected).toHaveBeenCalledWith('dog-1');
  });

  it('cleans up Google markers, circles, and listeners', () => {
    const {
      api,
      circleSetMap,
      markerElements,
      markerLibrary,
      removeMarkerEventListener,
    } = fakeGoogleApi();
    const layerSet = createGoogleMarkerLayers(
      api,
      markerLibrary,
      fakeMap(),
      [marker],
      'dog-1',
      vi.fn(),
    );

    layerSet.cleanup();

    expect(markerElements[0]?.map).toBeNull();
    expect(circleSetMap).toHaveBeenCalledWith(null);
    expect(removeMarkerEventListener).toHaveBeenCalledWith('gmp-click', expect.any(Function));
  });

  it('renders public-safe sightings as clickable Google 3D markers', () => {
    const selected = vi.fn();
    const { library, map, markerElements } = fakeGoogle3DLibrary();

    createGoogle3DMarkerLayers(library, map, [marker], null, selected);

    expect(markerElements).toHaveLength(1);
    expect(markerElements[0]?.position).toEqual({
      altitude: 0,
      lat: marker.latitude,
      lng: marker.longitude,
    });
    expect(markerElements[0]?.altitudeMode).toBe('CLAMP_TO_GROUND');
    expect(markerElements[0]?.label).toBe('!');
    expect(markerElements[0]?.title).toContain('Approximate location');
    markerElements[0]?.dispatchEvent(new Event('gmp-click'));
    expect(selected).toHaveBeenCalledWith('dog-1');
  });

  it('initializes Google 3D with the documented stable mode and map id fallback', () => {
    const options = buildGoogle3DMapOptions(
      [marker],
      { latitude: 13.7563, longitude: 100.5018, zoom: 13 },
      null,
    );

    expect(options.mapId).toBe('DEMO_MAP_ID');
    expect(options.mode).toBe('ROADMAP');
    expect(options.center).toEqual({
      altitude: 0,
      lat: marker.latitude,
      lng: marker.longitude,
    });
  });

  it('uses configured Google 3D map id when one is provided', () => {
    const options = buildGoogle3DMapOptions(
      [],
      { latitude: 13.7563, longitude: 100.5018, zoom: 13 },
      'local-3d-map-id',
    );

    expect(options.mapId).toBe('local-3d-map-id');
  });

  it('keeps Google 3D loading while the mounted element has no visible size', () => {
    const target = fakeVisualReadinessTarget({
      childElementCount: 1,
      height: 0,
      isConnected: true,
      width: 0,
    });

    expect(isGoogle3DVisuallyReady(target, 1)).toBe(false);
  });

  it('treats an empty sized Google 3D element as ready only when no markers are expected', () => {
    const target = fakeVisualReadinessTarget({
      childElementCount: 0,
      height: 480,
      innerHTML: '',
      isConnected: true,
      width: 640,
    });

    expect(isGoogle3DVisuallyReady(target, 0)).toBe(true);
    expect(isGoogle3DVisuallyReady(target, 1)).toBe(false);
  });

  it('trusts a Google 3D steady event when the element is connected and sized', () => {
    const target = fakeVisualReadinessTarget({
      childElementCount: 0,
      height: 480,
      innerHTML: '',
      isConnected: true,
      width: 640,
    });

    expect(describeGoogle3DVisualReadiness(target, 1, true)).toMatchObject({
      ready: true,
      reason: 'steady-event-ready',
      steadyEventSeen: true,
    });
  });

  it('treats a sized Google 3D element with rendered content as visually ready', () => {
    const target = fakeVisualReadinessTarget({
      childElementCount: 1,
      height: 480,
      isConnected: true,
      width: 640,
    });

    expect(isGoogle3DVisuallyReady(target, 1)).toBe(true);
  });

  it('updates and cleans up Google 3D markers without recreating on selection changes', () => {
    const { library, map, markerElements } = fakeGoogle3DLibrary();
    const layerSet = createGoogle3DMarkerLayers(library, map, [marker], null, vi.fn());
    const firstMarker = markerElements[0];

    layerSet.sync([marker], 'dog-1');

    expect(markerElements).toHaveLength(1);
    expect(markerElements[0]).toBe(firstMarker);
    expect(markerElements[0]?.zIndex).toBe(20);

    layerSet.sync([], null);
    expect(firstMarker?.isConnected).toBe(false);
    expect(layerSet.entries.size).toBe(0);
  });

  it('keeps marker data and selected sighting stable across provider switching', () => {
    const markers = [marker];
    const selectedId = 'dog-1';

    expect(markers.map((item) => item.id)).toEqual(['dog-1']);
    expect(selectedId).toBe(markers[0]?.id);
  });

  it('keeps the committed runtime config example free of a hardcoded key', () => {
    const config = readFileSync(
      join(process.cwd(), 'apps/web/public/runtime-config.example.js'),
      'utf8',
    );

    expect(config).toContain("googleMapsApiKey: ''");
    expect(config).toContain("googleMaps3dMapId: ''");
    expect(config).not.toContain('AIza');
  });

  it('keeps Google 3D behind an explicit experimental switcher gate', () => {
    const template = readFileSync(
      join(process.cwd(), 'libs/frontend/map/src/lib/components/map-canvas/map-canvas.component.html'),
      'utf8',
    );

    expect(template).toContain('@if (providerState.google3dExperimentalEnabled())');
    expect(template).toContain('Google 3D Experimental');
    expect(template).not.toContain('Google 3D</button>');
  });

  it('keeps the map page usable after Google load failure by falling back to Leaflet', () => {
    const activeProvider = 'leaflet';
    const markers = [marker];

    expect(activeProvider).toBe('leaflet');
    expect(markers).toHaveLength(1);
  });

  it('keeps the map page usable after Google 3D load failure by falling back to Google Maps', () => {
    const fallbackFromGoogle3d = vi.fn();
    const component = createMapCanvasComponent(
      fakeMapProviderState({
        fallbackFromGoogle3d,
      }),
    );

    component.handleRendererFailure('google3d');

    expect(component.unavailable()).toBe(false);
    expect(fallbackFromGoogle3d).toHaveBeenCalledWith(
      'Google 3D could not load. Google Maps is still available.',
    );
  });
});

function fakeMap(): GoogleMapsMap {
  return {
    addListener: vi.fn(),
    getCenter: () => undefined,
    getZoom: () => 12,
    panTo: vi.fn(),
    setCenter: vi.fn(),
  };
}

function fakeGoogle3DLibrary(): {
  library: GoogleMaps3DLibrary;
  map: GoogleMaps3DMapElement;
  markerElements: GoogleMaps3DMarkerElement[];
} {
  const map = createFake3DElement() as GoogleMaps3DMapElement;
  map.center = { altitude: 0, lat: 0, lng: 0 };
  map.heading = 0;
  map.mode = 'HYBRID';
  map.range = 0;
  map.tilt = 0;

  const markerElements: GoogleMaps3DMarkerElement[] = [];
  const Map3DElement = function (): GoogleMaps3DMapElement {
    return map;
  } as unknown as GoogleMaps3DLibrary['Map3DElement'];
  const Marker3DInteractiveElement = function (
    options: GoogleMaps3DMarkerOptions,
  ): GoogleMaps3DMarkerElement {
    const element = createFake3DElement() as GoogleMaps3DMarkerElement;
    element.altitudeMode = options.altitudeMode;
    element.drawsWhenOccluded = options.drawsWhenOccluded;
    element.label = options.label;
    element.position = options.position;
    element.sizePreserved = options.sizePreserved;
    element.title = options.title ?? '';
    element.zIndex = options.zIndex;
    markerElements.push(element);
    return element;
  } as unknown as GoogleMaps3DLibrary['Marker3DInteractiveElement'];

  return {
    library: {
      Map3DElement,
      Marker3DInteractiveElement,
    },
    map,
    markerElements,
  };
}

function fakeVisualReadinessTarget(options: {
  childElementCount: number;
  height: number;
  innerHTML?: string;
  isConnected: boolean;
  width: number;
}): Google3DVisualReadinessTarget {
  return {
    childElementCount: options.childElementCount,
    getBoundingClientRect: () => fakeDomRect(options.width, options.height),
    innerHTML: options.innerHTML ?? '<gmp-marker-3d-interactive></gmp-marker-3d-interactive>',
    isConnected: options.isConnected,
  };
}

function fakeDomRect(width: number, height: number): DOMRectReadOnly {
  return {
    bottom: height,
    height,
    left: 0,
    right: width,
    top: 0,
    width,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  };
}

interface Fake3DElement {
  addEventListener(type: string, listener: EventListenerOrEventListenerObject): void;
  append(...nodes: unknown[]): void;
  dispatchEvent(event: Event): boolean;
  isConnected: boolean;
  remove(): void;
  removeEventListener(type: string, listener: EventListenerOrEventListenerObject): void;
  setAttribute(name: string, value: string): void;
}

function createFake3DElement(): Fake3DElement {
  const listeners = new Map<string, Set<EventListenerOrEventListenerObject>>();

  return {
    addEventListener: (type, listener) => {
      const eventListeners = listeners.get(type) ?? new Set<EventListenerOrEventListenerObject>();
      eventListeners.add(listener);
      listeners.set(type, eventListeners);
    },
    append: (...nodes) => {
      for (const node of nodes) {
        if (isConnectable(node)) {
          node.isConnected = true;
        }
      }
    },
    dispatchEvent: (event) => {
      for (const listener of listeners.get(event.type) ?? []) {
        if (typeof listener === 'function') {
          listener(event);
        } else {
          listener.handleEvent(event);
        }
      }

      return true;
    },
    isConnected: false,
    remove: function remove() {
      this.isConnected = false;
    },
    removeEventListener: (type, listener) => {
      listeners.get(type)?.delete(listener);
    },
    setAttribute: () => undefined,
  };
}

function isConnectable(node: unknown): node is { isConnected: boolean } {
  return typeof node === 'object' && node !== null && 'isConnected' in node;
}

function fakeGoogleApi(): {
  api: GoogleMapsNamespace;
  circleSetMap: ReturnType<typeof vi.fn>;
  markerHandlers: (() => void)[];
  markerElements: GoogleMapsAdvancedMarkerElement[];
  markerLibrary: GoogleMapsMarkerLibrary;
  removeMarkerEventListener: ReturnType<typeof vi.fn>;
} {
  const markerHandlers: (() => void)[] = [];
  const markerElements: GoogleMapsAdvancedMarkerElement[] = [];
  const circleSetMap = vi.fn();
  const removeMarkerEventListener = vi.fn();

  class FakeAdvancedMarkerElement implements GoogleMapsAdvancedMarkerElement {
    map: GoogleMapsMap | null;
    position: GoogleMapsAdvancedMarkerOptions['position'];
    title: string;
    zIndex?: number;

    constructor(options: GoogleMapsAdvancedMarkerOptions) {
      this.map = options.map ?? null;
      this.position = options.position;
      this.title = options.title ?? '';
      this.zIndex = options.zIndex;
      markerElements.push(this);
    }

    addListener(_eventName: 'dragend', handler: () => void): GoogleMapsListener {
      markerHandlers.push(handler);
      return { remove: vi.fn() };
    }

    addEventListener(_eventName: 'gmp-click', handler: () => void): void {
      markerHandlers.push(handler);
    }

    removeEventListener = removeMarkerEventListener;

    replaceChildren(..._nodes: GoogleMapsPinElement[]): void {
      void _nodes;
      return undefined;
    }
  }

  class FakeCircle implements GoogleMapsCircle {
    setMap = circleSetMap;
  }

  const markerLibrary: GoogleMapsMarkerLibrary = {
    AdvancedMarkerElement: FakeAdvancedMarkerElement,
    PinElement: class {},
  };

  return {
    api: {
      maps: {
        Circle: FakeCircle,
        Map: vi.fn(),
        event: {
          clearInstanceListeners: vi.fn(),
        },
      },
    },
    circleSetMap,
    markerHandlers,
    markerElements,
    markerLibrary,
    removeMarkerEventListener,
  };
}

type FakeMapProviderState = Pick<
  MapProviderStateService,
  | 'activeProvider'
  | 'clearMessage'
  | 'fallbackFromGoogle3d'
  | 'fallbackToLeaflet'
  | 'googleConfigured'
  | 'message'
  | 'selectProvider'
  | 'storedPreferenceForTest'
>;

function createMapCanvasComponent(providerState: FakeMapProviderState): MapCanvasComponent {
  const injector = Injector.create({
    providers: [
      MapCanvasComponent,
      {
        provide: MapProviderStateService,
        useValue: providerState,
      },
    ],
  });

  return runInInjectionContext(injector, () => injector.get(MapCanvasComponent));
}

function fakeMapProviderState(overrides: {
  fallbackFromGoogle3d?: ReturnType<typeof vi.fn>;
} = {}): FakeMapProviderState {
  return {
    activeProvider: signal<'google3d'>('google3d').asReadonly(),
    clearMessage: vi.fn(),
    fallbackFromGoogle3d: overrides.fallbackFromGoogle3d ?? vi.fn(),
    fallbackToLeaflet: vi.fn(),
    googleConfigured: signal(true).asReadonly(),
    message: signal<string | null>(null).asReadonly(),
    selectProvider: vi.fn(() => true),
    storedPreferenceForTest: vi.fn(() => null),
  };
}
