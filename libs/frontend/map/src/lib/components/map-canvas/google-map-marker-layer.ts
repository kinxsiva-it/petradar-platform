import type {
  GoogleMapsAdvancedMarkerElement,
  GoogleMapsCircle,
  GoogleMapsListener,
  GoogleMapsMap,
  GoogleMapsMarkerLibrary,
  GoogleMapsNamespace,
} from '../../services/google-maps.types.js';
import {
  markerColor,
  markerShortLabel,
  markerTitle,
} from './map-marker-rendering.js';
import type { MapMarkerViewModel } from './map-marker-view.model.js';

export interface GoogleMarkerLayerSet {
  circles: GoogleMapsCircle[];
  listeners: GoogleMapsListener[];
  markers: GoogleMapsAdvancedMarkerElement[];
  cleanup(): void;
}

export function createGoogleMarkerLayers(
  api: GoogleMapsNamespace,
  markerLibrary: GoogleMapsMarkerLibrary,
  map: GoogleMapsMap,
  markers: readonly MapMarkerViewModel[],
  selectedId: string | null,
  markerSelected: (id: string) => void,
): GoogleMarkerLayerSet {
  const circles: GoogleMapsCircle[] = [];
  const mapMarkers: GoogleMapsAdvancedMarkerElement[] = [];
  const listeners: GoogleMapsListener[] = [];
  const cleanupHandlers: (() => void)[] = [];

  for (const marker of markers) {
    const color = markerColor(marker);
    const isSelected = selectedId === marker.id;
    const position = {
      lat: marker.latitude,
      lng: marker.longitude,
    };

    circles.push(
      new api.maps.Circle({
        center: position,
        fillColor: color,
        fillOpacity: isSelected ? 0.2 : 0.1,
        map,
        radius: marker.radiusMeters,
        strokeColor: color,
        strokeOpacity: 0.85,
        strokeWeight: isSelected ? 2 : 1,
      }),
    );

    const pin = new markerLibrary.PinElement({
      background: color,
      borderColor: '#ffffff',
      glyphColor: '#ffffff',
      glyphText: markerShortLabel(marker),
      scale: isSelected ? 1.16 : 1,
    });
    const mapMarker = new markerLibrary.AdvancedMarkerElement({
      gmpClickable: true,
      map,
      position,
      title: markerTitle(marker),
      zIndex: isSelected ? 20 : 10,
    });
    mapMarker.replaceChildren(pin);

    const markerClickHandler = () => {
      markerSelected(marker.id);
    };
    mapMarker.addEventListener('gmp-click', markerClickHandler);
    cleanupHandlers.push(() => {
      mapMarker.removeEventListener('gmp-click', markerClickHandler);
    });
    mapMarkers.push(mapMarker);
  }

  return {
    circles,
    cleanup: () => {
      for (const marker of mapMarkers) {
        marker.map = null;
      }
      for (const circle of circles) {
        circle.setMap(null);
      }
      for (const cleanupHandler of cleanupHandlers) {
        cleanupHandler();
      }
      for (const listener of listeners) {
        listener.remove();
      }
    },
    listeners,
    markers: mapMarkers,
  };
}

