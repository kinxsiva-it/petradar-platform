'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { GoogleMap } from '../../components/map/google-map';
import { LeafletMap } from '../../components/map/leaflet-map';
import type { MapPoint, MapPointTone, MapProvider } from '../../components/map/map-types';
import { BrandMark } from '../../components/layout/brand-mark';
import { ApiClientError } from '../../lib/api/http-client';
import { publicEnv } from '../../lib/config/env';
import { formatStatus } from '../../lib/formatting/display';
import { routes, sightingDetailRoute } from '../../lib/routes';
import type { AnimalCondition, AnimalSpecies } from '../sightings/sighting-types';
import { getPublicSighting } from '../sightings/sightings-api';
import type { PublicSighting } from '../sightings/sighting-types';
import {
  listMapSightings,
  listNearbySightings,
  type MapFilters,
  type PublicMapSighting,
} from './map-api';
import { findVeterinaryCare, loadVeterinaryPlaceDetails, type PlaceSearchCenter, type VeterinaryPlace } from './veterinary-places';

type MobileView = 'list' | 'map';
type NearMeState = 'active' | 'denied' | 'idle' | 'loading';

interface CurrentLocation {
  accuracy: number;
  latitude: number;
  longitude: number;
}

export function CommunityMap() {
  const [filters, setFilters] = useState<MapFilters>({});
  const [items, setItems] = useState<PublicMapSighting[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [provider, setProvider] = useState<MapProvider>('leaflet');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [nearMe, setNearMe] = useState<NearMeState>('idle');
  const [currentLocation, setCurrentLocation] = useState<CurrentLocation | null>(null);
  const [query, setQuery] = useState('');
  const [mobileView, setMobileView] = useState<MobileView>('map');
  const [mapCenter, setMapCenter] = useState<PlaceSearchCenter>({ latitude: 13.7563, longitude: 100.5018 });
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [previewDetail, setPreviewDetail] = useState<PublicSighting | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [veterinaryEnabled, setVeterinaryEnabled] = useState(false);
  const [veterinaryLoading, setVeterinaryLoading] = useState(false);
  const [veterinaryMessage, setVeterinaryMessage] = useState('');
  const [veterinaryPlaces, setVeterinaryPlaces] = useState<VeterinaryPlace[]>([]);
  const [selectedVeterinaryPlace, setSelectedVeterinaryPlace] = useState<VeterinaryPlace | null>(null);
  const veterinaryCacheRef = useRef(new Map<string, VeterinaryPlace[]>());
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  const load = useCallback(async (next: MapFilters) => {
    setLoading(true);
    setError('');
    setNearMe('idle');
    setCurrentLocation(null);
    try {
      setItems(await listMapSightings(next));
    } catch (loadError) {
      setError(toMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(filters);
  }, [filters, load]);

  const visibleItems = useMemo(() => filterByQuery(items, query), [items, query]);
  const selected = visibleItems.find((item) => item.id === selectedId) ?? null;
  const markers = useMemo<MapPoint[]>(() => {
    const publicMarkers = visibleItems.map((item) => ({
      id: item.id,
      latitude: item.latitude,
      longitude: item.longitude,
      radiusMeters: item.radiusMeters,
      radar: true,
      selected: item.id === selectedId,
      title: `${formatStatus(item.species)} · ${formatStatus(item.condition)} · approximate area`,
      tone: markerTone(item),
    }));
    if (!currentLocation) return publicMarkers;
    return [
      ...publicMarkers,
      {
        id: 'current-browser-location',
        interactive: false,
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        radiusMeters: Math.max(50, currentLocation.accuracy),
        radar: true,
        title: 'Your current browser location and accuracy radius',
        tone: 'blue' as const,
      },
    ];
  }, [currentLocation, selectedId, visibleItems]);

  const allMarkers = useMemo<MapPoint[]>(() => [
    ...markers,
    ...(veterinaryEnabled ? veterinaryPlaces.map((place) => ({
      id: `vet:${place.id}`,
      latitude: place.latitude,
      longitude: place.longitude,
      selected: place.id === selectedVeterinaryPlace?.id,
      title: place.name,
      tone: 'veterinary' as const,
    })) : []),
  ], [markers, selectedVeterinaryPlace?.id, veterinaryEnabled, veterinaryPlaces]);

  useEffect(() => {
    if (!previewId) {
      setPreviewDetail(null);
      return;
    }
    let active = true;
    setPreviewLoading(true);
    void getPublicSighting(previewId)
      .then((detail) => {
        if (active) setPreviewDetail(detail);
      })
      .catch(() => {
        if (active) setPreviewDetail(null);
      })
      .finally(() => {
        if (active) setPreviewLoading(false);
      });
    return () => { active = false; };
  }, [previewId]);

  useEffect(() => {
    const key = publicEnv.googleMapsApiKey;
    if (!veterinaryEnabled || !key) return;
    let active = true;
    const cacheKey = `places-new-v1:${mapCenter.latitude.toFixed(2)}:${mapCenter.longitude.toFixed(2)}`;
    const cached = veterinaryCacheRef.current.get(cacheKey);
    if (cached) {
      setVeterinaryPlaces(cached);
      setVeterinaryMessage('');
      setVeterinaryLoading(false);
      return;
    }
    setVeterinaryPlaces([]);
    setSelectedVeterinaryPlace(null);
    setVeterinaryLoading(true);
    setVeterinaryMessage('');
    const timer = window.setTimeout(() => {
      void findVeterinaryCare(key, mapCenter)
        .then((places) => {
          if (!active) return;
          veterinaryCacheRef.current.set(cacheKey, places);
          setVeterinaryPlaces(places);
          if (places.length === 0) setVeterinaryMessage('No veterinary care was found in this map area.');
        })
        .catch(() => {
          if (!active) return;
          setVeterinaryMessage('Veterinary care is temporarily unavailable. Animal reports are still available.');
        })
        .finally(() => { if (active) setVeterinaryLoading(false); });
    }, 700);
    return () => { active = false; window.clearTimeout(timer); };
  }, [mapCenter, veterinaryEnabled]);

  useEffect(() => {
    const previousAuthFailure = window.gm_authFailure;
    const handleAuthFailure = () => {
      setProvider('leaflet');
      setVeterinaryEnabled(false);
      setVeterinaryLoading(false);
      setVeterinaryPlaces([]);
      setSelectedVeterinaryPlace(null);
      setVeterinaryMessage('Google Maps is unavailable because its key, quota, or billing could not be authorized. Leaflet remains active.');
    };
    window.gm_authFailure = handleAuthFailure;
    return () => {
      if (window.gm_authFailure === handleAuthFailure) {
        window.gm_authFailure = previousAuthFailure;
      }
    };
  }, []);

  const handleGoogleUnavailable = useCallback(() => {
    setProvider('leaflet');
  }, []);

  const handleMapCenterChange = useCallback((center: PlaceSearchCenter) => {
    setMapCenter((current) => (
      current.latitude === center.latitude && current.longitude === center.longitude
        ? current
        : center
    ));
  }, []);

  function useNearMe() {
    setNearMe('loading');
    setError('');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = Number(position.coords.latitude.toFixed(5));
        const longitude = Number(position.coords.longitude.toFixed(5));
        setCurrentLocation({ accuracy: position.coords.accuracy, latitude, longitude });
        setMapCenter({ latitude, longitude });
        void listNearbySightings(latitude, longitude)
          .then((nearby) => {
            setItems(
              nearby.filter(
                (item) =>
                  (!filters.species || item.species === filters.species) &&
                  (!filters.condition || item.condition === filters.condition),
              ),
            );
            setSelectedId(null);
            setNearMe('active');
          })
          .catch((nearError: unknown) => {
            setError(toMessage(nearError));
            setNearMe('idle');
            setCurrentLocation(null);
          });
      },
      () => {
        setNearMe('denied');
        setCurrentLocation(null);
      },
      { enableHighAccuracy: false, maximumAge: 60_000, timeout: 10_000 },
    );
  }

  function selectReport(id: string) {
    setSelectedId(id);
    setSelectedVeterinaryPlace(null);
    setMobileView('map');
    if (window.matchMedia('(min-width: 721px)').matches) {
      restoreFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      setPreviewId(id);
    }
  }

  function selectMapPoint(id: string) {
    if (!id.startsWith('vet:')) {
      selectReport(id);
      return;
    }
    const place = veterinaryPlaces.find((candidate) => candidate.id === id.slice(4));
    if (!place) return;
    setSelectedId(null);
    setPreviewId(null);
    setSelectedVeterinaryPlace(place);
    const key = publicEnv.googleMapsApiKey;
    if (key) {
      void loadVeterinaryPlaceDetails(key, place)
        .then((detail) => {
          setSelectedVeterinaryPlace((current) => current?.id === detail.id ? detail : current);
        })
        .catch(() => undefined);
    }
  }

  function closePreview() {
    setPreviewId(null);
    window.setTimeout(() => {
      const card = selectedId ? document.querySelector<HTMLElement>(`[data-map-report-id="${CSS.escape(selectedId)}"]`) : null;
      const previous = restoreFocusRef.current;
      (previous?.isConnected ? previous : card)?.focus();
    }, 0);
  }

  return (
    <div className="page-container map-page map-redesign">
      <header className="map-hero">
        <span className="map-hero-paw map-hero-paw-one" aria-hidden="true"><MapUiIcon name="paw" /></span>
        <span className="map-hero-paw map-hero-paw-two" aria-hidden="true"><MapUiIcon name="paw" /></span>
        <span className="map-hero-heart" aria-hidden="true"><MapUiIcon name="heart" /></span>
        <div className="map-hero-copy">
          <span className="eyebrow">COMMUNITY DISCOVERY</span>
          <h1>Community Map</h1>
          <p>Explore nearby public sightings while exact locations stay private for everyone&apos;s safety.</p>
          <span className="privacy-chip"><MapUiIcon name="shield" />Approximate locations only</span>
        </div>
        <div className="map-hero-animals">
          <Image
            alt="A friendly dog and cat representing the PetRadar community"
            height={1086}
            priority
            sizes="(max-width: 720px) 65vw, 25rem"
            src="/images/map/community-map-hero-dog-and-cat.png"
            width={1448}
          />
        </div>
      </header>

      <section className="map-controls" aria-label="Map filters and settings">
        <label className="map-search-field">
          <span className="visually-hidden">Search public sightings</span>
          <MapUiIcon name="search" />
          <input
            type="search"
            placeholder="Search by species, condition, or status"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
            }}
          />
        </label>
        <label className="map-filter-field">
          <span>Species</span>
          <select
            value={filters.species ?? ''}
            onChange={(event) => {
              setSelectedId(null);
              setFilters((current) => ({ ...current, species: speciesValue(event.target.value) }));
            }}
          >
            <option value="">All species</option>
            <option value="CAT">Cats</option>
            <option value="DOG">Dogs</option>
            <option value="OTHER">Other</option>
          </select>
        </label>
        <label className="map-filter-field">
          <span>Condition</span>
          <select
            value={filters.condition ?? ''}
            onChange={(event) => {
              setSelectedId(null);
              setFilters((current) => ({ ...current, condition: conditionValue(event.target.value) }));
            }}
          >
            <option value="">All conditions</option>
            <option value="INJURED">Injured</option>
            <option value="NEEDS_RESCUE">Needs rescue</option>
            <option value="POSSIBLE_LOST_PET">Possible lost pet</option>
            <option value="NORMAL_STRAY">Normal stray</option>
          </select>
        </label>
        <button className={`map-near-button ${nearMe === 'active' ? 'active' : ''}`} disabled={nearMe === 'loading'} type="button" onClick={useNearMe}>
          <MapUiIcon name="pin" />
          {nearMe === 'loading' ? 'Finding nearby…' : nearMe === 'active' ? 'Within 5 km' : 'Near me'}
        </button>
        <details className="map-settings">
          <summary><MapUiIcon name="settings" />Map settings</summary>
          <div>
            <strong>Map provider</strong>
            <p>Leaflet is the dependable default.</p>
            <div className="provider-switch" role="group" aria-label="Map provider">
              <button className={provider === 'leaflet' ? 'active' : ''} type="button" onClick={() => { setProvider('leaflet'); }}>Leaflet</button>
              {publicEnv.googleMapsApiKey ? <button className={provider === 'google' ? 'active' : ''} type="button" onClick={() => { setProvider('google'); }}>Google 2D</button> : null}
            </div>
            {!publicEnv.googleMapsApiKey ? <span>Google 2D is unavailable without a restricted browser key.</span> : null}
          </div>
        </details>
      </section>

      <div className="map-mobile-switch" role="group" aria-label="Map display">
        <button aria-pressed={mobileView === 'map'} onClick={() => { setMobileView('map'); }} type="button"><MapUiIcon name="map" />Map</button>
        <button aria-pressed={mobileView === 'list'} onClick={() => { setMobileView('list'); }} type="button"><MapUiIcon name="list" />List <span>{visibleItems.length}</span></button>
      </div>

      {nearMe === 'denied' ? (
        <div className="map-state-banner map-state-warning" role="alert">
          <MapUiIcon name="pin" />
          <div><strong>Location access is unavailable</strong><span>The full privacy-safe map remains available. Allow location access to search within 5 km.</span></div>
        </div>
      ) : null}
      {error && items.length > 0 ? (
        <div className="map-state-banner map-state-error" role="alert">
          <MapUiIcon name="warning" />
          <div><strong>Could not refresh the map</strong><span>{error}</span></div>
          <button className="text-action" type="button" onClick={() => void load(filters)}>Try again</button>
        </div>
      ) : null}

      {loading ? (
        <MapLoadingState />
      ) : error && items.length === 0 ? (
        <MapErrorState message={error} retry={() => void load(filters)} />
      ) : visibleItems.length === 0 ? (
        <MapEmptyState clear={() => { setQuery(''); setFilters({}); }} />
      ) : (
        <section className={`community-map-layout map-mobile-${mobileView}`}>
          <div className="map-surface">
            {provider === 'google' ? (
              <GoogleMap markers={allMarkers} onCenterChange={handleMapCenterChange} onSelect={selectMapPoint} onUnavailable={handleGoogleUnavailable} />
            ) : (
              <LeafletMap label="Community approximate sighting map" markers={allMarkers} onCenterChange={handleMapCenterChange} onSelect={selectMapPoint} />
            )}
            <div className="map-layer-control map-desktop-only" aria-label="Map layers">
              <strong>Map layers</strong>
              <label><input checked disabled type="checkbox" />Animal reports</label>
              <label title={publicEnv.googleMapsApiKey ? undefined : 'Veterinary care requires the configured map provider.'}>
                <input
                  checked={veterinaryEnabled}
                  disabled={!publicEnv.googleMapsApiKey}
                  type="checkbox"
                  onChange={(event) => {
                    setVeterinaryEnabled(event.target.checked);
                    if (!event.target.checked) {
                      setSelectedVeterinaryPlace(null);
                      setVeterinaryMessage('');
                    }
                  }}
                />
                Veterinary care
              </label>
              {veterinaryLoading ? <span>Finding nearby care…</span> : null}
              {veterinaryEnabled && !veterinaryLoading && veterinaryPlaces.length > 0 ? (
                <span>{veterinaryPlaces.length} nearby locations</span>
              ) : null}
              {!publicEnv.googleMapsApiKey ? <span>Veterinary layer unavailable</span> : null}
            </div>
            <div className="map-legend" aria-label="Map legend">
              <strong>Map key</strong>
              <span><i className="map-dot map-dot-orange" />Dog</span>
              <span><i className="map-dot map-dot-purple" />Cat</span>
              <span><i className="map-dot map-dot-teal" />Other</span>
              <span><i className="map-dot map-dot-coral" />Urgent</span>
              {currentLocation ? <span><i className="map-dot map-dot-blue" />You</span> : null}
              {veterinaryEnabled ? <span><i className="map-dot map-dot-veterinary" />Vet care</span> : null}
            </div>
            <aside className="map-privacy-card">
              <MapUiIcon name="shield" />
              <span>Circles show approximate public areas to protect privacy. Exact locations are never shared.</span>
            </aside>
            {veterinaryMessage ? <div className="map-veterinary-message map-desktop-only" role="status">{veterinaryMessage}</div> : null}
            {selectedVeterinaryPlace ? <VeterinaryPlacePreview close={() => { setSelectedVeterinaryPlace(null); }} origin={currentLocation ?? mapCenter} place={selectedVeterinaryPlace} /> : null}
          </div>

          <aside className="map-results" aria-label="Public sighting results">
            <header>
              <div><strong>{visibleItems.length} public sighting{visibleItems.length === 1 ? '' : 's'}</strong><span>Select an area on the map or choose a report.</span></div>
              <span className="map-results-badge">Public-safe data</span>
            </header>
            <div className="map-result-list">
              {visibleItems.map((item) => (
                <MapResultCard item={item} key={item.id} selected={item.id === selected?.id} select={() => { selectReport(item.id); }} />
              ))}
            </div>
            <footer><Link className="primary-action" href={routes.reportAnimal}><MapUiIcon name="paw" />Report an animal</Link></footer>
          </aside>
        </section>
      )}

      {previewId && selected ? (
        <AnimalPreviewModal
          close={closePreview}
          detail={previewDetail}
          item={selected}
          loading={previewLoading}
        />
      ) : null}

      <p className="map-attribution-note">Leaflet/OpenStreetMap is the default. Google 2D appears only when a restricted browser key is configured. Google 3D is not part of the Next app.</p>
    </div>
  );
}

