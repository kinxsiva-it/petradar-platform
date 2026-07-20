'use client';

import { useEffect, useRef } from 'react';

import { mapMarkerAsset, type MapPoint, type PickedLocation } from './map-types';

const bangkok: [number, number] = [13.7563, 100.5018];

export function LeafletMap({
  followPicked,
  label,
  markers,
  onCenterChange,
  onPick,
  onSelect,
  picked,
}: {
  followPicked?: boolean;
  label: string;
  markers?: readonly MapPoint[];
  onCenterChange?: (center: PickedLocation) => void;
  onPick?: (location: PickedLocation) => void;
  onSelect?: (id: string) => void;
  picked?: PickedLocation | null;
}) {
  const container = useRef<HTMLDivElement>(null);
  const viewRef = useRef<{ center: [number, number]; zoom: number } | null>(null);
  const onPickRef = useRef(onPick);
  const onSelectRef = useRef(onSelect);
  const onCenterChangeRef = useRef(onCenterChange);
  onPickRef.current = onPick;
  onSelectRef.current = onSelect;
  onCenterChangeRef.current = onCenterChange;

  useEffect(() => {
    const element = container.current;
    if (!element) return;
    let disposed = false;
    let cleanup: () => void = () => undefined;

    void import('leaflet').then((leaflet) => {
      if (disposed) return;
      const points = markers ?? [];
      const first = picked ?? points[0] ?? null;
      const preservedView = viewRef.current;
      const followedCenter: [number, number] | null = followPicked && picked
        ? [picked.latitude, picked.longitude]
        : null;
      const map = leaflet.map(element, { zoomControl: true }).setView(
        followedCenter ?? preservedView?.center ?? (first ? [first.latitude, first.longitude] : bangkok),
        preservedView?.zoom ?? (first ? 13 : 6),
      );
      const initialCenter = map.getCenter();
      onCenterChangeRef.current?.(roundLocation(initialCenter.lat, initialCenter.lng));
      leaflet.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      for (const point of points) {
        const center: [number, number] = [point.latitude, point.longitude];
        const colors = mapPointColors(point.tone);
        if (point.radiusMeters) {
          leaflet.circle(center, {
            color: colors.stroke,
            fillColor: colors.fill,
            fillOpacity: point.selected ? 0.3 : 0.18,
            radius: point.radiusMeters,
            weight: point.selected ? 3 : 2,
          }).addTo(map);
          if (point.radar) {
            leaflet.circle(center, {
              className: 'map-area-radar-wave',
              color: colors.stroke,
              fillColor: colors.fill,
              fillOpacity: 0.1,
              interactive: false,
              radius: point.radiusMeters,
              weight: 2,
            }).addTo(map);
          }
        }
        const markerSize = point.selected ? 56 : 48;
        const marker = leaflet.marker(center, {
          icon: leaflet.icon({
            className: `map-marker-icon ${point.selected ? 'map-marker-selected' : ''}`,
            iconAnchor: [markerSize / 2, markerSize / 2],
            iconSize: [markerSize, markerSize],
            iconUrl: mapMarkerAsset(point.tone),
          }),
          title: point.title,
        }).addTo(map);
        if (point.interactive !== false) {
          marker.on('click', () => {
            onSelectRef.current?.(point.id);
          });
        }
      }

      if (picked) {
        const markerSize = 52;
        const pin = leaflet.marker([picked.latitude, picked.longitude], {
          draggable: Boolean(onPickRef.current),
          icon: leaflet.icon({
            className: 'map-marker-icon map-marker-selected private-location-marker',
            iconAnchor: [markerSize / 2, markerSize / 2],
            iconSize: [markerSize, markerSize],
            iconUrl: mapMarkerAsset('blue'),
          }),
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
      map.on('moveend', () => {
        const center = map.getCenter();
        viewRef.current = { center: [center.lat, center.lng], zoom: map.getZoom() };
        onCenterChangeRef.current?.(roundLocation(center.lat, center.lng));
      });
      window.setTimeout(() => map.invalidateSize(), 0);
      cleanup = () => {
        const center = map.getCenter();
        viewRef.current = { center: [center.lat, center.lng], zoom: map.getZoom() };
        map.remove();
      };
    });

    return () => {
      disposed = true;
      cleanup();
    };
  }, [followPicked, markers, picked]);

  return <div ref={container} className="leaflet-canvas" role="application" aria-label={label} />;
}

function mapPointColors(tone: MapPoint['tone']): { fill: string; stroke: string } {
  if (tone === 'blue') return { fill: '#2f80ed', stroke: '#1e63bd' };
  if (tone === 'coral') return { fill: '#ef625f', stroke: '#bd3e3c' };
  if (tone === 'orange') return { fill: '#f59e0b', stroke: '#b86f00' };
  if (tone === 'purple') return { fill: '#8b5cf6', stroke: '#6540bf' };
  if (tone === 'veterinary') return { fill: '#168f82', stroke: '#0b675e' };
  return { fill: '#0f9b8e', stroke: '#08756c' };
}

function roundLocation(latitude: number, longitude: number): PickedLocation {
  return { latitude: Number(latitude.toFixed(6)), longitude: Number(longitude.toFixed(6)) };
}
