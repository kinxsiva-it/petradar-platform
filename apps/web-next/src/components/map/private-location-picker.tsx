'use client';

import { type KeyboardEvent, useMemo, useState } from 'react';

import { publicEnv } from '../../lib/config/env';
import { loadGoogleMaps } from './google-maps-loader';
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
  const [placeQuery, setPlaceQuery] = useState('');
  const [placeSearch, setPlaceSearch] = useState<{ message: string; state: 'idle' | 'loading' | 'error' | 'success' }>({ message: '', state: 'idle' });
  const picked = useMemo(() => parseLocation(latitude, longitude), [latitude, longitude]);
  const googleKey = publicEnv.googleMapsApiKey;

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

  async function searchPlace() {
    const query = placeQuery.trim();
    if (!googleKey) return;
    if (query.length < 2) {
      setPlaceSearch({ message: 'Enter at least two characters to search for a place.', state: 'error' });
      return;
    }

    setPlaceSearch({ message: 'Searching Google Maps…', state: 'loading' });
    try {
      const maps = await loadGoogleMaps(googleKey);
      const result = await geocodeAddress(maps, query);
      if (!result) {
        setPlaceSearch({ message: 'No matching place was found. Try a more specific name or address.', state: 'error' });
        return;
      }
      onChange(result);
      setPlaceSearch({ message: 'Private pin moved to the first matching place. Confirm the location after reviewing the pin.', state: 'success' });
    } catch {
      setPlaceSearch({ message: 'Place search is unavailable right now. Use the map, current location, or manual coordinates.', state: 'error' });
    }
  }

  function handlePlaceSearchKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    void searchPlace();
  }

  return <div className="private-picker"><div className="map-toolbar"><div><strong>Place the private pin</strong><span>Search for a place, click the map, drag the pin, or type coordinates below.</span></div><button className="secondary-action" disabled={locationState === 'loading'} type="button" onClick={useCurrentLocation}>{locationState === 'loading' ? 'Locating…' : 'Use current location'}</button></div><div className="place-search" role="search"><label className="form-field"><span>Place name or address</span><input disabled={!googleKey || placeSearch.state === 'loading'} value={placeQuery} onChange={(event) => { setPlaceQuery(event.target.value); setPlaceSearch({ message: '', state: 'idle' }); }} onKeyDown={handlePlaceSearchKeyDown} placeholder={googleKey ? 'Example: Chatuchak Park, Bangkok' : 'Google place search is not configured'} /></label><button className="secondary-action" disabled={!googleKey || placeSearch.state === 'loading'} type="button" onClick={() => void searchPlace()}>{placeSearch.state === 'loading' ? 'Searching…' : 'Search'}</button></div>{googleKey ? <p className="place-search-note">Search is sent directly to Google Maps only when you submit it. PetRadar does not store your search history.</p> : <div className="feedback feedback-info" role="status">Place search needs a configured, referrer-restricted Google Maps browser key. Current location, map pin, and manual coordinates remain available.</div>}{placeSearch.message ? <div className={placeSearch.state === 'error' ? 'feedback feedback-error' : 'feedback feedback-info'} role={placeSearch.state === 'error' ? 'alert' : 'status'}>{placeSearch.message}</div> : null}{locationState === 'denied' ? <div className="feedback feedback-error" role="alert">Location access is unavailable or was denied. Place the pin or use the manual fields.</div> : null}<LeafletMap label="Private exact location picker" picked={picked} onPick={onChange} /><div className="privacy-note compact-note"><strong>Exact pin stays private</strong><span>PetRadar sends this point only in your authenticated create or edit request. Public viewers receive a separately generated approximate area.</span></div></div>;
}

async function geocodeAddress(
  maps: Awaited<ReturnType<typeof loadGoogleMaps>>,
  address: string,
): Promise<PickedLocation | null> {
  return new Promise((resolve, reject) => {
    const geocoder = new maps.Geocoder();
    geocoder.geocode({ address }, (results, status) => {
      if (status === 'ZERO_RESULTS') {
        resolve(null);
        return;
      }
      const location = results?.[0]?.geometry.location;
      if (status !== 'OK' || !location) {
        reject(new Error(`Google geocoding failed with status ${status}.`));
        return;
      }
      const latitude = location.lat();
      const longitude = location.lng();
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        reject(new Error('Google geocoding returned an invalid location.'));
        return;
      }
      resolve({ latitude, longitude });
    });
  });
}

function parseLocation(latitude: string, longitude: string): PickedLocation | null {
  const lat = Number(latitude);
  const lng = Number(longitude);
  if (!latitude || !longitude || !Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { latitude: lat, longitude: lng };
}