function MapResultCard({ item, select, selected }: { item: PublicMapSighting; select: () => void; selected: boolean }) {
  const thumbnail = safeMediaUrl(item.thumbnailUrl);
  return (
    <article className={`map-result-card map-card-${markerTone(item)} ${selected ? 'active' : ''}`}>
      <button aria-pressed={selected} className="map-result-select" data-map-report-id={item.id} type="button" onClick={select}>
        <span className="map-result-thumbnail">
          {thumbnail ? <img alt="" src={thumbnail} /> : <MapUiIcon name={item.species === 'CAT' ? 'cat' : item.species === 'DOG' ? 'dog' : 'paw'} />}
        </span>
        <span className="map-result-copy">
          <span className="map-result-title"><strong>{formatStatus(item.species)}</strong><i>·</i>{formatStatus(item.condition)}</span>
          <span className="map-result-meta">{formatDate(item.seenAt)} · {item.distanceMeters === null ? `Approx. ${Math.round(item.radiusMeters).toLocaleString()} m area` : `${formatDistance(item.distanceMeters)} away`}</span>
          <span className="map-result-badges">
            <i>{formatStatus(item.lifecycleStatus)}</i>
            <i>{formatStatus(item.verificationStatus)}</i>
            {item.urgency === 'HIGH' || item.urgency === 'EMERGENCY' ? <i className="urgent">{formatStatus(item.urgency)}</i> : null}
          </span>
        </span>
      </button>
      <Link href={sightingDetailRoute(item.id)}>View details <span aria-hidden="true">→</span></Link>
    </article>
  );
}

