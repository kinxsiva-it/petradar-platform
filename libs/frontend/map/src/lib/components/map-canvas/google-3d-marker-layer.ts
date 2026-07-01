import type {
  GoogleMaps3DLibrary,
  GoogleMaps3DMapElement,
  GoogleMaps3DMarkerElement,
} from '../../services/google-maps.types';
import { markerShortLabel, markerTitle } from './map-marker-rendering';
import type { MapMarkerViewModel } from './map-marker-view.model';

export interface Google3DMarkerEntry {
  cleanup(): void;
  element: GoogleMaps3DMarkerElement;
  signature: string;
}

export interface Google3DMarkerLayerSet {
  entries: Map<string, Google3DMarkerEntry>;
  cleanup(): void;
  sync(markers: readonly MapMarkerViewModel[], selectedId: string | null): void;
}

export function createGoogle3DMarkerLayers(
  library: GoogleMaps3DLibrary,
  map: GoogleMaps3DMapElement,
  markers: readonly MapMarkerViewModel[],
  selectedId: string | null,
  markerSelected: (id: string) => void,
): Google3DMarkerLayerSet {
  const entries = new Map<string, Google3DMarkerEntry>();

  const sync = (nextMarkers: readonly MapMarkerViewModel[], nextSelectedId: string | null): void => {
    const activeIds = new Set(nextMarkers.map((marker) => marker.id));

    for (const [id, entry] of entries) {
      if (!activeIds.has(id)) {
        entry.cleanup();
        entries.delete(id);
      }
    }

    for (const marker of nextMarkers) {
      const signature = markerSignature(marker);
      const existing = entries.get(marker.id);
      if (existing?.signature === signature) {
        updateSelectedState(existing.element, marker.id === nextSelectedId);
        continue;
      }

      existing?.cleanup();
      const entry = createMarkerEntry(
        library,
        map,
        marker,
        marker.id === nextSelectedId,
        markerSelected,
      );
      entries.set(marker.id, entry);
    }
  };

  sync(markers, selectedId);

  return {
    cleanup: () => {
      for (const entry of entries.values()) {
        entry.cleanup();
      }
      entries.clear();
    },
    entries,
    sync,
  };
}

function createMarkerEntry(
  library: GoogleMaps3DLibrary,
  map: GoogleMaps3DMapElement,
  marker: MapMarkerViewModel,
  isSelected: boolean,
  markerSelected: (id: string) => void,
): Google3DMarkerEntry {
  const element = new library.Marker3DInteractiveElement({
    altitudeMode: 'CLAMP_TO_GROUND',
    drawsWhenOccluded: true,
    label: markerShortLabel(marker),
    position: {
      altitude: 0,
      lat: marker.latitude,
      lng: marker.longitude,
    },
    sizePreserved: true,
    title: markerTitle(marker),
    zIndex: zIndexFor(isSelected),
  });
  const handler = (): void => {
    markerSelected(marker.id);
  };

  element.setAttribute('aria-label', markerTitle(marker));
  element.setAttribute('data-petradar-marker-id', marker.id);
  element.addEventListener('gmp-click', handler);
  map.append(element);

  return {
    cleanup: () => {
      element.removeEventListener('gmp-click', handler);
      element.remove();
    },
    element,
    signature: markerSignature(marker),
  };
}

function updateSelectedState(element: GoogleMaps3DMarkerElement, isSelected: boolean): void {
  element.drawsWhenOccluded = true;
  element.zIndex = zIndexFor(isSelected);
}

function zIndexFor(isSelected: boolean): number {
  return isSelected ? 20 : 10;
}

function markerSignature(marker: MapMarkerViewModel): string {
  return [
    marker.condition,
    marker.id,
    marker.latitude,
    marker.locationLabel,
    marker.longitude,
    marker.species,
    marker.status,
    marker.title,
    marker.urgency,
  ].join('|');
}
