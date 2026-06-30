import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';

import type { PublicSighting } from '@petradar/frontend/mock-data';

import { GoogleMapRendererComponent } from './google-map-renderer.component.js';
import { LeafletMapRendererComponent } from './leaflet-map-renderer.component.js';
import { MapProviderStateService } from '../../services/map-provider-state.service.js';
import {
  defaultMapViewport,
  toMapMarkers,
  type MapProvider,
  type MapViewport,
} from './map-marker-view.model.js';

@Component({
  selector: 'pr-map-canvas',
  standalone: true,
  imports: [GoogleMapRendererComponent, LeafletMapRendererComponent],
  templateUrl: './map-canvas.component.html',
  styleUrl: './map-canvas.component.css',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MapCanvasComponent {
  readonly providerState = inject(MapProviderStateService);
  readonly sightings = input.required<readonly PublicSighting[]>();
  readonly selectedId = input<string | null>(null);
  readonly markerSelected = output<string>();
  readonly unavailable = signal(false);
  readonly viewport = signal<MapViewport>(defaultMapViewport);
  readonly markers = computed(() => toMapMarkers(this.sightings()));

  selectProvider(provider: MapProvider): void {
    this.unavailable.set(false);
    this.providerState.selectProvider(provider);
  }

  handleRendererFailure(provider: MapProvider): void {
    if (provider === 'google') {
      this.providerState.fallbackToLeaflet('Google Maps could not load. OpenStreetMap is still available.');
      return;
    }

    this.unavailable.set(true);
  }

  updateViewport(viewport: MapViewport): void {
    this.viewport.set(viewport);
  }
}