function AnimalPreviewModal({ close, detail, item, loading }: { close: () => void; detail: PublicSighting | null; item: PublicMapSighting; loading: boolean }) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        close();
        return;
      }
      if (event.key !== 'Tab') return;
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>('button, a[href], [tabindex]:not([tabindex="-1"])');
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => { document.removeEventListener('keydown', handleKeyDown); };
  }, [close]);

  const photo = safeMediaUrl(detail?.photoUrls[0] ?? item.thumbnailUrl);
  return (
    <div className="map-modal-backdrop map-desktop-only" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}>
      <div ref={dialogRef} aria-labelledby="map-animal-dialog-title" aria-modal="true" className="map-animal-modal" role="dialog">
        <button ref={closeRef} aria-label="Close animal preview" className="map-modal-close" type="button" onClick={close}>×</button>
        <div className="map-modal-photo">
          {photo ? <img alt="" src={photo} /> : <MapUiIcon name={item.species === 'DOG' ? 'dog' : item.species === 'CAT' ? 'cat' : 'paw'} />}
        </div>
        <div className="map-modal-content">
          <span className="eyebrow">PUBLIC ANIMAL REPORT</span>
          <h2 id="map-animal-dialog-title">{formatStatus(item.species)} · {formatStatus(item.condition)}</h2>
          <div className="map-modal-badges">
            <span>{formatStatus(item.lifecycleStatus)}</span>
            <span>{formatStatus(item.verificationStatus)}</span>
            {item.urgency === 'HIGH' || item.urgency === 'EMERGENCY' ? <span className="urgent">{formatStatus(item.urgency)}</span> : null}
          </div>
          <dl>
            <div><dt>Reported</dt><dd>{formatDate(item.seenAt)}</dd></div>
            <div><dt>Public area</dt><dd>Approx. {item.radiusMeters.toLocaleString()} m area</dd></div>
            {item.distanceMeters !== null ? <div><dt>Distance</dt><dd>{formatDistance(item.distanceMeters)} away</dd></div> : null}
            {detail?.color ? <div><dt>Color</dt><dd>{detail.color}</dd></div> : null}
          </dl>
          <p>{loading ? 'Loading public report details…' : detail?.description ?? 'No public description was provided.'}</p>
          <aside className="map-modal-privacy"><MapUiIcon name="shield" />This report uses an approximate public area. The exact location remains private.</aside>
          <Link className="primary-action" href={sightingDetailRoute(item.id)}>View details</Link>
        </div>
      </div>
    </div>
  );
}

