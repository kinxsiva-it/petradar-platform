'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

import { ApiClientError } from '../../lib/api/http-client';
import { publicEnv } from '../../lib/config/env';
import { formatDate, formatSpecies, formatStatus } from '../../lib/formatting/display';
import { routes } from '../../lib/routes';
import { WorkspaceState } from './my-reports';
import { getPublicSighting } from './sightings-api';
import type { PublicSighting } from './sighting-types';

export function PublicSightingDetail({ id }: { id: string }) {
  const [sighting, setSighting] = useState<PublicSighting | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'not-found' | 'error'>('loading');

  const load = useCallback(async () => {
    setState('loading');
    try {
      setSighting(await getPublicSighting(id));
      setState('ready');
    } catch (error) {
      setSighting(null);
      setState(error instanceof ApiClientError && error.status === 404 ? 'not-found' : 'error');
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  if (state === 'loading')
    return (
      <div className="page-container">
        <WorkspaceState loading title="Loading sighting…" />
      </div>
    );
  if (state === 'not-found')
    return (
      <div className="page-container">
        <WorkspaceState
          title="Sighting not found"
          description="This public sighting may have been removed or is not available."
          action={
            <Link className="primary-action" href={routes.map}>
              Back to Community Map
            </Link>
          }
        />
      </div>
    );
  if (state === 'error' || !sighting)
    return (
      <div className="page-container">
        <WorkspaceState
          title="Sighting unavailable"
          description="The sighting could not be loaded. Please try again."
          action={
            <button className="primary-action" onClick={() => void load()} type="button">
              Try again
            </button>
          }
        />
      </div>
    );

  return (
    <div className="page-container workspace-page public-sighting-page">
      <header className="page-heading">
        <div>
          <span className="eyebrow">Public sighting · {sighting.id.slice(0, 8).toUpperCase()}</span>
          <h1>
            {sighting.color ?? 'Unknown color'} {formatSpecies(sighting.species).toLowerCase()}
          </h1>
          <p>{sighting.description ?? 'No public description was provided.'}</p>
        </div>
        <Link className="primary-action" href={routes.map}>
          Back to Community Map
        </Link>
      </header>

      {sighting.photoUrls.length > 0 ? (
        <section className="public-sighting-photos" aria-label="Public sighting photos">
          {sighting.photoUrls.map((url, index) => (
            <img
              alt={`${formatSpecies(sighting.species)} sighting photo ${String(index + 1)}`}
              key={url}
              src={publicMediaUrl(url)}
            />
          ))}
        </section>
      ) : (
        <section className="public-sighting-photo-empty" aria-label="No public photos">
          No public photos are available for this sighting.
        </section>
      )}

      <section className="comparison-grid">
        <article className="detail-card">
          <span className="eyebrow">Observation</span>
          <dl className="detail-list">
            <div>
              <dt>Seen</dt>
              <dd>{formatDate(sighting.seenAt)}</dd>
            </div>
            <div>
              <dt>Animals</dt>
              <dd>{sighting.animalCount}</dd>
            </div>
            <div>
              <dt>Condition</dt>
              <dd>{formatStatus(sighting.condition)}</dd>
            </div>
            <div>
              <dt>Urgency</dt>
              <dd>{formatStatus(sighting.urgency)}</dd>
            </div>
          </dl>
        </article>
        <article className="detail-card">
          <span className="eyebrow">Appearance</span>
          <dl className="detail-list">
            <div>
              <dt>Species</dt>
              <dd>{formatSpecies(sighting.species)}</dd>
            </div>
            <div>
              <dt>Color</dt>
              <dd>{sighting.color ?? 'Not specified'}</dd>
            </div>
            <div>
              <dt>Pattern</dt>
              <dd>{sighting.pattern ?? 'Not specified'}</dd>
            </div>
            <div>
              <dt>Collar</dt>
              <dd>{formatStatus(sighting.collarStatus)}</dd>
            </div>
          </dl>
        </article>
        <article className="detail-card">
          <span className="eyebrow">Public status</span>
          <dl className="detail-list">
            <div>
              <dt>Lifecycle</dt>
              <dd>{formatStatus(sighting.lifecycleStatus)}</dd>
            </div>
            <div>
              <dt>Verification</dt>
              <dd>{formatStatus(sighting.verificationStatus)}</dd>
            </div>
            <div>
              <dt>Location</dt>
              <dd>Approximate area within {sighting.publicRadiusMeters.toLocaleString()} m</dd>
            </div>
          </dl>
        </article>
      </section>

      <aside className="privacy-note">
        <strong>Approximate location only</strong>
        <span>
          PetRadar intentionally shows a privacy-safe public area. The reporter’s identity, contact
          details, and exact coordinates are not included on this page.
        </span>
      </aside>
    </div>
  );
}

function publicMediaUrl(value: string): string {
  if (!value.startsWith('/')) return value;
  try {
    return new URL(value, publicEnv.apiBaseUrl).toString();
  } catch {
    return value;
  }
}
