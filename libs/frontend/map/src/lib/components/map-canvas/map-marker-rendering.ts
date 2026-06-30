import {
  Cat,
  CircleCheck,
  createElement,
  Dog,
  HeartPulse,
  LifeBuoy,
  PawPrint,
  Star,
} from 'lucide';

import type { MapMarkerViewModel } from './map-marker-view.model.js';

export function createMarkerElement(
  markerModel: MapMarkerViewModel,
  isSelected: boolean,
): HTMLSpanElement {
  const marker = document.createElement('span');

  marker.className = [
    'pr-map-marker-modern',
    markerTone(markerModel),
    isSelected ? 'selected' : '',
  ]
    .filter(Boolean)
    .join(' ');

  marker.setAttribute('aria-hidden', 'true');

  const icon = createElement(markerIcon(markerModel), {
    'aria-hidden': 'true',
    class: 'pr-map-marker-icon',
    height: 20,
    width: 20,
    'stroke-width': 2.35,
  });

  marker.append(icon);

  return marker;
}

export function markerColor(marker: MapMarkerViewModel): string {
  if (marker.condition === 'Injured') {
    return '#ef4444';
  }

  if (marker.status === 'Needs rescue') {
    return '#f59e0b';
  }

  if (marker.status === 'Possible match') {
    return '#8b5cf6';
  }

  if (marker.status === 'Reunited') {
    return '#22c55e';
  }

  if (marker.species === 'Cat') {
    return '#2563eb';
  }

  if (marker.species === 'Dog') {
    return '#f59e0b';
  }

  return '#0f766e';
}

export function markerTitle(marker: MapMarkerViewModel): string {
  return [
    marker.title,
    marker.status,
    `Approximate location: ${marker.locationLabel}`,
  ].join('. ');
}

export function markerTone(marker: MapMarkerViewModel): string {
  if (marker.condition === 'Injured') {
    return 'injured';
  }

  if (marker.status === 'Needs rescue') {
    return 'rescue';
  }

  if (marker.status === 'Possible match') {
    return 'match';
  }

  if (marker.status === 'Reunited') {
    return 'reunited';
  }

  if (marker.species === 'Cat') {
    return 'cat';
  }

  if (marker.species === 'Dog') {
    return 'dog';
  }

  return 'other';
}

export function markerShortLabel(marker: MapMarkerViewModel): string {
  if (marker.condition === 'Injured') {
    return '!';
  }

  if (marker.status === 'Needs rescue') {
    return 'R';
  }

  if (marker.status === 'Possible match') {
    return '*';
  }

  if (marker.status === 'Reunited') {
    return 'R';
  }

  return marker.species.slice(0, 1).toUpperCase();
}

function markerIcon(marker: MapMarkerViewModel) {
  if (marker.condition === 'Injured') {
    return HeartPulse;
  }

  if (marker.status === 'Needs rescue') {
    return LifeBuoy;
  }

  if (marker.status === 'Possible match') {
    return Star;
  }

  if (marker.status === 'Reunited') {
    return CircleCheck;
  }

  if (marker.species === 'Cat') {
    return Cat;
  }

  if (marker.species === 'Dog') {
    return Dog;
  }

  return PawPrint;
}