function VeterinaryPlacePreview({ close, origin, place }: { close: () => void; origin: PlaceSearchCenter; place: VeterinaryPlace }) {
  const distance = haversineMeters(origin, place);
  const directions = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${place.latitude},${place.longitude}`)}&destination_place_id=${encodeURIComponent(place.id)}`;
  const telephone = place.phone?.replace(/[^+\d]/g, '') ?? null;
  return (
    <aside className="map-veterinary-card map-desktop-only" aria-label={`Veterinary care: ${place.name}`}>
      <button aria-label="Close veterinary care details" type="button" onClick={close}>×</button>
      <span className="map-veterinary-icon" aria-hidden="true">+</span>
      <div><span className="eyebrow">VETERINARY CARE</span><h2>{place.name}</h2></div>
      <p>{place.address}</p>
      <div className="map-veterinary-meta"><span>Approx. {formatDistance(distance)} away</span>{place.openNow === null ? null : <span>{place.openNow ? 'Open now' : 'Currently closed'}</span>}</div>
      <div className="map-veterinary-actions">
        <a className="primary-action" href={directions} rel="noreferrer" target="_blank">Get directions</a>
        {telephone ? <a className="secondary-action" href={`tel:${telephone}`}>Call</a> : null}
      </div>
    </aside>
  );
}

