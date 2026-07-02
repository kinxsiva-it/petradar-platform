import {
  Injectable,
  computed,
  inject,
  signal,
  type Signal,
} from '@angular/core';

import { RuntimeConfigService } from '@petradar/frontend/core';

import type { MapProvider } from '../components/map-canvas/map-marker-view.model.js';

const storageKey = 'petradar.mapProvider';

@Injectable({
  providedIn: 'root',
})
export class MapProviderStateService {
  private readonly runtimeConfig: RuntimeConfigService =
    inject(RuntimeConfigService);

  private readonly provider = signal<MapProvider>(
    this.initialProvider(),
  );

  private readonly messageState =
    signal<string | null>(null);

  readonly activeProvider: Signal<MapProvider> =
    this.provider.asReadonly();

  readonly message: Signal<string | null> =
    this.messageState.asReadonly();

  readonly googleConfigured = computed<boolean>(() =>
    Boolean(this.runtimeConfig.googleMapsApiKey()),
  );

  selectProvider(provider: MapProvider): boolean {
    if (
      isGoogleProvider(provider) &&
      !this.googleConfigured()
    ) {
      this.messageState.set(
        'Add a local Google Maps browser key to enable Google Maps and Google 3D.',
      );

      this.provider.set('leaflet');
      this.storeProvider('leaflet');

      return false;
    }

    this.provider.set(provider);
    this.messageState.set(null);
    this.storeProvider(provider);

    return true;
  }

  fallbackToLeaflet(message: string): void {
    this.provider.set('leaflet');
    this.messageState.set(message);
    this.storeProvider('leaflet');
  }

  fallbackFromGoogle3d(message: string): void {
    const provider: MapProvider =
      this.googleConfigured()
        ? 'google'
        : 'leaflet';

    this.provider.set(provider);
    this.messageState.set(message);
    this.storeProvider(provider);
  }

  clearMessage(): void {
    this.messageState.set(null);
  }

  storedPreferenceForTest(): string | null {
    return this.storage()?.getItem(storageKey) ?? null;
  }

  private initialProvider(): MapProvider {
    const stored =
      this.storage()?.getItem(storageKey);

    if (
      !isMapProvider(stored)
    ) {
      return 'leaflet';
    }

    if (
      isGoogleProvider(stored) &&
      !this.runtimeConfig.googleMapsApiKey()
    ) {
      return 'leaflet';
    }

    return stored;
  }

  private storeProvider(
    provider: MapProvider,
  ): void {
    this.storage()?.setItem(
      storageKey,
      provider,
    );
  }

  private storage(): Storage | null {
    try {
      return typeof localStorage === 'undefined'
        ? null
        : localStorage;
    } catch {
      return null;
    }
  }
}

function isGoogleProvider(
  provider: MapProvider,
): provider is 'google' | 'google3d' {
  return (
    provider === 'google' ||
    provider === 'google3d'
  );
}

function isMapProvider(
  provider: string | null | undefined,
): provider is MapProvider {
  return (
    provider === 'leaflet' ||
    provider === 'google' ||
    provider === 'google3d'
  );
}
