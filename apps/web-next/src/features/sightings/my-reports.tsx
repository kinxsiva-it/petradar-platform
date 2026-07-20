'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import { formatDate, formatSpecies, formatStatus } from '../../lib/formatting/display';
import { routes } from '../../lib/routes';
import { useAuth } from '../auth/use-auth';
import { listMySightings } from './sightings-api';
import type { OwnerSighting } from './sighting-types';

export function MyReports() {
  const auth = useAuth();
  const [items, setItems] = useState<OwnerSighting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('ALL');

  useEffect(() => {
    let active = true;
    void listMySightings(auth.authenticatedRequest)
      .then((result) => { if (active) setItems(result.items); })
      .catch(() => { if (active) setError('Your reports could not be loaded.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [auth.authenticatedRequest]);

  const filtered = useMemo(() => items.filter((item) => {
    const haystack = `${item.id} ${item.species} ${item.color ?? ''} ${item.condition}`.toLowerCase();
    return haystack.includes(query.trim().toLowerCase()) && (status === 'ALL' || item.lifecycleStatus === status);
  }), [items, query, status]);

  const summary = {
    all: items.length,
    matches: items.filter((item) => item.lifecycleStatus === 'POSSIBLE_MATCH').length,
    pending: items.filter((item) => item.verificationStatus === 'PENDING' || item.verificationStatus === 'NEEDS_REVIEW').length,
    verified: items.filter((item) => item.verificationStatus === 'VERIFIED' || item.verificationStatus === 'COMMUNITY_VERIFIED').length,
  };

  return (
    <div className="page-container workspace-page">
      <header className="page-heading"><div><span className="eyebrow">My PetRadar</span><h1>My Reports</h1><p>Track your submitted animal sightings without exposing exact locations publicly.</p></div><Link className="primary-action" href={routes.reportAnimal}>Report an animal</Link></header>
      <section className="summary-grid"><Summary value={summary.all} label="Total reports" /><Summary value={summary.verified} label="Verified" /><Summary value={summary.pending} label="Pending review" /><Summary value={summary.matches} label="Possible matches" /></section>
      <section className="workspace-filter"><label className="form-field"><span>Search reports</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Reference, species, or color" /></label><label className="form-field"><span>Status</span><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="ALL">All statuses</option><option value="SIGHTING">Submitted</option><option value="POSSIBLE_MATCH">Possible match</option><option value="NEEDS_RESCUE">Needs rescue</option><option value="CLOSED">Closed</option></select></label></section>
      {loading ? <WorkspaceState title="Loading your reports…" loading /> : error ? <WorkspaceState title="Reports unavailable" description={error} /> : items.length === 0 ? <WorkspaceState title="No reports yet" description="Create your first community animal report." action={<Link className="primary-action" href={routes.reportAnimal}>Report an animal</Link>} /> : filtered.length === 0 ? <WorkspaceState title="No matching reports" description="Try another search or status filter." /> : <section className="workspace-list">{filtered.map((item) => <ReportCard key={item.id} item={item} />)}</section>}
    </div>
  );
}

function Summary({ label, value }: { label: string; value: number }) { return <article><strong>{value}</strong><span>{label}</span></article>; }

function ReportCard({ item }: { item: OwnerSighting }) {
  return <article className="workspace-card"><div className="workspace-card-media">{item.photoUrls[0] ? <img src={item.photoUrls[0]} alt="" /> : <span aria-hidden="true">🐾</span>}</div><div className="workspace-card-copy"><div className="card-title-row"><div><span className="eyebrow">{formatSpecies(item.species)} · {item.id.slice(0, 8).toUpperCase()}</span><h2>{item.color ?? 'Unknown color'} {formatSpecies(item.species).toLowerCase()}</h2></div><span className={`status-badge status-${item.lifecycleStatus.toLowerCase()}`}>{formatStatus(item.lifecycleStatus)}</span></div><p>{item.description ?? 'No description provided.'}</p><dl className="card-facts"><div><dt>Seen</dt><dd>{formatDate(item.seenAt)}</dd></div><div><dt>Public area</dt><dd>Approximate area within {item.publicRadiusMeters.toLocaleString()} m</dd></div><div><dt>Verification</dt><dd>{formatStatus(item.verificationStatus)}</dd></div><div><dt>Urgency</dt><dd>{formatStatus(item.urgency)}</dd></div></dl>{item.rejectionReason ? <div className="feedback feedback-error"><strong>Review feedback:</strong> {item.rejectionReason}</div> : null}</div></article>;
}

export function WorkspaceState({ action, description, loading, title }: { action?: React.ReactNode; description?: string; loading?: boolean; title: string }) {
  return <section className={loading ? 'loading-state workspace-state' : 'empty-state workspace-state'} aria-live="polite">{loading ? <span className="loading-pulse" /> : <span aria-hidden="true">{title.includes('unavailable') ? '!' : '🐾'}</span>}<h2>{title}</h2>{description ? <p>{description}</p> : null}{action}</section>;
}
