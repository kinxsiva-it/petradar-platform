import { Injector, runInInjectionContext } from '@angular/core';

import { RuntimeConfigService } from '@petradar/frontend/core';

import { MapProviderStateService } from './map-provider-state.service';

class MemoryStorage implements Storage {
  private readonly values = new Map<string, string>();
  readonly length = 0;

  clear(): void {
    this.values.clear();
  }

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  key(): string | null {
    return null;
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

function setup(options: { googleKey?: string | null; storedProvider?: string } = {}) {
  const storage = new MemoryStorage();
  if (options.storedProvider) {
    storage.setItem('petradar.mapProvider', options.storedProvider);
  }

  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: storage,
  });

  const injector = Injector.create({
    providers: [
      MapProviderStateService,
      {
        provide: RuntimeConfigService,
        useValue: {
          googleMapsApiKey: () => options.googleKey ?? null,
        },
      },
    ],
  });

  return {
    service: runInInjectionContext(injector, () => injector.get(MapProviderStateService)),
    storage,
  };
}

describe('MapProviderStateService', () => {
  afterEach(() => {
    Reflect.deleteProperty(globalThis, 'localStorage');
  });

  it('uses Leaflet as the default provider', () => {
    const { service } = setup();

    expect(service.activeProvider()).toBe('leaflet');
  });

  it('restores a saved Google preference only when a key is configured', () => {
    const { service } = setup({ googleKey: 'local-browser-key', storedProvider: 'google' });

    expect(service.activeProvider()).toBe('google');
  });

  it('restores a saved Google 3D preference only when a key is configured', () => {
    const { service } = setup({ googleKey: 'local-browser-key', storedProvider: 'google3d' });

    expect(service.activeProvider()).toBe('google3d');
  });

  it('falls back to Leaflet for unknown saved providers', () => {
    const { service } = setup({ googleKey: 'local-browser-key', storedProvider: 'unknown' });

    expect(service.activeProvider()).toBe('leaflet');
  });

  it('updates signal state and stores only the provider preference', () => {
    const { service, storage } = setup({ googleKey: 'local-browser-key' });

    expect(service.selectProvider('google')).toBe(true);

    expect(service.activeProvider()).toBe('google');
    expect(storage.getItem('petradar.mapProvider')).toBe('google');
    expect(JSON.stringify(storage)).not.toContain('local-browser-key');
    expect(JSON.stringify(storage)).not.toContain('13.782');
  });

  it('handles a missing Google key safely and keeps Leaflet active', () => {
    const { service, storage } = setup();

    expect(service.selectProvider('google')).toBe(false);

    expect(service.activeProvider()).toBe('leaflet');
    expect(storage.getItem('petradar.mapProvider')).toBe('leaflet');
    expect(service.message()).toContain('Google Maps');
  });

  it('handles a missing Google key safely for Google 3D', () => {
    const { service, storage } = setup();

    expect(service.selectProvider('google3d')).toBe(false);

    expect(service.activeProvider()).toBe('leaflet');
    expect(storage.getItem('petradar.mapProvider')).toBe('leaflet');
    expect(service.message()).toContain('Google 3D');
  });

  it('falls back to Leaflet after a Google load failure', () => {
    const { service } = setup({ googleKey: 'local-browser-key', storedProvider: 'google' });

    service.fallbackToLeaflet('Google Maps could not load.');

    expect(service.activeProvider()).toBe('leaflet');
    expect(service.message()).toBe('Google Maps could not load.');
  });

  it('falls back from Google 3D to Google Maps when Google is configured', () => {
    const { service } = setup({ googleKey: 'local-browser-key', storedProvider: 'google3d' });

    service.fallbackFromGoogle3d('Google 3D is unavailable.');

    expect(service.activeProvider()).toBe('google');
    expect(service.storedPreferenceForTest()).toBe('google');
    expect(service.message()).toBe('Google 3D is unavailable.');
  });
});

