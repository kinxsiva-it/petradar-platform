import type { PublicSighting } from '@petradar/frontend/mock-data';

export type MapProvider = 'leaflet' | 'google';

export interface MapViewport {
  latitude: number;
  longitude: number;
  zoom: number;
}

export interface MapMarkerViewModel {
  id: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  species: PublicSighting['species'];
  status: PublicSighting['status'];
  urgency: PublicSighting['urgency'];
  condition: PublicSighting['condition'];
  title: string;
  locationLabel: string;
}

export const defaultMapViewport: MapViewport = {
  latitude: 13.782,
  longitude: 100.545,
  zoom: 12,
};

export function toMapMarkers(sightings: readonly PublicSighting[]): MapMarkerViewModel[] {
  return sightings.map((sighting) => ({
    condition: sighting.condition,
    id: sighting.id,
    latitude: sighting.approximateLocation.latitude,
    locationLabel: sighting.approximateLocation.label,
    longitude: sighting.approximateLocation.longitude,
    radiusMeters: sighting.approximateLocation.radiusMeters,
    species: sighting.species,
    status: sighting.status,
    title: sighting.title,
    urgency: sighting.urgency,
  }));
}