function MapLoadingState() {
  return <section className="map-workspace-state" aria-live="polite"><span className="map-state-icon"><MapUiIcon name="map" /></span><div><h2>Loading community sightings</h2><p>Preparing privacy-safe approximate areas near you…</p></div><span className="loading-pulse" /></section>;
}

function MapErrorState({ message, retry }: { message: string; retry: () => void }) {
  return <section className="map-workspace-state map-workspace-error"><span className="map-state-icon"><MapUiIcon name="warning" /></span><div><h2>The Community Map is unavailable</h2><p>{message}</p></div><button className="primary-action" type="button" onClick={retry}>Try again</button></section>;
}

function MapEmptyState({ clear }: { clear: () => void }) {
  return <section className="map-workspace-state"><span className="map-state-icon"><MapUiIcon name="search" /></span><div><h2>No sightings match these filters</h2><p>Try another search or clear the filters to explore all public approximate areas.</p></div><button className="secondary-action" type="button" onClick={clear}>Clear filters</button></section>;
}

type MapIconName = 'cat' | 'dog' | 'heart' | 'list' | 'map' | 'paw' | 'pin' | 'search' | 'settings' | 'shield' | 'warning';

function MapUiIcon({ name }: { name: MapIconName }) {
  if (name === 'heart') return <svg className="map-ui-icon" aria-hidden="true" viewBox="0 0 24 24"><path d="M20.8 5.8a5.5 5.5 0 0 0-7.8 0L12 6.9l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 22l8.8-8.4a5.5 5.5 0 0 0 0-7.8Z" /></svg>;
  if (name === 'pin') return <svg className="map-ui-icon" aria-hidden="true" viewBox="0 0 24 24"><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></svg>;
  if (name === 'search') return <svg className="map-ui-icon" aria-hidden="true" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>;
  if (name === 'shield') return <svg className="map-ui-icon" aria-hidden="true" viewBox="0 0 24 24"><path d="M12 3 20 6v6c0 5-3.4 8.2-8 10-4.6-1.8-8-5-8-10V6z" /><path d="m9 12 2 2 4-4" /></svg>;
  if (name === 'settings') return <svg className="map-ui-icon" aria-hidden="true" viewBox="0 0 24 24"><path d="M12 2.75v2.1M12 19.15v2.1M4.25 12h-2.1M21.85 12h-2.1M5.8 5.8 4.3 4.3M19.7 19.7l-1.5-1.5M18.2 5.8l1.5-1.5M4.3 19.7l1.5-1.5" /><circle cx="12" cy="12" r="5.1" /><circle cx="12" cy="12" r="1.8" /></svg>;
  if (name === 'map') return <svg className="map-ui-icon" aria-hidden="true" viewBox="0 0 24 24"><path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3zM9 3v15M15 6v15" /></svg>;
  if (name === 'list') return <svg className="map-ui-icon" aria-hidden="true" viewBox="0 0 24 24"><path d="M9 6h11M9 12h11M9 18h11" /><circle cx="4" cy="6" r="1" /><circle cx="4" cy="12" r="1" /><circle cx="4" cy="18" r="1" /></svg>;
  if (name === 'warning') return <svg className="map-ui-icon" aria-hidden="true" viewBox="0 0 24 24"><path d="M12 3 2 21h20zM12 9v5M12 18h.01" /></svg>;
  if (name === 'cat') return <svg className="map-ui-icon" aria-hidden="true" viewBox="0 0 24 24"><path d="M6 10 5 4l4 3a8 8 0 0 1 6 0l4-3-1 6a7 7 0 1 1-12 0Z" /><path d="M9 14h.01M15 14h.01M10 17c1.2 1 2.8 1 4 0" /></svg>;
  if (name === 'dog') return <svg className="map-ui-icon" aria-hidden="true" viewBox="0 0 24 24"><path d="M7 8 3 5v7l3 2M17 8l4-3v7l-3 2M7 8a7 7 0 1 1 10 0M9 14h.01M15 14h.01M10 17c1.2 1 2.8 1 4 0" /></svg>;
  return <BrandMark />;
}

