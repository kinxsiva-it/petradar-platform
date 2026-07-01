import { Injector, runInInjectionContext } from '@angular/core';

import type { PetRadarRuntimeConfig } from './runtime-config.model.js';
import {
  PETRADAR_RUNTIME_CONFIG,
  RuntimeConfigService,
  currentPetRadarRuntimeConfig,
  loadPetRadarRuntimeConfig,
  resetPetRadarRuntimeConfigForTest,
} from './runtime-config.service.js';

interface FakeScript {
  async: boolean;
  dataset: Record<string, string>;
  onerror?: () => void;
  onload?: () => void;
  src: string;
}

function setupBrowser(
  options: {
    existingScript?: boolean;
    runtimeConfig?: PetRadarRuntimeConfig;
  } = {},
) {
  let appendedScript: FakeScript | null = null;
  const existingScript: FakeScript = {
    async: false,
    dataset: { petradarRuntimeConfig: 'true' },
    src: '/runtime-config.js',
  };

  const fakeDocument = {
    createElement: vi.fn(
      (): FakeScript => ({
        async: true,
        dataset: {},
        src: '',
      }),
    ),
    head: {
      append: vi.fn((script: FakeScript) => {
        appendedScript = script;
      }),
    },
    querySelector: vi.fn(() => (options.existingScript ? existingScript : null)),
  };
  const fakeWindow: { __PETRADAR_RUNTIME_CONFIG__?: PetRadarRuntimeConfig } = {
    __PETRADAR_RUNTIME_CONFIG__: options.runtimeConfig ?? {},
  };

  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    value: fakeDocument,
  });
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: fakeWindow,
  });

  return {
    appendedScript: () => appendedScript,
    document: fakeDocument,
    window: fakeWindow,
  };
}

function createRuntimeConfigService(): RuntimeConfigService {
  const injector = Injector.create({
    providers: [
      RuntimeConfigService,
      {
        provide: PETRADAR_RUNTIME_CONFIG,
        useFactory: () => currentPetRadarRuntimeConfig(),
      },
    ],
  });

  return runInInjectionContext(injector, () => injector.get(RuntimeConfigService));
}

describe('runtime config loading', () => {
  afterEach(() => {
    resetPetRadarRuntimeConfigForTest();
    Reflect.deleteProperty(globalThis, 'document');
    Reflect.deleteProperty(globalThis, 'window');
    vi.restoreAllMocks();
  });

  it('loads the local runtime config script before exposing the Google Maps key', async () => {
    const { appendedScript, document } = setupBrowser({
      runtimeConfig: {
        googleMaps3dMapId: ' local-3d-map-id ',
        googleMapsApiKey: ' local-browser-key ',
      },
    });

    const load = loadPetRadarRuntimeConfig();
    appendedScript()?.onload?.();
    await load;

    expect(document.head.append).toHaveBeenCalledTimes(1);
    expect(appendedScript()?.src).toBe('/runtime-config.js');
    expect(appendedScript()?.async).toBe(false);
    expect(currentPetRadarRuntimeConfig().googleMaps3dMapId).toBe('local-3d-map-id');
    expect(currentPetRadarRuntimeConfig().googleMapsApiKey).toBe('local-browser-key');
  });

  it('keeps Google Maps unavailable when the local runtime config script is missing', async () => {
    const { appendedScript } = setupBrowser();

    const load = loadPetRadarRuntimeConfig();
    appendedScript()?.onerror?.();
    await load;

    expect(currentPetRadarRuntimeConfig().googleMapsApiKey).toBeUndefined();
  });

  it('treats whitespace-only keys as unconfigured', async () => {
    const { appendedScript } = setupBrowser({
      runtimeConfig: { googleMaps3dMapId: '   ', googleMapsApiKey: '   ' },
    });

    const load = loadPetRadarRuntimeConfig();
    appendedScript()?.onload?.();
    await load;

    const service = createRuntimeConfigService();

    expect(service.googleMaps3dMapId()).toBeNull();
    expect(service.googleMapsApiKey()).toBeNull();
  });

  it('refreshes the in-memory config when a runtime config script is already present', async () => {
    setupBrowser({
      existingScript: true,
      runtimeConfig: { googleMapsApiKey: 'local-browser-key' },
    });

    await loadPetRadarRuntimeConfig();

    expect(currentPetRadarRuntimeConfig().googleMapsApiKey).toBe('local-browser-key');
  });

  it('does not pin the service to an initially empty runtime config', async () => {
    const { window } = setupBrowser({ existingScript: true });
    const service = createRuntimeConfigService();

    expect(service.googleMapsApiKey()).toBeNull();

    window.__PETRADAR_RUNTIME_CONFIG__ = { googleMapsApiKey: 'local-browser-key' };
    await loadPetRadarRuntimeConfig();

    expect(service.googleMapsApiKey()).toBe('local-browser-key');
  });

  it('does not log the configured Google Maps key while loading runtime config', async () => {
    const consoleLog = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { appendedScript } = setupBrowser({
      runtimeConfig: { googleMapsApiKey: 'local-browser-key' },
    });

    const load = loadPetRadarRuntimeConfig();
    appendedScript()?.onload?.();
    await load;

    expect(JSON.stringify(consoleLog.mock.calls)).not.toContain('local-browser-key');
    expect(JSON.stringify(consoleError.mock.calls)).not.toContain('local-browser-key');
  });
});
