import type {
  GoogleMapsCircle,
  GoogleMapsListener,
  GoogleMapsMap,
  GoogleMapsMarker,
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
  markers: GoogleMapsMarker[];
  cleanup(): void;
}

export function createGoogleMarkerLayers(
  api: GoogleMapsNamespace,
  map: GoogleMapsMap,
  markers: readonly MapMarkerViewModel[],
  selectedId: string | null,
  markerSelected: (id: string) => void,
): GoogleMarkerLayerSet {
  const circles: GoogleMapsCircle[] = [];
  const mapMarkers: GoogleMapsMarker[] = [];
  const listeners: GoogleMapsListener[] = [];

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

    const mapMarker = new api.maps.Marker({
      icon: {
        fillColor: color,
        fillOpacity: 1,
        path: api.maps.SymbolPath.CIRCLE,
        scale: isSelected ? 12 : 10,
        strokeColor: '#ffffff',
        strokeWeight: isSelected ? 4 : 3,
      },
      label: {
        color: '#ffffff',
        fontSize: '12px',
        fontWeight: '800',
        text: markerShortLabel(marker),
      },
      map,
      position,
      title: markerTitle(marker),
    });

    listeners.push(
      mapMarker.addListener('click', () => {
        markerSelected(marker.id);
      }),
    );
    mapMarkers.push(mapMarker);
  }

  return {
    circles,
    cleanup: () => {
      for (const marker of mapMarkers) {
        marker.setMap(null);
      }
      for (const circle of circles) {
        circle.setMap(null);
      }
      for (const listener of listeners) {
        listener.remove();
      }
    },
    listeners,
    markers: mapMarkers,
  };
}

