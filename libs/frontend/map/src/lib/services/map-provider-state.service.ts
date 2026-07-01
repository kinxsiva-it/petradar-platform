import { Injectable, computed, inject, signal } from '@angular/core';

import { RuntimeConfigService } from '@petradar/frontend/core';

import type { MapProvider } from '../components/map-canvas/map-marker-view.model';

const storageKey = 'petradar.mapProvider';

@Injectable({ providedIn: 'root' })
export class MapProviderStateService {
  private readonly runtimeConfig = inject(RuntimeConfigService);
  private readonly provider = signal<MapProvider>(this.initialProvider());
  private readonly messageState = signal<string | null>(null);

  readonly activeProvider = this.provider.asReadonly();
  readonly message = this.messageState.asReadonly();
  readonly googleConfigured = computed(() => Boolean(this.runtimeConfig.googleMapsApiKey()));

  selectProvider(provider: MapProvider): boolean {
    if (isGoogleProvider(provider) && !this.googleConfigured()) {
      this.messageState.set('Add a local Google Maps browser key to enable Google Maps and Google 3D.');
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
    const provider: MapProvider = this.googleConfigured() ? 'google' : 'leaflet';
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
    const stored = this.storage()?.getItem(storageKey);
    if (isGoogleProvider(stored) && this.runtimeConfig.googleMapsApiKey()) {
      return stored;
    }

    return 'leaflet';
  }

  private storeProvider(provider: MapProvider): void {
    this.storage()?.setItem(storageKey, provider);
  }

  private storage(): Storage | null {
    try {
      return typeof localStorage === 'undefined' ? null : localStorage;
    } catch {
      return null;
    }
  }
}

function isGoogleProvider(
  provider: string | null | undefined,
): provider is 'google' | 'google3d' {
  return provider === 'google' || provider === 'google3d';
}

