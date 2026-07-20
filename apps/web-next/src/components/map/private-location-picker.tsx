'use client';

import {
  type KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { publicEnv } from '../../lib/config/env';
import { loadGoogleMaps, type GooglePlace } from './google-maps-loader';
import { LeafletMap } from './leaflet-map';
import type { PickedLocation } from './map-types';

interface PlaceSuggestion {
  id: string;
  place: GooglePlace;
  primary: string;
  secondary: string;
}

type SearchState = 'idle' | 'loading' | 'empty' | 'error' | 'success';

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
  const [placeLabel, setPlaceLabel] = useState('');
  const [placeSearch, setPlaceSearch] = useState<{ message: string; state: SearchState }>({ message: '', state: 'idle' });
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const searchRequestRef = useRef(0);
  const picked = useMemo(() => parseLocation(latitude, longitude), [latitude, longitude]);
  const googleKey = publicEnv.googleMapsApiKey;
  const dropdownOpen = placeQuery.trim().length >= 2
    && (placeSearch.state === 'loading' || placeSearch.state === 'empty' || placeSearch.state === 'success');

  useEffect(() => {
    const query = placeQuery.trim();
    if (!googleKey || query.length < 2) {
      searchRequestRef.current += 1;
      setSuggestions([]);
      setActiveSuggestion(-1);
      setPlaceSearch({ message: '', state: 'idle' });
      return;
    }

    const requestId = searchRequestRef.current + 1;
    searchRequestRef.current = requestId;
    setPlaceSearch({ message: 'Searching places...', state: 'loading' });
    const timer = window.setTimeout(() => {
      void findPlaces(googleKey, query).then((results) => {
        if (searchRequestRef.current !== requestId) return;
        setSuggestions(results);
        setActiveSuggestion(results.length ? 0 : -1);
        setPlaceSearch(results.length
          ? { message: '', state: 'success' }
          : { message: 'No locations found. Try a more specific place or address.', state: 'empty' });
      }).catch(() => {
        if (searchRequestRef.current !== requestId) return;
        setSuggestions([]);
        setActiveSuggestion(-1);
        setPlaceSearch({ message: 'Place search is unavailable right now. Use the map, current location, or manual coordinates.', state: 'error' });
      });
    }, 350);

    return () => window.clearTimeout(timer);
  }, [googleKey, placeQuery]);

  function updateLocation(location: PickedLocation, label = '') {
    onChange(location);
    setPlaceLabel(label);
  }

  function useCurrentLocation() {
    if (!navigator.geolocation) { setLocationState('denied'); return; }
    setLocationState('loading');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        updateLocation({
          latitude: Number(position.coords.latitude.toFixed(6)),
          longitude: Number(position.coords.longitude.toFixed(6)),
        }, 'Current location');
        setLocationState('idle');
      },
      () => setLocationState('denied'),
      { enableHighAccuracy: true, maximumAge: 30_000, timeout: 10_000 },
    );
  }

  async function selectSuggestion(suggestion: PlaceSuggestion) {
    const requestId = searchRequestRef.current + 1;
    searchRequestRef.current = requestId;
    setSuggestions([]);
    setActiveSuggestion(-1);
    setPlaceSearch({ message: 'Loading selected place...', state: 'loading' });
    try {
      await suggestion.place.fetchFields({ fields: ['displayName', 'formattedAddress', 'location'] });
      if (searchRequestRef.current !== requestId) return;
      const location = suggestion.place.location;
      if (!location) throw new Error('The selected place did not include a location.');
      const label = suggestion.place.displayName?.trim()
        || suggestion.place.formattedAddress?.trim()
        || [suggestion.primary, suggestion.secondary].filter(Boolean).join(', ');
      updateLocation({ latitude: location.lat(), longitude: location.lng() }, label);
      setPlaceQuery('');
      setPlaceSearch({ message: 'Private pin moved. Review the map and confirm this location below.', state: 'success' });
    } catch {
      if (searchRequestRef.current !== requestId) return;
      setPlaceSearch({ message: 'Place details are unavailable. Try another result or use the map.', state: 'error' });
    }
  }

  function selectFirstSuggestion() {
    const suggestion = suggestions[activeSuggestion] ?? suggestions[0];
    if (suggestion) void selectSuggestion(suggestion);
  }

  function handlePlaceSearchKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveSuggestion((current) => suggestions.length ? (current + 1) % suggestions.length : -1);
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveSuggestion((current) => suggestions.length ? (current <= 0 ? suggestions.length - 1 : current - 1) : -1);
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      searchRequestRef.current += 1;
      setSuggestions([]);
      setActiveSuggestion(-1);
      setPlaceSearch({ message: '', state: 'idle' });
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      selectFirstSuggestion();
    }
  }

  return (
    <div className="private-picker lost-pet-private-picker">
      <div className="map-toolbar">
        <div>
          <strong>Place the private pin</strong>
          <span>Search for a place, click the map, drag the pin, or type coordinates below.</span>
        </div>
        <button className="secondary-action" disabled={locationState === 'loading'} type="button" onClick={useCurrentLocation}>
          <LocationIcon />{locationState === 'loading' ? 'Locating...' : 'Use current location'}
        </button>
      </div>

      <div className="place-search place-search-autocomplete" role="search">
        <div className="form-field place-search-field">
          <label htmlFor="private-place-search">Address or place name</label>
          <div className="place-search-input-wrap">
            <SearchIcon />
            <input
              aria-activedescendant={activeSuggestion >= 0 ? `place-option-${String(activeSuggestion)}` : undefined}
              aria-autocomplete="list"
              aria-controls="place-search-results"
              aria-expanded={dropdownOpen}
              autoComplete="off"
              disabled={!googleKey}
              id="private-place-search"
              role="combobox"
              value={placeQuery}
              onChange={(event) => {
                setPlaceQuery(event.target.value);
                setPlaceLabel('');
              }}
              onKeyDown={handlePlaceSearchKeyDown}
              placeholder={googleKey ? 'Search a place, landmark, district, or address' : 'Google place search is not configured'}
            />
            {placeSearch.state === 'loading' ? <span className="place-search-spinner" aria-label="Searching places" /> : null}
          </div>
          {dropdownOpen ? (
            <div className="place-search-dropdown" id="place-search-results" role="listbox">
              {suggestions.map((suggestion, index) => (
                <button
                  aria-selected={index === activeSuggestion}
                  className={index === activeSuggestion ? 'active' : ''}
                  id={`place-option-${String(index)}`}
                  key={suggestion.id}
                  role="option"
                  type="button"
                  onMouseDown={(event) => {
                    event.preventDefault();
                    void selectSuggestion(suggestion);
                  }}
                  onClick={() => void selectSuggestion(suggestion)}
                >
                  <LocationIcon />
                  <span><strong>{suggestion.primary}</strong><small>{suggestion.secondary || 'Location result'}</small></span>
                </button>
              ))}
              {!suggestions.length && placeSearch.state !== 'loading' ? (
                <p>{placeSearch.message}</p>
              ) : null}
            </div>
          ) : null}
        </div>
        <button className="secondary-action" disabled={!suggestions.length || placeSearch.state === 'loading'} type="button" onClick={selectFirstSuggestion}>
          Select place
        </button>
      </div>

      {googleKey ? (
        <p className="place-search-note">Suggestions are requested directly from Google Maps. PetRadar does not store your search history.</p>
      ) : (
        <div className="feedback feedback-info" role="status">Place search needs a configured, referrer-restricted Google Maps browser key. Current location, map pin, and manual coordinates remain available.</div>
      )}
      {placeLabel ? <div className="selected-place-label" role="status"><LocationIcon /><span><small>Selected place</small><strong>{placeLabel}</strong></span></div> : null}
      {placeSearch.state === 'error' ? <div className="feedback feedback-error" role="alert">{placeSearch.message}</div> : null}
      {locationState === 'denied' ? <div className="feedback feedback-error" role="alert">Location access is unavailable or was denied. Place the pin or use the manual fields.</div> : null}

      <LeafletMap
        followPicked
        label="Private exact location picker"
        picked={picked}
        onPick={(location) => updateLocation(location)}
      />
      <div className="privacy-note compact-note">
        <strong>Exact pin stays private</strong>
        <span>PetRadar sends this point only in your authenticated create or edit request. Public viewers receive a separately generated approximate area.</span>
      </div>
    </div>
  );
}

