'use client';

import { useEffect, useRef } from 'react';

import type { MapPoint, PickedLocation } from './map-types';

const bangkok: [number, number] = [13.7563, 100.5018];

export function LeafletMap({
  label,
  markers,
  onPick,
  onSelect,
  picked,
}: {
  label: string;
  markers?: readonly MapPoint[];
  onPick?(location: PickedLocation): void;
  onSelect?(id: string): void;
  picked?: PickedLocation | null;
}) {
  const container = useRef<HTMLDivElement>(null);
  const onPickRef = useRef(onPick);
  const onSelectRef = useRef(onSelect);
  onPickRef.current = onPick;
  onSelectRef.current = onSelect;

  useEffect(() => {
    const element = container.current;
    if (!element) return;
    let disposed = false;
    let cleanup: () => void = () => undefined;

    void import('leaflet').then((leaflet) => {
      if (disposed) return;
      const points = markers ?? [];
      const first = picked ?? points[0] ?? null;
      const map = leaflet.map(element, { zoomControl: true }).setView(
        first ? [first.latitude, first.longitude] : bangkok,
        first ? 13 : 6,
      );
      leaflet.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      for (const point of points) {
        const center: [number, number] = [point.latitude, point.longitude];
        if (point.radiusMeters) {
          leaflet.circle(center, {
              color: '#0f766e',
              fillColor: '#14b8a6',
              fillOpacity: 0.28,
              radius: point.radiusMeters,
              weight: 2,
            }).addTo(map);
        }
        leaflet.marker(center, { title: point.title }).addTo(map).on('click', () => onSelectRef.current?.(point.id));
      }

      if (picked) {
        const pin = leaflet.marker([picked.latitude, picked.longitude], {
          draggable: Boolean(onPickRef.current),
          title: 'Private exact location',
        }).addTo(map);
        pin.on('dragend', () => {
          const next = pin.getLatLng();
          onPickRef.current?.(roundLocation(next.lat, next.lng));
        });
      }

      if (onPickRef.current) {
        map.on('click', (event) => onPickRef.current?.(roundLocation(event.latlng.lat, event.latlng.lng)));
      }
      window.setTimeout(() => map.invalidateSize(), 0);
      cleanup = () => map.remove();
    });

    return () => {
      disposed = true;
      cleanup();
    };
  }, [markers, picked]);

  return <div ref={container} className="leaflet-canvas" role="application" aria-label={label} />;
}

function roundLocation(latitude: number, longitude: number): PickedLocation {
  return { latitude: Number(latitude.toFixed(6)), longitude: Number(longitude.toFixed(6)) };
}
