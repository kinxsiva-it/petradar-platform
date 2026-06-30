import { InjectionToken, Injectable, inject } from '@angular/core';

import type { PetRadarRuntimeConfig } from './runtime-config.model.js';

let runtimeConfig: PetRadarRuntimeConfig = {};

export const PETRADAR_RUNTIME_CONFIG = new InjectionToken<PetRadarRuntimeConfig>(
  'PetRadar runtime config',
  {
    factory: () => currentPetRadarRuntimeConfig(),
    providedIn: 'root',
  },
);

@Injectable({ providedIn: 'root' })
export class RuntimeConfigService {
  private readonly initialConfig = inject(PETRADAR_RUNTIME_CONFIG);

  googleMapsApiKey(): string | null {
    const key = (
      currentPetRadarRuntimeConfig().googleMapsApiKey ?? this.initialConfig.googleMapsApiKey
    )?.trim();
    if (!key) {
      return null;
    }

    return key;
  }
}

export function readPetRadarRuntimeConfig(): PetRadarRuntimeConfig {
  if (typeof window === 'undefined') {
    return {};
  }

  return normalizeRuntimeConfig(window.__PETRADAR_RUNTIME_CONFIG__ ?? {});
}

export function currentPetRadarRuntimeConfig(): PetRadarRuntimeConfig {
  return runtimeConfig;
}

export function loadPetRadarRuntimeConfig(): Promise<void> {
  if (typeof document === 'undefined') {
    runtimeConfig = {};
    return Promise.resolve();
  }

  if (document.querySelector('script[data-petradar-runtime-config="true"]')) {
    runtimeConfig = readPetRadarRuntimeConfig();
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = '/runtime-config.js';
    script.async = false;
    script.dataset['petradarRuntimeConfig'] = 'true';
    script.onload = () => {
      runtimeConfig = readPetRadarRuntimeConfig();
      resolve();
    };
    script.onerror = () => {
      runtimeConfig = {};
      resolve();
    };
    document.head.append(script);
  });
}

export function resetPetRadarRuntimeConfigForTest(): void {
  runtimeConfig = {};
}

function normalizeRuntimeConfig(config: PetRadarRuntimeConfig): PetRadarRuntimeConfig {
  return {
    googleMapsApiKey:
      typeof config.googleMapsApiKey === 'string' ? config.googleMapsApiKey.trim() : undefined,
  };
}