async function findPlaces(key: string, query: string): Promise<PlaceSuggestion[]> {
  const maps = await loadGoogleMaps(key);
  const places = await maps.importLibrary('places');
  const response = await places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
    includedRegionCodes: ['th'],
    input: query,
    origin: { lat: 13.7563, lng: 100.5018 },
    region: 'th',
    sessionToken: new places.AutocompleteSessionToken(),
  });
  return response.suggestions
    .map((suggestion) => suggestion.placePrediction)
    .filter((prediction) => prediction !== undefined)
    .slice(0, 5)
    .map((prediction) => ({
      id: prediction.placeId,
      place: prediction.toPlace(),
      primary: prediction.mainText?.text ?? prediction.text.text,
      secondary: prediction.secondaryText?.text ?? 'Google Places result',
    }));
}

function parseLocation(latitude: string, longitude: string): PickedLocation | null {
  const lat = Number(latitude);
  const lng = Number(longitude);
  if (!latitude || !longitude || !Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { latitude: lat, longitude: lng };
}

function LocationIcon() {
  return <svg aria-hidden="true" className="picker-inline-icon" focusable="false" viewBox="0 0 24 24"><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></svg>;
}

function SearchIcon() {
  return <svg aria-hidden="true" className="picker-inline-icon" focusable="false" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>;
}
