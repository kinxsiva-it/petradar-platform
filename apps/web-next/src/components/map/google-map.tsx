'use client';

import { useEffect, useRef, useState } from 'react';

import { publicEnv } from '../../lib/config/env';
import type { MapPoint } from './map-types';

interface GoogleMapApi {
  Map: new (element: HTMLElement, options: { center: { lat: number; lng: number }; mapTypeControl: boolean; streetViewControl: boolean; zoom: number }) => unknown;
  Circle: new (options: { center: { lat: number; lng: number }; clickable: boolean; fillColor: string; fillOpacity: number; map: unknown; radius: number; strokeColor: string; strokeWeight: number }) => { addListener(name: string, handler: () => void): void };
  event: { trigger(target: unknown, name: string): void };
}

declare global { interface Window { google?: { maps: GoogleMapApi }; petradarGoogleMapsReady?: () => void; } }

let googleLoader: Promise<GoogleMapApi> | null = null;

export function GoogleMap({ markers, onSelect, onUnavailable }: { markers: readonly MapPoint[]; onSelect?(id: string): void; onUnavailable(): void }) {
  const container = useRef<HTMLDivElement>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const element = container.current;
    const key = publicEnv.googleMapsApiKey;
    if (!element || !key) return;
    let active = true;
    void loadGoogleMaps(key).then((maps) => {
      if (!active) return;
      const first = markers[0];
      const map = new maps.Map(element, {
        center: first ? { lat: first.latitude, lng: first.longitude } : { lat: 13.7563, lng: 100.5018 },
        mapTypeControl: false,
        streetViewControl: false,
        zoom: first ? 13 : 6,
      });
      for (const point of markers) {
        const circle = new maps.Circle({
          center: { lat: point.latitude, lng: point.longitude },
          clickable: true,
          fillColor: '#14b8a6',
          fillOpacity: 0.28,
          map,
          radius: point.radiusMeters ?? 80,
          strokeColor: '#0f766e',
          strokeWeight: 2,
        });
        circle.addListener('click', () => onSelect?.(point.id));
      }
      maps.event.trigger(map, 'resize');
    }).catch(() => { if (active) { setError('Google Maps could not load. PetRadar returned to Leaflet.'); onUnavailable(); } });
    return () => { active = false; };
  }, [markers, onSelect, onUnavailable]);

  return <>{error ? <div className="feedback feedback-error" role="alert">{error}</div> : null}<div ref={container} className="leaflet-canvas" role="application" aria-label="Google community map" /></>;
}

function loadGoogleMaps(key: string): Promise<GoogleMapApi> {
  if (window.google?.maps) return Promise.resolve(window.google.maps);
  if (googleLoader) return googleLoader;
  googleLoader = new Promise((resolve, reject) => {
    const callback = 'petradarGoogleMapsReady';
    window.petradarGoogleMapsReady = () => {
      delete window.petradarGoogleMapsReady;
      if (window.google?.maps) resolve(window.google.maps); else reject(new Error('Google Maps unavailable.'));
    };
    const script = document.createElement('script');
    script.async = true;
    script.defer = true;
    script.onerror = () => reject(new Error('Google Maps failed to load.'));
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&callback=${callback}`;
    document.head.append(script);
  });
  return googleLoader;
}
