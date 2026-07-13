export interface MapPoint {
  id: string;
  latitude: number;
  longitude: number;
  radiusMeters?: number;
  title: string;
}

export interface PickedLocation {
  latitude: number;
  longitude: number;
}

export type MapProvider = 'google' | 'leaflet';
