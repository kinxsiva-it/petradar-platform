export interface MapPoint {
  id: string;
  interactive?: boolean;
  latitude: number;
  longitude: number;
  radiusMeters?: number;
  radar?: boolean;
  selected?: boolean;
  title: string;
  tone?: MapPointTone;
}

export interface PickedLocation {
  latitude: number;
  longitude: number;
}

export type MapProvider = 'google' | 'leaflet';

export type MapPointTone = 'blue' | 'coral' | 'orange' | 'purple' | 'teal' | 'veterinary';

export function mapMarkerAsset(tone: MapPointTone | undefined): string {
  if (tone === 'blue') return '/images/map/markers/user-near-me.png';
  if (tone === 'coral') return '/images/map/markers/rescue-urgent-report.png';
  if (tone === 'orange') return '/images/map/markers/dog-public-area.png';
  if (tone === 'purple') return '/images/map/markers/cat-public-area.png';
  if (tone === 'veterinary') return '/images/map/markers/veterinary-care.svg';
  return '/images/map/markers/other-animal-public-area.png';
}
