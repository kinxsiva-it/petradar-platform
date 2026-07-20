'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState, type ChangeEvent, type ReactNode } from 'react';

import { formatDate, formatStatus } from '../../lib/formatting/display';
import { matchDetailRoute, routes } from '../../lib/routes';
import { useAuth } from '../auth/use-auth';
import { listMatches, type MatchPage, type MatchResult, type MatchReviewStatus } from './matches-api';

type MatchFilter = 'ALL' | MatchReviewStatus;
type PaginationItem = number | 'ellipsis-left' | 'ellipsis-right';

const filters: readonly MatchFilter[] = ['ALL', 'PENDING', 'CONFIRMED', 'REJECTED'];
const pageSizeOptions = [10, 20, 50] as const;

const emptyPage: MatchPage = {
  items: [],
  page: 1,
  pageSize: 10,
  total: 0,
  totalPages: 0,
};

export function MatchesOverview() {
  const auth = useAuth();
  const [filter, setFilter] = useState<MatchFilter>('ALL');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [pageData, setPageData] = useState<MatchPage>(emptyPage);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retryVersion, setRetryVersion] = useState(0);

  useEffect(() => {
    let active = true;

    setLoading(true);
    setError('');

    void listMatches(auth.authenticatedRequest, {
      page,
      pageSize,
      status: filter === 'ALL' ? undefined : filter,
    })
      .then((result) => {
        if (!active) return;
        setPageData(result);
        if (result.totalPages > 0 && page > result.totalPages) {
          setPage(result.totalPages);
        }
      })
      .catch(() => {
        if (!active) return;
        setError('Possible matches could not be loaded. Please try again.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [auth.authenticatedRequest, filter, page, pageSize, retryVersion]);

  function changeFilter(value: MatchFilter) {
    setFilter(value);
    setPage(1);
  }

  function changePageSize(event: ChangeEvent<HTMLSelectElement>) {
    setPageSize(Number(event.target.value));
    setPage(1);
  }

  const firstVisibleItem = pageData.total === 0 ? 0 : (pageData.page - 1) * pageData.pageSize + 1;
  const lastVisibleItem = Math.min(pageData.page * pageData.pageSize, pageData.total);

  return (
    <div className="page-container matches-page">
      <section className="matches-hero">
        <div className="matches-hero-copy">
          <span className="eyebrow">PetRadar matches</span>
          <h1>Possible Matches</h1>
          <p>Compare your lost-pet posts with public sightings using privacy-safe evidence.</p>
          <div className="matches-privacy-message">
            <MatchesIcon name="shield" />
            <span>We never share exact locations. Only approximate areas are shown.</span>
          </div>
        </div>
        <div className="matches-hero-art" aria-hidden="true">
          <Image
            alt=""
            height={1254}
            priority
            src="/images/matches/matches-corgi-cat-search.png"
            width={1254}
          />
        </div>
        <Link className="primary-action matches-hero-action" href={routes.myLostPets}>
          View My Lost Pets
        </Link>
      </section>

      <section className="matches-toolbar" aria-label="Match controls">
        <div className="matches-tabs" aria-label="Match status filters" role="tablist">
          {filters.map((value) => (
            <button
              aria-selected={filter === value}
              className={filter === value ? 'active' : ''}
              key={value}
              onClick={() => { changeFilter(value); }}
              role="tab"
              type="button"
            >
              {formatStatus(value)}
              {filter === value && !loading && !error ? <span>{pageData.total}</span> : null}
            </button>
          ))}
        </div>
        <label className="matches-sort-control">
          <span><MatchesIcon name="sort" /> Sort by</span>
          <select aria-label="Sort matches" onChange={() => { setPage(1); }} value="relevance">
            <option value="relevance">Most relevant</option>
          </select>
        </label>
      </section>

      {loading ? (
        <MatchesLoadingState />
      ) : error ? (
        <MatchesMessageState
          action={<button className="primary-action" onClick={() => { setRetryVersion((value) => value + 1); }} type="button">Try again</button>}
          description={error}
          icon="alert"
          title="Matches are temporarily unavailable"
        />
      ) : pageData.items.length === 0 ? (
        <MatchesMessageState
          action={
            <div className="matches-empty-actions">
              {filter !== 'ALL' ? <button className="secondary-action" onClick={() => { changeFilter('ALL'); }} type="button">View all matches</button> : null}
              <Link className="primary-action" href={routes.myLostPets}>Review my lost pets</Link>
            </div>
          }
          description="PetRadar will show candidate public sightings here when privacy-safe evidence is available."
          icon="search"
          title="No matches found"
        />
      ) : (
        <>
          <section className="matches-results" aria-label="Possible matches">
            {pageData.items.map((item) => <MatchComparisonCard item={item} key={item.id} />)}
          </section>
          <MatchesPagination
            firstVisibleItem={firstVisibleItem}
            lastVisibleItem={lastVisibleItem}
            onPageChange={setPage}
            onPageSizeChange={changePageSize}
            page={pageData.page}
            pageSize={pageData.pageSize}
            total={pageData.total}
            totalPages={pageData.totalPages}
          />
        </>
      )}

      <section className="matches-support-grid" aria-label="Match help">
        <article>
          <span className="matches-support-icon"><MatchesIcon name="info" /></span>
          <div>
            <strong>How matches work</strong>
            <p>PetRadar compares shared traits, timing, and approximate public areas to suggest possible connections.</p>
          </div>
        </article>
        <article>
          <span className="matches-support-icon"><MatchesIcon name="help" /></span>
          <div>
            <strong>Need help?</strong>
            <p>Learn how to review possible matches safely and responsibly.</p>
            <Link href={routes.communityGuidelines}>View Guidelines <span aria-hidden="true">→</span></Link>
          </div>
        </article>
      </section>
    </div>
  );
}

function MatchComparisonCard({ item }: { item: MatchResult }) {
  const evidence = item.reasons.length > 0 ? item.reasons : ['Candidate details are being compared'];

  return (
    <article className="matches-comparison-card">
      <div className={`matches-score score-${item.level.toLowerCase()}`}>
        <strong>{Math.round(item.score)}</strong>
        <span>{formatStatus(item.level)}</span>
      </div>

      <div className="matches-card-details">
        <div className="matches-card-heading">
          <span className={`matches-review-status status-${item.reviewStatus.toLowerCase()}`}>
            {formatStatus(item.reviewStatus)}
          </span>
          <h2>{item.lostPet.name}</h2>
        </div>
        <div className="matches-evidence-tags" aria-label="Matching evidence">
          <span><MatchesIcon name="paw" /> {formatStatus(item.sighting.species)}</span>
          <span><MatchesIcon name="condition" /> {formatStatus(item.sighting.condition)}</span>
          {evidence.slice(0, 3).map((reason) => <span key={reason}>{reason}</span>)}
        </div>
        <div className="matches-approximate-area">
          <MatchesIcon name="pin" />
          <span><small>Approximate public area</small><strong>Within a {formatMeters(item.sighting.publicRadiusMeters)} privacy radius</strong></span>
        </div>
        <dl className="matches-card-facts">
          <div><dt>Matched</dt><dd>{formatDate(item.matchedAt)}</dd></div>
          <div><dt>Last seen</dt><dd>{formatDate(item.sighting.seenAt)}</dd></div>
          <div><dt>Distance</dt><dd>{formatDistance(item.distanceMeters)}</dd></div>
        </dl>
      </div>

      <div className="matches-photo-comparison" aria-label="Lost pet and sighting comparison">
        <MatchPhotoFallback label="Lost pet" name={item.lostPet.name} />
        <span className="matches-swap-icon" aria-hidden="true"><MatchesIcon name="swap" /></span>
        <MatchPhotoFallback label="Sighting" name={formatStatus(item.sighting.species)} />
      </div>

      <div className="matches-card-action">
        <Link className="secondary-action" href={matchDetailRoute(item.id)}>Review details</Link>
      </div>
    </article>
  );
}

function MatchPhotoFallback({ label, name }: { label: string; name: string }) {
  return (
    <figure className="matches-photo-fallback">
      <span className="matches-photo-label">{label}</span>
      <span className="matches-photo-paw"><MatchesIcon name="paw" /></span>
      <figcaption>{name}</figcaption>
    </figure>
  );
}

interface MatchesPaginationProps {
  firstVisibleItem: number;
  lastVisibleItem: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (event: ChangeEvent<HTMLSelectElement>) => void;
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

function MatchesPagination({
  firstVisibleItem,
  lastVisibleItem,
  onPageChange,
  onPageSizeChange,
  page,
  pageSize,
  total,
  totalPages,
}: MatchesPaginationProps) {
  const pages = getPaginationItems(page, totalPages);

  return (
    <nav aria-label="Matches pagination" className="matches-pagination">
      <p>Showing {firstVisibleItem} to {lastVisibleItem} of {total} matches</p>
      <div className="matches-page-buttons">
        <button aria-label="First page" disabled={page <= 1} onClick={() => { onPageChange(1); }} type="button">&laquo;</button>
        <button aria-label="Previous page" disabled={page <= 1} onClick={() => { onPageChange(page - 1); }} type="button">&lsaquo;</button>
        {pages.map((item) => typeof item === 'number' ? (
          <button
            aria-current={item === page ? 'page' : undefined}
            className={item === page ? 'active' : ''}
            key={item}
            onClick={() => { onPageChange(item); }}
            type="button"
          >
            {item}
          </button>
        ) : <span aria-hidden="true" key={item}>&hellip;</span>)}
        <button aria-label="Next page" disabled={page >= totalPages} onClick={() => { onPageChange(page + 1); }} type="button">&rsaquo;</button>
        <button aria-label="Last page" disabled={page >= totalPages} onClick={() => { onPageChange(totalPages); }} type="button">&raquo;</button>
      </div>
      <label className="matches-page-size">
        <span>Rows per page</span>
        <select onChange={onPageSizeChange} value={pageSize}>
          {pageSizeOptions.map((value) => <option key={value} value={value}>{value}</option>)}
        </select>
      </label>
    </nav>
  );
}

function MatchesLoadingState() {
  return (
    <section aria-label="Loading possible matches" aria-live="polite" className="matches-results">
      <span className="sr-only">Loading possible matches…</span>
      {[0, 1, 2].map((item) => <div className="matches-card-skeleton" key={item}><span /><span /><span /></div>)}
    </section>
  );
}

function MatchesMessageState({ action, description, icon, title }: { action: ReactNode; description: string; icon: MatchesIconName; title: string }) {
  return (
    <section className="matches-message-state">
      <span className="matches-message-icon"><MatchesIcon name={icon} /></span>
      <h2>{title}</h2>
      <p>{description}</p>
      {action}
    </section>
  );
}

function getPaginationItems(currentPage: number, totalPages: number): PaginationItem[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1);

  const pages = new Set([1, totalPages, currentPage - 1, currentPage, currentPage + 1]);
  const validPages = [...pages].filter((value) => value >= 1 && value <= totalPages).sort((a, b) => a - b);
  const items: PaginationItem[] = [];

  validPages.forEach((value, index) => {
    const previous = validPages[index - 1];
    if (previous && value - previous > 1) items.push(index === 1 ? 'ellipsis-left' : 'ellipsis-right');
    items.push(value);
  });

  return items;
}

function formatDistance(distanceMeters: number | null): string {
  if (distanceMeters === null) return 'Unavailable';
  if (distanceMeters < 1000) return `${Math.round(distanceMeters).toLocaleString()} m approximate`;
  return `${(distanceMeters / 1000).toFixed(distanceMeters < 10_000 ? 1 : 0)} km approximate`;
}

function formatMeters(value: number): string {
  if (value < 1000) return `${Math.round(value).toLocaleString()} m`;
  return `${(value / 1000).toFixed(value < 10_000 ? 1 : 0)} km`;
}

type MatchesIconName = 'alert' | 'condition' | 'help' | 'info' | 'paw' | 'pin' | 'search' | 'shield' | 'sort' | 'swap';

function MatchesIcon({ name }: { name: MatchesIconName }) {
  const paths: Record<MatchesIconName, ReactNode> = {
    alert: <><circle cx="12" cy="12" r="9" /><path d="M12 7v6" /><path d="M12 17h.01" /></>,
    condition: <><path d="M7 4h10l2 4-7 12L5 8z" /><path d="M8 8h8" /></>,
    help: <><path d="M4 14v-2a8 8 0 0 1 16 0v2" /><path d="M18 19h-2v-6h4v4a2 2 0 0 1-2 2Z" /><path d="M6 19H4a2 2 0 0 1-2-2v-4h4Z" /></>,
    info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5" /><path d="M12 8h.01" /></>,
    paw: <><ellipse cx="8" cy="7" rx="2" ry="2.6" /><ellipse cx="16" cy="7" rx="2" ry="2.6" /><ellipse cx="5" cy="11.5" rx="2" ry="2.4" /><ellipse cx="19" cy="11.5" rx="2" ry="2.4" /><path d="M7.5 18.2c0-3 2-5 4.5-5s4.5 2 4.5 5c0 1.7-1.2 2.8-2.8 2.3a5.8 5.8 0 0 0-3.4 0c-1.6.5-2.8-.6-2.8-2.3Z" /></>,
    pin: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
    search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></>,
    shield: <><path d="M12 3 5 6v5c0 5 3 8 7 10 4-2 7-5 7-10V6Z" /><path d="m9 12 2 2 4-4" /></>,
    sort: <><path d="M8 4v16" /><path d="m5 7 3-3 3 3" /><path d="M16 20V4" /><path d="m13 17 3 3 3-3" /></>,
    swap: <><path d="m7 7 3-3 3 3" /><path d="M10 4v10a3 3 0 0 0 3 3h4" /><path d="m17 14 3 3-3 3" /></>,
  };

  return <svg aria-hidden="true" className="matches-icon" fill="none" viewBox="0 0 24 24">{paths[name]}</svg>;
}

export function MatchCard({ item }: { item: MatchResult }) {
  return (
    <article className="match-card">
      <div className={`score-disc score-${item.level.toLowerCase()}`}><strong>{item.score}</strong><span>{formatStatus(item.level)}</span></div>
      <div>
        <div className="card-title-row"><div><span className="eyebrow">{formatStatus(item.reviewStatus)}</span><h2>{item.lostPet.name}</h2></div><span className="status-badge">{formatStatus(item.sighting.species)}</span></div>
        <p>{item.reasons.join(' · ') || 'Candidate traits are being compared.'}</p>
        <dl className="card-facts"><div><dt>Matched</dt><dd>{formatDate(item.matchedAt)}</dd></div><div><dt>Distance</dt><dd>{formatDistance(item.distanceMeters)}</dd></div></dl>
      </div>
      <Link className="secondary-action" href={matchDetailRoute(item.id)}>Review details</Link>
    </article>
  );
}
