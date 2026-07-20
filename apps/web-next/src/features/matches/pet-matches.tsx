'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { ApiClientError } from '../../lib/api/http-client';
import { formatSpecies, formatStatus } from '../../lib/formatting/display';
import { routes } from '../../lib/routes';
import { useAuth } from '../auth/use-auth';
import { getMyLostPet, type OwnerLostPet } from '../lost-pets/owner-lost-pets-api';
import { WorkspaceState } from '../sightings/my-reports';
import {
  listMatchesForLostPet,
  runMatchingForLostPet,
  type MatchLevel,
  type MatchResult,
} from './matches-api';
import { MatchCard } from './matches-overview';

export function PetMatches({ lostPetId }: { lostPetId: string }) {
  const auth = useAuth();
  const [pet, setPet] = useState<OwnerLostPet | null>(null);
  const [items, setItems] = useState<MatchResult[]>([]);
  const [filter, setFilter] = useState<'ALL' | MatchLevel>('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [matching, setMatching] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [actionError, setActionError] = useState('');
  const matchingRequestInFlightRef = useRef(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [ownerPet, matches] = await Promise.all([
        getMyLostPet(auth.authenticatedRequest, lostPetId),
        listMatchesForLostPet(auth.authenticatedRequest, lostPetId),
      ]);
      setPet(ownerPet);
      setItems(matches);
    } catch (loadError) {
      setPet(null);
      setItems([]);
      setError(
        loadError instanceof ApiClientError &&
          (loadError.status === 403 || loadError.status === 404)
          ? 'This lost-pet post is unavailable in your owner workspace.'
          : 'Matches for this lost pet could not be loaded.',
      );
    } finally {
      setLoading(false);
    }
  }, [auth.authenticatedRequest, lostPetId]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(
    () =>
      items.filter(
        (item) => item.lostPet.id === lostPetId && (filter === 'ALL' || item.level === filter),
      ),
    [filter, items, lostPetId],
  );

  async function runMatching() {
    if (matchingRequestInFlightRef.current || !pet) return;
    matchingRequestInFlightRef.current = true;
    setMatching(true);
    setFeedback('');
    setActionError('');
    try {
      await runMatchingForLostPet(auth.authenticatedRequest, pet.id);
      setItems(await listMatchesForLostPet(auth.authenticatedRequest, pet.id));
      setFeedback('Matching completed and the results were refreshed.');
    } catch (runError) {
      setActionError(
        runError instanceof ApiClientError
          ? runError.message
          : 'Matching could not be run. Please try again.',
      );
    } finally {
      matchingRequestInFlightRef.current = false;
      setMatching(false);
    }
  }

  if (loading)
    return (
      <div className="page-container">
        <WorkspaceState loading title="Loading pet matches…" />
      </div>
    );
  if (error || !pet)
    return (
      <div className="page-container">
        <WorkspaceState
          title="Pet matches unavailable"
          description={error}
          action={
            <button className="primary-action" onClick={() => void load()} type="button">
              Try again
            </button>
          }
        />
      </div>
    );

  return (
    <div className="page-container workspace-page">
      <header className="page-heading">
        <div>
          <span className="eyebrow">Matches for {formatSpecies(pet.species)}</span>
          <h1>{pet.name}</h1>
          <p>
            {pet.breed ?? 'Breed not specified'}
            {pet.color ? ` · ${pet.color}` : ''} · {formatStatus(pet.status)}
          </p>
        </div>
        <div className="card-actions">
          <Link className="secondary-action" href={routes.myLostPets}>
            Back to My Lost Pets
          </Link>
          <button
            className="primary-action"
            disabled={matching}
            onClick={() => void runMatching()}
            type="button"
          >
            {matching ? 'Running matching…' : 'Run matching'}
          </button>
        </div>
      </header>
      <aside className="privacy-note">
        <strong>Owner-only matching</strong>
        <span>
          Only matches returned for this owned lost-pet ID are displayed. Exact locations and
          private contact fields are not rendered.
        </span>
      </aside>
      {feedback ? (
        <div className="feedback feedback-success" role="status">
          {feedback}
        </div>
      ) : null}
      {actionError ? (
        <div className="feedback feedback-error" role="alert">
          {actionError}
        </div>
      ) : null}
      <div className="tabs" aria-label="Match level filters">
        {(['ALL', 'HIGH', 'MEDIUM', 'LOW'] as const).map((value) => (
          <button
            className={filter === value ? 'active' : ''}
            key={value}
            onClick={() => { setFilter(value); }}
            type="button"
          >
            {formatStatus(value)}
          </button>
        ))}
      </div>
      {filtered.length === 0 ? (
        <WorkspaceState
          title="No matches found"
          description={
            items.length === 0
              ? 'No candidate sightings are currently available for this lost pet.'
              : 'No matches meet this level filter.'
          }
        />
      ) : (
        <section className="match-list">
          {filtered.map((item) => (
            <MatchCard item={item} key={item.id} />
          ))}
        </section>
      )}
    </div>
  );
}
