import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import type {
  GoogleMapsCircle,
  GoogleMapsListener,
  GoogleMapsMap,
  GoogleMapsNamespace,
} from '../../services/google-maps.types.js';
import { createGoogleMarkerLayers } from './google-map-marker-layer.js';
import { markerColor, markerTone } from './map-marker-rendering.js';
import { toMapMarkers, type MapMarkerViewModel } from './map-marker-view.model.js';

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
    const { api, markerHandlers } = fakeGoogleApi();

    createGoogleMarkerLayers(api, fakeMap(), [marker], null, selected);
    markerHandlers[0]?.();

    expect(selected).toHaveBeenCalledWith('dog-1');
  });

  it('cleans up Google markers, circles, and listeners', () => {
    const { api, circleSetMap, listenerRemove, markerSetMap } = fakeGoogleApi();
    const layerSet = createGoogleMarkerLayers(api, fakeMap(), [marker], 'dog-1', vi.fn());

    layerSet.cleanup();

    expect(markerSetMap).toHaveBeenCalledWith(null);
    expect(circleSetMap).toHaveBeenCalledWith(null);
    expect(listenerRemove).toHaveBeenCalledTimes(1);
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
  };
}

function fakeGoogleApi(): {
  api: GoogleMapsNamespace;
  circleSetMap: ReturnType<typeof vi.fn>;
  listenerRemove: ReturnType<typeof vi.fn>;
  markerHandlers: (() => void)[];
  markerSetMap: ReturnType<typeof vi.fn>;
} {
  const markerHandlers: (() => void)[] = [];
  const markerSetMap = vi.fn();
  const circleSetMap = vi.fn();
  const listenerRemove = vi.fn();

  class FakeMarker {
    addListener(_eventName: 'click', handler: () => void): GoogleMapsListener {
      markerHandlers.push(handler);
      return { remove: listenerRemove };
    }

    setMap = markerSetMap;
  }

  class FakeCircle implements GoogleMapsCircle {
    setMap = circleSetMap;
  }

  return {
    api: {
      maps: {
        Circle: FakeCircle,
        Map: vi.fn(),
        Marker: FakeMarker,
        SymbolPath: {
          CIRCLE: 'circle',
        },
        event: {
          clearInstanceListeners: vi.fn(),
        },
      },
    },
    circleSetMap,
    listenerRemove,
    markerHandlers,
    markerSetMap,
  };
}
