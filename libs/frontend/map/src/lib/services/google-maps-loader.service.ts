import { Injectable, inject } from '@angular/core';

import { RuntimeConfigService } from '@petradar/frontend/core';

import type {
  GoogleMaps3DLibrary,
  GoogleMapsMarkerLibrary,
  GoogleMapsNamespace,
  GoogleMapsPlacesLibrary,
} from './google-maps.types';

export type GoogleMapsLoadFailure =
  | 'load-failed'
  | 'marker-unavailable'
  | 'maps3d-unavailable'
  | 'missing-browser'
  | 'missing-key'
  | 'places-unavailable';

export class GoogleMapsLoadError extends Error {
  constructor(readonly reason: GoogleMapsLoadFailure) {
    super(reason);
  }
}

@Injectable({ providedIn: 'root' })
export class GoogleMapsLoaderService {
  private readonly runtimeConfig = inject(RuntimeConfigService);
  private loadPromise: Promise<GoogleMapsNamespace> | null = null;
  private markerPromise: Promise<GoogleMapsMarkerLibrary> | null = null;
  private maps3dPromise: Promise<GoogleMaps3DLibrary> | null = null;
  private placesPromise: Promise<GoogleMapsPlacesLibrary> | null = null;

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

  loadMaps3d(): Promise<GoogleMaps3DLibrary> {
    if (this.maps3dPromise) {
      return this.maps3dPromise;
    }

    this.maps3dPromise = this.load()
      .then((api) => {
        if (!api.maps.importLibrary) {
          throw new GoogleMapsLoadError('maps3d-unavailable');
        }

        return api.maps.importLibrary('maps3d');
      })
      .then((library: Partial<GoogleMaps3DLibrary>) => {
        if (
          typeof library.Map3DElement !== 'function' ||
          typeof library.Marker3DInteractiveElement !== 'function'
        ) {
          throw new GoogleMapsLoadError('maps3d-unavailable');
        }

        return library as GoogleMaps3DLibrary;
      })
      .catch((error: unknown) => {
        this.maps3dPromise = null;
        if (error instanceof GoogleMapsLoadError) {
          throw error;
        }

        throw new GoogleMapsLoadError('maps3d-unavailable');
      });

    return this.maps3dPromise;
  }

  loadMarkerLibrary(): Promise<GoogleMapsMarkerLibrary> {
    if (this.markerPromise) {
      return this.markerPromise;
    }

    this.markerPromise = this.load()
      .then((api) => {
        if (!api.maps.importLibrary) {
          throw new GoogleMapsLoadError('marker-unavailable');
        }

        return api.maps.importLibrary('marker');
      })
      .then((library: Partial<GoogleMapsMarkerLibrary>) => {
        if (!isGoogleMapsMarkerLibrary(library)) {
          throw new GoogleMapsLoadError('marker-unavailable');
        }

        return library;
      })
      .catch((error: unknown) => {
        this.markerPromise = null;
        if (error instanceof GoogleMapsLoadError) {
          throw error;
        }

        throw new GoogleMapsLoadError('marker-unavailable');
      });

    return this.markerPromise;
  }

  loadPlaces(): Promise<GoogleMapsPlacesLibrary> {
    if (this.placesPromise) {
      return this.placesPromise;
    }

    this.placesPromise = this.load()
      .then((api) => {
        if (!api.maps.importLibrary) {
          throw new GoogleMapsLoadError('places-unavailable');
        }

        return api.maps.importLibrary('places');
      })
      .then((library: Partial<GoogleMapsPlacesLibrary>) => {
        if (
          typeof library.AutocompleteSessionToken !== 'function' ||
          typeof library.AutocompleteSuggestion?.fetchAutocompleteSuggestions !== 'function'
        ) {
          throw new GoogleMapsLoadError('places-unavailable');
        }

        return library as GoogleMapsPlacesLibrary;
      })
      .catch((error: unknown) => {
        this.placesPromise = null;
        if (error instanceof GoogleMapsLoadError) {
          throw error;
        }

        throw new GoogleMapsLoadError('places-unavailable');
      });

    return this.placesPromise;
  }

  private googleMapsUrl(key: string): string {
    const params = new URLSearchParams({
      callback: '__petradarGoogleMapsReady',
      key,
      libraries: 'marker,maps3d,places',
      loading: 'async',
      v: 'weekly',
    });

    return `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
  }
}

function isGoogleMapsMarkerLibrary(
  library: Partial<GoogleMapsMarkerLibrary>,
): library is GoogleMapsMarkerLibrary {
  return (
    typeof library.AdvancedMarkerElement === 'function' &&
    typeof library.PinElement === 'function'
  );
}
