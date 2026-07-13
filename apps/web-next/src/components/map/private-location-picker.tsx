'use client';

import { useMemo, useState } from 'react';

import { LeafletMap } from './leaflet-map';
import type { PickedLocation } from './map-types';

export function PrivateLocationPicker({
  latitude,
  longitude,
  onChange,
}: {
  latitude: string;
  longitude: string;
  onChange(location: PickedLocation): void;
}) {
  const [locationState, setLocationState] = useState<'idle' | 'loading' | 'denied'>('idle');
  const picked = useMemo(() => parseLocation(latitude, longitude), [latitude, longitude]);

  function useCurrentLocation() {
    if (!navigator.geolocation) { setLocationState('denied'); return; }
    setLocationState('loading');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        onChange({ latitude: Number(position.coords.latitude.toFixed(6)), longitude: Number(position.coords.longitude.toFixed(6)) });
        setLocationState('idle');
      },
      () => setLocationState('denied'),
      { enableHighAccuracy: true, maximumAge: 30_000, timeout: 10_000 },
    );
  }

  return <div className="private-picker"><div className="map-toolbar"><div><strong>Place the private pin</strong><span>Click the map or drag the pin. You can still type coordinates below.</span></div><button className="secondary-action" disabled={locationState === 'loading'} type="button" onClick={useCurrentLocation}>{locationState === 'loading' ? 'Locating…' : 'Use current location'}</button></div>{locationState === 'denied' ? <div className="feedback feedback-error" role="alert">Location access is unavailable or was denied. Place the pin or use the manual fields.</div> : null}<LeafletMap label="Private exact location picker" picked={picked} onPick={onChange} /><div className="privacy-note compact-note"><strong>Exact pin stays private</strong><span>PetRadar sends this point only in your authenticated create or edit request. Public viewers receive a separately generated approximate area.</span></div></div>;
}

function parseLocation(latitude: string, longitude: string): PickedLocation | null {
  const lat = Number(latitude);
  const lng = Number(longitude);
  if (!latitude || !longitude || !Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { latitude: lat, longitude: lng };
}
