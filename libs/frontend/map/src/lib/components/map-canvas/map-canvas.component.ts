import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  ViewEncapsulation,
  effect,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';

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

import type { PublicSighting } from '@petradar/frontend/mock-data';

@Component({
  selector: 'pr-map-canvas',
  standalone: true,
  templateUrl: './map-canvas.component.html',
  styleUrl: './map-canvas.component.css',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MapCanvasComponent implements AfterViewInit, OnDestroy {
  readonly sightings = input.required<readonly PublicSighting[]>();
  readonly selectedId = input<string | null>(null);
  readonly markerSelected = output<string>();
  readonly unavailable = signal(false);

  private readonly host =
    viewChild.required<ElementRef<HTMLElement>>('mapHost');

  private leaflet: typeof import('leaflet') | undefined;
  private map: import('leaflet').Map | undefined;
  private layers: import('leaflet').Layer[] = [];

  constructor() {
    effect(() => {
      const sightings = this.sightings();
      const selectedId = this.selectedId();

      if (this.map && this.leaflet) {
        this.renderMarkers(
          this.leaflet,
          sightings,
          selectedId,
        );
      }
    });
  }

  async ngAfterViewInit(): Promise<void> {
    try {
      const leaflet = await import('leaflet');

      const map = leaflet
        .map(this.host().nativeElement, {
          zoomControl: false,
        })
        .setView([13.782, 100.545], 12);

      leaflet
        .tileLayer(
          'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
          {
            attribution: '&copy; OpenStreetMap contributors',
            maxZoom: 18,
          },
        )
        .addTo(map);

      leaflet.control
        .zoom({
          position: 'bottomright',
        })
        .addTo(map);

      this.leaflet = leaflet;
      this.map = map;

      this.renderMarkers(
        leaflet,
        this.sightings(),
        this.selectedId(),
      );

      window.setTimeout(
        () => map.invalidateSize(),
        80,
      );
    } catch {
      this.unavailable.set(true);
    }
  }

  ngOnDestroy(): void {
    this.map?.remove();
    this.layers = [];
  }

  private renderMarkers(
    leaflet: typeof import('leaflet'),
    sightings: readonly PublicSighting[],
    selectedId: string | null,
  ): void {
    if (!this.map) {
      return;
    }

    for (const layer of this.layers) {
      this.map.removeLayer(layer);
    }

    this.layers = [];

    for (const sighting of sightings) {
      const center: [number, number] = [
        sighting.approximateLocation.latitude,
        sighting.approximateLocation.longitude,
      ];

      const tone = markerTone(sighting);
      const isSelected = selectedId === sighting.id;
      const color = markerColor(sighting);

      const circleLayer = leaflet
        .circle(center, {
          color,
          fillColor: color,
          fillOpacity: isSelected ? 0.2 : 0.1,
          radius: sighting.approximateLocation.radiusMeters,
          weight: isSelected ? 2 : 1,
        })
        .addTo(this.map);

      const markerElement = createMarkerElement(
        sighting,
        tone,
        isSelected,
      );

      const markerLayer = leaflet
        .marker(center, {
          icon: leaflet.divIcon({
            className: 'pr-map-marker-host',
            html: markerElement,
            iconAnchor: [22, 48],
            iconSize: [44, 48],
          }),
          title: [
            sighting.title,
            sighting.status,
            `Approximate location: ${sighting.approximateLocation.label}`,
          ].join('. '),
        })
        .on('click', () => {
          this.markerSelected.emit(sighting.id);
        })
        .addTo(this.map);

      this.layers.push(
        circleLayer,
        markerLayer,
      );
    }
  }
}

function createMarkerElement(
  sighting: PublicSighting,
  tone: string,
  isSelected: boolean,
): HTMLSpanElement {
  const marker = document.createElement('span');

  marker.className = [
    'pr-map-marker-modern',
    tone,
    isSelected ? 'selected' : '',
  ]
    .filter(Boolean)
    .join(' ');

  marker.setAttribute('aria-hidden', 'true');

  const icon = createElement(markerIcon(sighting), {
    class: 'pr-map-marker-icon',
    width: 20,
    height: 20,
    'stroke-width': 2.35,
    'aria-hidden': 'true',
  });

  marker.append(icon);

  return marker;
}

function markerIcon(sighting: PublicSighting) {
  if (sighting.condition === 'Injured') {
    return HeartPulse;
  }

  if (sighting.status === 'Needs rescue') {
    return LifeBuoy;
  }

  if (sighting.status === 'Possible match') {
    return Star;
  }

  if (sighting.status === 'Reunited') {
    return CircleCheck;
  }

  if (sighting.species === 'Cat') {
    return Cat;
  }

  if (sighting.species === 'Dog') {
    return Dog;
  }

  return PawPrint;
}

function markerColor(sighting: PublicSighting): string {
  if (sighting.condition === 'Injured') {
    return '#ef4444';
  }

  if (sighting.status === 'Needs rescue') {
    return '#f59e0b';
  }

  if (sighting.status === 'Possible match') {
    return '#8b5cf6';
  }

  if (sighting.status === 'Reunited') {
    return '#22c55e';
  }

  if (sighting.species === 'Cat') {
    return '#2563eb';
  }

  if (sighting.species === 'Dog') {
    return '#f59e0b';
  }

  return '#0f766e';
}

function markerTone(sighting: PublicSighting): string {
  if (sighting.condition === 'Injured') {
    return 'injured';
  }

  if (sighting.status === 'Needs rescue') {
    return 'rescue';
  }

  if (sighting.status === 'Possible match') {
    return 'match';
  }

  if (sighting.status === 'Reunited') {
    return 'reunited';
  }

  if (sighting.species === 'Cat') {
    return 'cat';
  }

  if (sighting.species === 'Dog') {
    return 'dog';
  }

  return 'other';
}
