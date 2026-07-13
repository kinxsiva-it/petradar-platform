'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

import { formatDate, formatStatus } from '../../lib/formatting/display';
import { matchDetailRoute, routes } from '../../lib/routes';
import { useAuth } from '../auth/use-auth';
import { WorkspaceState } from '../sightings/my-reports';
import { listMatches, type MatchResult, type MatchReviewStatus } from './matches-api';

export function MatchesOverview() {
  const auth = useAuth(); const [items,setItems] = useState<MatchResult[]>([]); const [filter,setFilter] = useState<'ALL'|MatchReviewStatus>('ALL'); const [loading,setLoading]=useState(true); const [error,setError]=useState('');
  const load = useCallback(async () => { setLoading(true); setError(''); try { setItems((await listMatches(auth.authenticatedRequest, filter === 'ALL' ? undefined : filter)).items); } catch { setError('Possible matches could not be loaded.'); } finally { setLoading(false); } }, [auth.authenticatedRequest,filter]);
  useEffect(() => { void load(); },[load]);
  return <div className="page-container workspace-page"><header className="page-heading"><div><span className="eyebrow">PetRadar matches</span><h1>Possible Matches</h1><p>Compare your lost-pet posts with public sightings using privacy-safe evidence.</p></div><Link className="primary-action" href={routes.myLostPets}>View My Lost Pets</Link></header><div className="tabs" aria-label="Match filters">{(['ALL','PENDING','CONFIRMED','REJECTED'] as const).map((value) => <button className={filter === value ? 'active' : ''} key={value} onClick={() => setFilter(value)} type="button">{formatStatus(value)}</button>)}</div>{loading ? <WorkspaceState loading title="Loading possible matches…" /> : error ? <WorkspaceState title="Matches unavailable" description={error} /> : items.length === 0 ? <WorkspaceState title="No matches found" description="PetRadar will show candidate sightings here when matches are available." /> : <section className="match-list">{items.map((item) => <MatchCard item={item} key={item.id} />)}</section>}<aside className="privacy-note"><strong>Owner-facing review</strong><span>Exact lost-pet and sighting pins are hidden. Administrative confirm/reject controls are not part of the user Web app.</span></aside></div>;
}
function MatchCard({ item }: { item: MatchResult }) { return <article className="match-card"><div className={`score-disc score-${item.level.toLowerCase()}`}><strong>{item.score}</strong><span>{formatStatus(item.level)}</span></div><div><div className="card-title-row"><div><span className="eyebrow">{formatStatus(item.reviewStatus)}</span><h2>{item.lostPet.name}</h2></div><span className="status-badge">{formatStatus(item.sighting.species)}</span></div><p>{item.reasons.join(' · ') || 'Candidate traits are being compared.'}</p><dl className="card-facts"><div><dt>Matched</dt><dd>{formatDate(item.matchedAt)}</dd></div><div><dt>Distance</dt><dd>{item.distanceMeters === null ? 'Unavailable' : `${Math.round(item.distanceMeters).toLocaleString()} m approximate`}</dd></div></dl></div><Link className="secondary-action" href={matchDetailRoute(item.id)}>Review details</Link></article>; }
