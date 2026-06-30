import { InjectionToken, Injectable, inject } from '@angular/core';

import type { PetRadarRuntimeConfig } from './runtime-config.model.js';

export const PETRADAR_RUNTIME_CONFIG = new InjectionToken<PetRadarRuntimeConfig>(
  'PetRadar runtime config',
  {
    factory: () => readPetRadarRuntimeConfig(),
    providedIn: 'root',
  },
);

@Injectable({ providedIn: 'root' })
export class RuntimeConfigService {
  private readonly config = inject(PETRADAR_RUNTIME_CONFIG);

  googleMapsApiKey(): string | null {
    const key = this.config.googleMapsApiKey?.trim();
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

  return window.__PETRADAR_RUNTIME_CONFIG__ ?? {};
}

export function loadPetRadarRuntimeConfig(): Promise<void> {
  if (typeof document === 'undefined') {
    return Promise.resolve();
  }

  if (document.querySelector('script[data-petradar-runtime-config="true"]')) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = '/runtime-config.js';
    script.async = false;
    script.dataset['petradarRuntimeConfig'] = 'true';
    script.onload = () => {
      resolve();
    };
    script.onerror = () => {
      resolve();
    };
    document.head.append(script);
  });
}
