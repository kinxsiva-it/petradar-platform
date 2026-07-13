'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { GoogleMap } from '../../components/map/google-map';
import { LeafletMap } from '../../components/map/leaflet-map';
import type { MapProvider } from '../../components/map/map-types';
import { ApiClientError } from '../../lib/api/http-client';
import { publicEnv } from '../../lib/config/env';
import { formatStatus } from '../../lib/formatting/display';
import type { AnimalCondition, AnimalSpecies } from '../sightings/sighting-types';
import { listMapSightings, listNearbySightings, type MapFilters, type PublicMapSighting } from './map-api';

export function CommunityMap() {
  const [filters, setFilters] = useState<MapFilters>({});
  const [items, setItems] = useState<PublicMapSighting[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [provider, setProvider] = useState<MapProvider>('leaflet');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [nearMe, setNearMe] = useState<'idle' | 'loading' | 'active' | 'denied'>('idle');

  const load = useCallback(async (next: MapFilters) => {
    setLoading(true); setError(''); setNearMe('idle');
    try { setItems(await listMapSightings(next)); }
    catch (loadError) { setError(toMessage(loadError)); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(filters); }, [filters, load]);
  const selected = items.find((item) => item.id === selectedId) ?? null;
  const markers = useMemo(() => items.map((item) => ({ id: item.id, latitude: item.latitude, longitude: item.longitude, radiusMeters: item.radiusMeters, title: `${formatStatus(item.species)} sighting` })), [items]);

  function useNearMe() {
    if (!navigator.geolocation) { setNearMe('denied'); return; }
    setNearMe('loading'); setError('');
    navigator.geolocation.getCurrentPosition(
      (position) => { void listNearbySightings(Number(position.coords.latitude.toFixed(5)), Number(position.coords.longitude.toFixed(5))).then((nearby) => { setItems(nearby.filter((item) => (!filters.species || item.species === filters.species) && (!filters.condition || item.condition === filters.condition))); setSelectedId(null); setNearMe('active'); }).catch((nearError) => { setError(toMessage(nearError)); setNearMe('idle'); }); },
      () => setNearMe('denied'),
      { enableHighAccuracy: false, maximumAge: 60_000, timeout: 10_000 },
    );
  }

  return <div className="page-container map-page"><header className="page-heading"><div><span className="eyebrow">Community discovery</span><h1>Community Map</h1><p>Explore public approximate sighting areas. Circles show uncertainty—not an animal’s exact location.</p></div><span className="privacy-chip">Approximate locations only</span></header><section className="map-controls" aria-label="Map controls"><label className="form-field"><span>Species</span><select value={filters.species ?? ''} onChange={(event) => setFilters((current) => ({ ...current, species: speciesValue(event.target.value) }))}><option value="">All species</option><option value="CAT">Cats</option><option value="DOG">Dogs</option><option value="OTHER">Other</option></select></label><label className="form-field"><span>Condition</span><select value={filters.condition ?? ''} onChange={(event) => setFilters((current) => ({ ...current, condition: conditionValue(event.target.value) }))}><option value="">All conditions</option><option value="INJURED">Injured</option><option value="NEEDS_RESCUE">Needs rescue</option><option value="POSSIBLE_LOST_PET">Possible lost pet</option><option value="NORMAL_STRAY">Normal stray</option></select></label><button className="secondary-action" disabled={nearMe === 'loading'} type="button" onClick={useNearMe}>{nearMe === 'loading' ? 'Finding nearby…' : nearMe === 'active' ? 'Showing within 5 km' : 'Near me'}</button><div className="provider-switch" role="group" aria-label="Map provider"><button className={provider === 'leaflet' ? 'active' : ''} type="button" onClick={() => setProvider('leaflet')}>Leaflet</button>{publicEnv.googleMapsApiKey ? <button className={provider === 'google' ? 'active' : ''} type="button" onClick={() => setProvider('google')}>Google 2D</button> : null}</div></section>{nearMe === 'denied' ? <div className="feedback feedback-error" role="alert">Location access is unavailable or denied. The full privacy-safe map remains available.</div> : null}{error ? <div className="feedback feedback-error" role="alert">{error} <button className="text-action" type="button" onClick={() => void load(filters)}>Try again</button></div> : null}{loading ? <section className="loading-state workspace-state" aria-live="polite"><span className="loading-pulse" /><p>Loading approximate sighting areas…</p></section> : items.length === 0 ? <section className="empty-state"><span aria-hidden="true">◎</span><h2>No sightings match these filters</h2><p>Clear a filter or return later as the community adds reports.</p><button className="secondary-action" type="button" onClick={() => setFilters({})}>Clear filters</button></section> : <section className="community-map-layout"><div className="map-surface">{provider === 'google' ? <GoogleMap markers={markers} onSelect={setSelectedId} onUnavailable={() => setProvider('leaflet')} /> : <LeafletMap label="Community approximate sighting map" markers={markers} onSelect={setSelectedId} />}</div><aside className="map-results" aria-label="Map results"><header><strong>{items.length} public sighting{items.length === 1 ? '' : 's'}</strong><span>Select an area for details</span></header><div>{items.map((item) => <button className={item.id === selectedId ? 'map-result active' : 'map-result'} key={item.id} type="button" onClick={() => setSelectedId(item.id)}><span className="map-result-icon" aria-hidden="true">{item.species === 'DOG' ? '🐕' : item.species === 'CAT' ? '🐈' : '🐾'}</span><span><strong>{formatStatus(item.species)} · {formatStatus(item.condition)}</strong><small>{new Date(item.seenAt).toLocaleDateString()} · Approx. {Math.round(item.radiusMeters)} m radius{item.distanceMeters === null ? '' : ` · ${formatDistance(item.distanceMeters)} away`}</small></span></button>)}</div></aside>{selected ? <article className="map-detail" aria-live="polite"><button aria-label="Close sighting details" type="button" onClick={() => setSelectedId(null)}>×</button><span className="eyebrow">Public sighting area</span><h2>{formatStatus(selected.species)}</h2><dl className="detail-list"><div><dt>Condition</dt><dd>{formatStatus(selected.condition)}</dd></div><div><dt>Urgency</dt><dd>{formatStatus(selected.urgency)}</dd></div><div><dt>Status</dt><dd>{formatStatus(selected.lifecycleStatus)}</dd></div><div><dt>Area</dt><dd>Approx. {Math.round(selected.radiusMeters)} m radius</dd></div></dl><p className="privacy-note">This panel intentionally omits exact coordinates and reporter contact.</p></article> : null}</section>}<p className="map-attribution-note">Leaflet/OpenStreetMap is the default. Google 2D appears only when a restricted browser key is configured. Google 3D is not part of the Next app.</p></div>;
}

function speciesValue(value: string): AnimalSpecies | undefined { return value === 'CAT' || value === 'DOG' || value === 'OTHER' ? value : undefined; }
function conditionValue(value: string): AnimalCondition | undefined { return value === 'INJURED' || value === 'NEEDS_RESCUE' || value === 'POSSIBLE_LOST_PET' || value === 'NORMAL_STRAY' ? value : undefined; }
function formatDistance(value: number): string { return value < 1000 ? `${Math.round(value)} m` : `${(value / 1000).toFixed(1)} km`; }
function toMessage(error: unknown): string { return error instanceof ApiClientError ? error.message : 'The community map could not be loaded.'; }
