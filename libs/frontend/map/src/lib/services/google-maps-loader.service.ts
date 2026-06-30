import { Injectable, inject } from '@angular/core';

import { RuntimeConfigService } from '@petradar/frontend/core';

import type { GoogleMapsNamespace } from './google-maps.types.js';

export type GoogleMapsLoadFailure = 'missing-key' | 'missing-browser' | 'load-failed';

export class GoogleMapsLoadError extends Error {
  constructor(readonly reason: GoogleMapsLoadFailure) {
    super(reason);
  }
}

@Injectable({ providedIn: 'root' })
export class GoogleMapsLoaderService {
  private readonly runtimeConfig = inject(RuntimeConfigService);
  private loadPromise: Promise<GoogleMapsNamespace> | null = null;

  load(): Promise<GoogleMapsNamespace> {
    if (typeof window !== 'undefined' && window.google?.maps.Map) {
      return Promise.resolve(window.google);
    }

    if (this.loadPromise) {
      return this.loadPromise;
    }

    const key = this.runtimeConfig.googleMapsApiKey();
    if (!key) {
      return Promise.reject(new GoogleMapsLoadError('missing-key'));
    }

    if (typeof document === 'undefined' || typeof window === 'undefined') {
      return Promise.reject(new GoogleMapsLoadError('missing-browser'));
    }

    this.loadPromise = new Promise((resolve, reject) => {
      const existingScript = document.querySelector<HTMLScriptElement>(
        'script[data-petradar-google-maps-loader="true"]',
      );

      window.__petradarGoogleMapsReady = () => {
        if (window.google?.maps.Map) {
          resolve(window.google);
          return;
        }

        this.loadPromise = null;
        reject(new GoogleMapsLoadError('load-failed'));
      };

      const script = existingScript ?? document.createElement('script');
      script.dataset['petradarGoogleMapsLoader'] = 'true';
      script.async = true;
      script.defer = true;
      script.src = this.googleMapsUrl(key);
      script.onerror = () => {
        this.loadPromise = null;
        reject(new GoogleMapsLoadError('load-failed'));
      };

      if (!existingScript) {
        document.head.append(script);
      }
    });

    return this.loadPromise;
  }

  private googleMapsUrl(key: string): string {
    const params = new URLSearchParams({
      callback: '__petradarGoogleMapsReady',
      key,
      libraries: 'marker',
      v: 'weekly',
    });

    return `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
  }
}
