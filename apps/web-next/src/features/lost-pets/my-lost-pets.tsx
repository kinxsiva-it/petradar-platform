'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import { formatDate, formatSpecies, formatStatus } from '../../lib/formatting/display';
import { lostPetDetailRoute, lostPetEditRoute, routes } from '../../lib/routes';
import { useAuth } from '../auth/use-auth';
import { WorkspaceState } from '../sightings/my-reports';
import { listMyLostPets, type OwnerLostPet } from './owner-lost-pets-api';

export function MyLostPets() {
  const auth = useAuth();
  const [items, setItems] = useState<OwnerLostPet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('ALL');

  useEffect(() => {
    let active = true;
    void listMyLostPets(auth.authenticatedRequest).then((result) => { if (active) setItems(result); }).catch(() => { if (active) setError('Your lost-pet posts could not be loaded.'); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [auth.authenticatedRequest]);

  const filtered = useMemo(() => items.filter((item) => `${item.name} ${item.id} ${item.breed ?? ''} ${item.color ?? ''}`.toLowerCase().includes(query.trim().toLowerCase()) && (status === 'ALL' || item.status === status)), [items, query, status]);

  return <div className="page-container workspace-page"><header className="page-heading"><div><span className="eyebrow">My PetRadar</span><h1>My Lost Pets</h1><p>Manage active, matched, reunited, and closed lost-pet posts.</p></div><Link className="primary-action" href={routes.lostPetNew}>Post a lost pet</Link></header><section className="summary-grid"><Summary value={items.filter((item) => item.status === 'LOST').length} label="Active posts" /><Summary value={items.filter((item) => item.status === 'POSSIBLE_MATCH').length} label="Possible matches" /><Summary value={items.filter((item) => item.status === 'REUNITED').length} label="Reunited" /></section><section className="workspace-filter"><label className="form-field"><span>Search pets</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Pet name, breed, or color" /></label><label className="form-field"><span>Status</span><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="ALL">All statuses</option><option value="LOST">Lost</option><option value="POSSIBLE_MATCH">Possible match</option><option value="REUNITED">Reunited</option><option value="CLOSED">Closed</option></select></label></section>{loading ? <WorkspaceState loading title="Loading your lost-pet posts…" /> : error ? <WorkspaceState title="Lost-pet posts unavailable" description={error} /> : items.length === 0 ? <WorkspaceState title="No lost-pet posts" description="Create a post to start matching community sightings." action={<Link className="primary-action" href={routes.lostPetNew}>Post a lost pet</Link>} /> : filtered.length === 0 ? <WorkspaceState title="No pets match this filter" description="Try another search or status." /> : <section className="workspace-list">{filtered.map((item) => <OwnerLostPetCard item={item} key={item.id} />)}</section>}<aside className="privacy-note"><strong>Owner workspace</strong><span>Private contact and exact location data stay inside owner-authorized API calls and are never rendered on the public list.</span></aside></div>;
}

function Summary({ label, value }: { label: string; value: number }) { return <article><strong>{value}</strong><span>{label}</span></article>; }
function OwnerLostPetCard({ item }: { item: OwnerLostPet }) { return <article className="workspace-card"><div className="workspace-card-media">{item.photoUrls[0] ? <img alt="" src={item.photoUrls[0]} /> : <span aria-hidden="true">🐾</span>}</div><div className="workspace-card-copy"><div className="card-title-row"><div><span className="eyebrow">{formatSpecies(item.species)} · {item.id.slice(0,8).toUpperCase()}</span><h2>{item.name}</h2></div><span className={`status-badge status-${item.status.toLowerCase()}`}>{formatStatus(item.status)}</span></div><p>{item.breed ?? 'Breed not specified'}{item.color ? ` · ${item.color}` : ''}</p><dl className="card-facts"><div><dt>Last seen</dt><dd>{formatDate(item.lastSeenAt)}</dd></div><div><dt>Public area</dt><dd>Approximate area within {item.publicRadiusMeters.toLocaleString()} m</dd></div></dl><div className="card-actions"><Link className="secondary-action" href={lostPetDetailRoute(item.id)}>Public details</Link><Link className="secondary-action" href={lostPetEditRoute(item.id)}>Edit</Link>{item.status === 'POSSIBLE_MATCH' ? <Link className="primary-action" href={routes.matches}>View matches</Link> : null}</div></div></article>; }
