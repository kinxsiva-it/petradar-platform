import { Injector, runInInjectionContext } from '@angular/core';

import { RuntimeConfigService } from '@petradar/frontend/core';

import { GoogleMapsLoadError, GoogleMapsLoaderService } from './google-maps-loader.service.js';
import type { GoogleMapsNamespace } from './google-maps.types.js';

interface FakeScript {
  async: boolean;
  dataset: Record<string, string>;
  defer: boolean;
  onerror?: () => void;
  src: string;
}

function setup(key: string | null) {
  let appendedScript: FakeScript | null = null;
  const fakeDocument = {
    createElement: vi.fn((): FakeScript => ({
      async: false,
      dataset: {},
      defer: false,
      src: '',
    })),
    head: {
      append: vi.fn((script: FakeScript) => {
        appendedScript = script;
      }),
    },
    querySelector: vi.fn(() => appendedScript),
  };
  const fakeWindow: {
    __petradarGoogleMapsReady?: () => void;
    google?: GoogleMapsNamespace;
  } = {};

  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    value: fakeDocument,
  });
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: fakeWindow,
  });

  const injector = Injector.create({
    providers: [
      GoogleMapsLoaderService,
      {
        provide: RuntimeConfigService,
        useValue: {
          googleMapsApiKey: () => key,
        },
      },
    ],
  });

  return {
    appendedScript: () => appendedScript,
    document: fakeDocument,
    loader: runInInjectionContext(injector, () => injector.get(GoogleMapsLoaderService)),
    window: fakeWindow,
  };
}

describe('GoogleMapsLoaderService', () => {
  afterEach(() => {
    Reflect.deleteProperty(globalThis, 'document');
    Reflect.deleteProperty(globalThis, 'window');
    vi.restoreAllMocks();
  });

  it('rejects safely when no Google key is configured', async () => {
    const { loader } = setup(null);

    await expect(loader.load()).rejects.toBeInstanceOf(GoogleMapsLoadError);
  });

  it('loads lazily and initializes only one Google script promise', async () => {
    const { appendedScript, document, loader, window } = setup('local-browser-key');

    expect(document.head.append).not.toHaveBeenCalled();

    const firstLoad = loader.load();
    const secondLoad = loader.load();
    window.google = fakeGoogleMaps();
    window.__petradarGoogleMapsReady?.();

    await expect(firstLoad).resolves.toBe(window.google);
    await expect(secondLoad).resolves.toBe(window.google);
    expect(document.head.append).toHaveBeenCalledTimes(1);
    expect(appendedScript()?.src).toContain('maps.googleapis.com/maps/api/js');
    expect(appendedScript()?.src).toContain('libraries=marker');
  });

  it('does not log the configured Google key', async () => {
    const consoleLog = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { loader, window } = setup('local-browser-key');

    const load = loader.load();
    window.google = fakeGoogleMaps();
    window.__petradarGoogleMapsReady?.();
    await load;

    expect(JSON.stringify(consoleLog.mock.calls)).not.toContain('local-browser-key');
    expect(JSON.stringify(consoleError.mock.calls)).not.toContain('local-browser-key');
  });

  it('allows retry after a transient load failure', async () => {
    const { appendedScript, document, loader } = setup('local-browser-key');

    const firstLoad = loader.load();
    appendedScript()?.onerror?.();
    await expect(firstLoad).rejects.toBeInstanceOf(GoogleMapsLoadError);

    document.querySelector.mockReturnValueOnce(null);
    void loader.load();

    expect(document.head.append).toHaveBeenCalledTimes(2);
  });
});

function fakeGoogleMaps(): GoogleMapsNamespace {
  return {
    maps: {
      Circle: vi.fn(),
      Map: vi.fn(),
      Marker: vi.fn(),
      SymbolPath: {
        CIRCLE: 'circle',
      },
      event: {
        clearInstanceListeners: vi.fn(),
      },
    },
  };
}
