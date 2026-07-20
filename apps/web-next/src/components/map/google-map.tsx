'use client';

import { useEffect, useRef, useState } from 'react';

import { publicEnv } from '../../lib/config/env';
import { loadGoogleMaps } from './google-maps-loader';
import { mapMarkerAsset, type MapPoint } from './map-types';

export function GoogleMap({ markers, onCenterChange, onSelect, onUnavailable }: { markers: readonly MapPoint[]; onCenterChange?: (center: { latitude: number; longitude: number }) => void; onSelect?: (id: string) => void; onUnavailable: () => void }) {
  const container = useRef<HTMLDivElement>(null);
  const viewRef = useRef<{ center: { lat: number; lng: number }; zoom: number } | null>(null);
  const [error, setError] = useState('');
  const onCenterChangeRef = useRef(onCenterChange);
  const onSelectRef = useRef(onSelect);
  const onUnavailableRef = useRef(onUnavailable);
  onCenterChangeRef.current = onCenterChange;
  onSelectRef.current = onSelect;
  onUnavailableRef.current = onUnavailable;

  useEffect(() => {
    const element = container.current;
    const key = publicEnv.googleMapsApiKey;
    if (!element || !key) return;
    let active = true;
    void loadGoogleMaps(key).then((maps) => {
      if (!active) return;
      const first = markers[0];
      const preservedView = viewRef.current;
      const map = new maps.Map(element, {
        center: preservedView?.center ?? (first ? { lat: first.latitude, lng: first.longitude } : { lat: 13.7563, lng: 100.5018 }),
        mapTypeControl: false,
        streetViewControl: false,
        zoom: preservedView?.zoom ?? (first ? 13 : 6),
      });
      map.addListener('idle', () => {
        const center = map.getCenter();
        if (center) {
          viewRef.current = { center: { lat: center.lat(), lng: center.lng() }, zoom: map.getZoom() ?? 13 };
          onCenterChangeRef.current?.({ latitude: Number(center.lat().toFixed(6)), longitude: Number(center.lng().toFixed(6)) });
        }
      });
      const radarWaves: Array<{
        targetRadius: number;
        wave: {
          setOptions(options: { fillOpacity: number; strokeOpacity: number; strokeWeight?: number }): void;
          setRadius(radius: number): void;
        };
      }> = [];
      for (const point of markers) {
        const colors = mapPointColors(point.tone);
        if (point.radiusMeters) {
          const baseStrokeWeight = point.selected ? 4 : 2;
          const circle = new maps.Circle({
            center: { lat: point.latitude, lng: point.longitude },
            clickable: point.interactive !== false,
            fillColor: colors.fill,
            fillOpacity: point.selected ? 0.3 : 0.18,
            map,
            radius: point.radiusMeters,
            strokeColor: colors.stroke,
            strokeOpacity: 1,
            strokeWeight: baseStrokeWeight,
          });
          if (point.interactive !== false) {
            circle.addListener('click', () => onSelectRef.current?.(point.id));
          }
          if (point.radar && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            const wave = new maps.Circle({
              center: { lat: point.latitude, lng: point.longitude },
              clickable: false,
              fillColor: colors.fill,
              fillOpacity: 0.1,
              map,
              radius: 1,
              strokeColor: colors.stroke,
              strokeOpacity: 0.7,
              strokeWeight: 2,
            });
            radarWaves.push({ targetRadius: point.radiusMeters, wave });
          }
        }
        const markerSize = point.selected ? 56 : 48;
        const marker = new maps.Marker({
          icon: {
            scaledSize: new maps.Size(markerSize, markerSize),
            url: mapMarkerAsset(point.tone),
          },
          map,
          position: { lat: point.latitude, lng: point.longitude },
          title: point.title,
          zIndex: point.selected ? 20 : 10,
        });
        if (point.interactive !== false) {
          marker.addListener('click', () => onSelectRef.current?.(point.id));
        }
      }
      if (radarWaves.length > 0) {
        const startedAt = performance.now();
        const animateRadarWaves = (now: number) => {
          if (!active) return;
          const progress = ((now - startedAt) % 2800) / 2800;
          for (const radar of radarWaves) {
            radar.wave.setRadius(Math.max(1, radar.targetRadius * progress));
            radar.wave.setOptions({
              fillOpacity: 0.12 * (1 - progress),
              strokeOpacity: 0.72 * (1 - progress),
              strokeWeight: 2.5 - progress,
            });
          }
          window.requestAnimationFrame(animateRadarWaves);
        };
        window.requestAnimationFrame(animateRadarWaves);
      }
      maps.event.trigger(map, 'resize');
    }).catch(() => { if (active) { setError('Google Maps could not load. PetRadar returned to Leaflet.'); onUnavailableRef.current(); } });
    return () => { active = false; };
  }, [markers]);

  return <>{error ? <div className="feedback feedback-error" role="alert">{error}</div> : null}<div ref={container} className="leaflet-canvas" role="application" aria-label="Google community map" /></>;
}

function mapPointColors(tone: MapPoint['tone']): { fill: string; stroke: string } {
  if (tone === 'blue') return { fill: '#2f80ed', stroke: '#1e63bd' };
  if (tone === 'coral') return { fill: '#ef625f', stroke: '#bd3e3c' };
  if (tone === 'orange') return { fill: '#f59e0b', stroke: '#b86f00' };
  if (tone === 'purple') return { fill: '#8b5cf6', stroke: '#6540bf' };
  if (tone === 'veterinary') return { fill: '#168f82', stroke: '#0b675e' };
  return { fill: '#0f9b8e', stroke: '#08756c' };
}
