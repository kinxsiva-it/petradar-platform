import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, OnDestroy, inject, input, output } from '@angular/core';

import type { AnalyticsHotspotPoint } from '../../data-access/analytics-api.models.js';

interface LeafletCircle {
  addTo(map: LeafletMap): LeafletCircle;
  bindPopup(content: string): LeafletCircle;
  on(event: 'click', handler: () => void): void;
  remove(): void;
}

interface LeafletMap {
  remove(): void;
  setView(center: [number, number], zoom: number): LeafletMap;
}

interface LeafletModule {
  circle(center: [number, number], options: Record<string, number | string>): LeafletCircle;
  map(host: Element): LeafletMap;
  tileLayer(url: string, options: { attribution: string; maxZoom: number }): { addTo(map: LeafletMap): void };
}

@Component({
  selector: 'pr-heatmap-map',
  standalone: true,
  template: `<div class="heatmap-host" aria-label="Aggregated community heatmap"></div>`,
  styles: [
    `
      :host {
        display: block;
        min-height: 34rem;
      }

      .heatmap-host {
        width: 100%;
        height: 100%;
        min-height: 34rem;
        overflow: hidden;
        border-radius: var(--radius-panel);
      }

      @media (max-width: 700px) {
        :host,
        .heatmap-host {
          min-height: 28rem;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeatmapMapComponent implements AfterViewInit, OnDestroy {
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);
  private leaflet: LeafletModule | null = null;
  private map: LeafletMap | null = null;
  private layers: LeafletCircle[] = [];
  readonly points = input.required<AnalyticsHotspotPoint[]>();
  readonly selected = output<AnalyticsHotspotPoint>();

  ngAfterViewInit(): void {
    void this.initializeMap();
  }

  ngOnDestroy(): void {
    this.map?.remove();
  }

  private async initializeMap(): Promise<void> {
    const host = this.element.nativeElement.querySelector('.heatmap-host');
    if (!host) {
      return;
    }
    const leafletModule: unknown = await import('leaflet');
    if (!isLeafletModule(leafletModule)) {
      return;
    }
    this.leaflet = leafletModule;
    this.map = this.leaflet.map(host).setView([13.782, 100.565], 12);
    this.leaflet
      .tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 18,
      })
      .addTo(this.map);
    this.renderPoints();
  }

  private renderPoints(): void {
    const map = this.map;
    const leaflet = this.leaflet;

    if (!map || !leaflet) {
      return;
    }

    this.layers.forEach((layer) => {
      layer.remove();
    });

    this.layers = this.points().map((point) => {
      const color = point.weight >= 12 ? '#ef4444' : point.weight >= 6 ? '#f59e0b' : '#0f766e';

      const circle = leaflet
        .circle([point.latitude, point.longitude], {
          color,
          fillColor: color,
          fillOpacity: Math.min(0.18 + point.weight / 80, 0.68),
          radius: 260 + point.weight * 8,
          weight: 2,
        })
        .addTo(map)
        .bindPopup(`${String(point.latitude)}, ${String(point.longitude)}: ${String(point.count)} aggregated reports`);

      circle.on('click', () => {
        this.selected.emit(point);
      });

      return circle;
    });
  }
}

function isLeafletModule(value: unknown): value is LeafletModule {
  return (
    isRecord(value) &&
    typeof value['circle'] === 'function' &&
    typeof value['map'] === 'function' &&
    typeof value['tileLayer'] === 'function'
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
