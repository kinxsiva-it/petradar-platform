import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, OnDestroy, inject, input, output } from '@angular/core';

import type { HeatmapPointAggregate } from '@petradar/frontend/mock-data';

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
  private readonly element = inject(ElementRef<HTMLElement>);
  private leaflet: any;
  private map: any;
  private layers: any[] = [];
  readonly points = input.required<HeatmapPointAggregate[]>();
  readonly selected = output<HeatmapPointAggregate>();

  async ngAfterViewInit(): Promise<void> {
    this.leaflet = await import('leaflet');
    const host = this.element.nativeElement.querySelector('.heatmap-host');
    this.map = this.leaflet.map(host).setView([13.782, 100.565], 12);
    this.leaflet
      .tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 18,
      })
      .addTo(this.map);
    this.renderPoints();
  }

  ngOnDestroy(): void {
    this.map?.remove();
  }

  private renderPoints(): void {
    if (!this.map || !this.leaflet) {
      return;
    }
    this.layers.forEach((layer) => layer.remove());
    this.layers = this.points().map((point) => {
      const color = point.severity === 'VERY_HIGH' ? '#ef4444' : point.severity === 'HIGH' ? '#f59e0b' : '#0f766e';
      const circle = this.leaflet
        .circle([point.lat, point.lng], {
          color,
          fillColor: color,
          fillOpacity: Math.min(0.18 + point.densityScore / 180, 0.68),
          radius: 260 + point.densityScore * 8,
          weight: 2,
        })
        .addTo(this.map)
        .bindPopup(`${point.area}: ${point.reportCount} aggregated reports`);
      circle.on('click', () => this.selected.emit(point));
      return circle;
    });
  }
}
