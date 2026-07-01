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

import { Google3DMapRendererComponent } from './google-3d-map-renderer.component';
import { GoogleMapRendererComponent } from './google-map-renderer.component';
import { LeafletMapRendererComponent } from './leaflet-map-renderer.component';
import { MapProviderStateService } from '../../services/map-provider-state.service';
import {
  defaultMapViewport,
  toMapMarkers,
  type MapProvider,
  type MapViewport,
} from './map-marker-view.model';

@Component({
  selector: 'pr-map-canvas',
  standalone: true,
  imports: [
    Google3DMapRendererComponent,
    GoogleMapRendererComponent,
    LeafletMapRendererComponent,
  ],
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

  dismissProviderMessage(): void {
    this.providerState.clearMessage();
  }

  handleRendererFailure(provider: MapProvider): void {
    if (provider === 'google') {
      this.providerState.fallbackToLeaflet('Google Maps could not load. OpenStreetMap is still available.');
      return;
    }

    if (provider === 'google3d') {
      this.providerState.fallbackFromGoogle3d(
        this.providerState.googleConfigured()
          ? 'Google 3D is unavailable on this device. Switched to Google Maps.'
          : 'Google 3D could not load. OpenStreetMap is still available.',
      );
      return;
    }

    this.unavailable.set(true);
  }

  updateViewport(viewport: MapViewport): void {
    this.viewport.set(viewport);
  }
}
