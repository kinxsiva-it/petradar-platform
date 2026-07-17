'use client';

export interface GoogleGeocoderResult {
  geometry: {
    location: {
      lat(): number;
      lng(): number;
    };
  };
}

export interface GoogleMapApi {
  Map: new (element: HTMLElement, options: { center: { lat: number; lng: number }; mapTypeControl: boolean; streetViewControl: boolean; zoom: number }) => unknown;
  Circle: new (options: { center: { lat: number; lng: number }; clickable: boolean; fillColor: string; fillOpacity: number; map: unknown; radius: number; strokeColor: string; strokeWeight: number }) => { addListener(name: string, handler: () => void): void };
  Geocoder: new () => {
    geocode(
      request: { address: string },
      callback: (results: readonly GoogleGeocoderResult[] | null, status: string) => void,
    ): void;
  };
  event: { trigger(target: unknown, name: string): void };
}

declare global {
  interface Window {
    google?: { maps: GoogleMapApi };
    petradarGoogleMapsReady?: () => void;
  }
}

let googleLoader: Promise<GoogleMapApi> | null = null;

export function loadGoogleMaps(key: string): Promise<GoogleMapApi> {
  if (window.google?.maps) return Promise.resolve(window.google.maps);
  if (googleLoader) return googleLoader;

  googleLoader = new Promise((resolve, reject) => {
    const callback = 'petradarGoogleMapsReady';
    window.petradarGoogleMapsReady = () => {
      delete window.petradarGoogleMapsReady;
      if (window.google?.maps) resolve(window.google.maps);
      else reject(new Error('Google Maps unavailable.'));
    };
    const script = document.createElement('script');
    script.async = true;
    script.defer = true;
    script.onerror = () => {
      googleLoader = null;
      reject(new Error('Google Maps failed to load.'));
    };
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&callback=${callback}`;
    document.head.append(script);
  });

  return googleLoader;
}