function filterByQuery(items: readonly PublicMapSighting[], query: string): PublicMapSighting[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [...items];
  return items.filter((item) => [item.species, item.condition, item.lifecycleStatus, item.urgency, item.verificationStatus].some((value) => formatStatus(value).toLowerCase().includes(normalized)));
}

function markerTone(item: PublicMapSighting): MapPointTone {
  if (item.urgency === 'HIGH' || item.urgency === 'EMERGENCY' || item.condition === 'INJURED' || item.condition === 'NEEDS_RESCUE') return 'coral';
  if (item.species === 'DOG') return 'orange';
  if (item.species === 'CAT') return 'purple';
  return 'teal';
}

function safeMediaUrl(value: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value, publicEnv.apiBaseUrl);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : null;
  } catch {
    return null;
  }
}

function speciesValue(value: string): AnimalSpecies | undefined {
  return value === 'CAT' || value === 'DOG' || value === 'OTHER' ? value : undefined;
}

function conditionValue(value: string): AnimalCondition | undefined {
  return value === 'INJURED' || value === 'NEEDS_RESCUE' || value === 'POSSIBLE_LOST_PET' || value === 'NORMAL_STRAY' ? value : undefined;
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatDistance(value: number): string {
  return value < 1000 ? `${String(Math.round(value))} m` : `${(value / 1000).toFixed(1)} km`;
}

function haversineMeters(origin: PlaceSearchCenter, destination: PlaceSearchCenter): number {
  const earthRadius = 6_371_000;
  const latitudeDelta = radians(destination.latitude - origin.latitude);
  const longitudeDelta = radians(destination.longitude - origin.longitude);
  const originLatitude = radians(origin.latitude);
  const destinationLatitude = radians(destination.latitude);
  const chord = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(originLatitude) * Math.cos(destinationLatitude) * Math.sin(longitudeDelta / 2) ** 2;
  return earthRadius * 2 * Math.atan2(Math.sqrt(chord), Math.sqrt(1 - chord));
}

function radians(value: number): number {
  return value * (Math.PI / 180);
}

function toMessage(error: unknown): string {
  return error instanceof ApiClientError ? error.message : 'The community map could not be loaded.';
}
