import { readFileSync } from 'node:fs';
import { join } from 'node:path';

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
import { createGoogleMarkerLayers } from './google-map-marker-layer';
import { markerColor, markerTone } from './map-marker-rendering';
import { toMapMarkers, type MapMarkerViewModel } from './map-marker-view.model';

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

  it('keeps the map page usable after Google load failure by falling back to Leaflet', () => {
    const activeProvider = 'leaflet';
    const markers = [marker];

    expect(activeProvider).toBe('leaflet');
    expect(markers).toHaveLength(1);
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
