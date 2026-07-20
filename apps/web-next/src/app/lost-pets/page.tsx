import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { LostPetCard } from '../../features/lost-pets/lost-pet-card';
import { listPublicLostPets } from '../../features/lost-pets/lost-pets-api';
import type {
  AnimalSpecies,
  LostPetListFilters,
  LostPetStatus,
} from '../../features/lost-pets/lost-pet-types';
import { ApiClientError } from '../../lib/api/http-client';
import { routes } from '../../lib/routes';

export const metadata: Metadata = {
  title: 'Lost Pets',
  description: 'Search public lost-pet posts and approximate last-seen areas on PetRadar.',
};

interface LostPetsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function LostPetsPage({ searchParams }: LostPetsPageProps) {
  const params = await searchParams;
  const filters = filtersFromSearchParams(params);

  try {
    const result = await listPublicLostPets(filters);
    return (
      <div className="page-container lost-pets-page">
        <section className="lost-pets-hero">
          <span className="lost-pets-decoration lost-pets-decoration-heart" aria-hidden="true"><LostPetsIcon name="heart" /></span>
          <span className="lost-pets-decoration lost-pets-decoration-leaf" aria-hidden="true"><LostPetsIcon name="leaf" /></span>
          <div className="lost-pets-hero-copy">
            <span className="eyebrow">COMMUNITY SEARCH</span>
            <h1>Lost pets</h1>
            <p>Help bring lost pets home by browsing active community posts. All locations are privacy-safe and approximate.</p>
            <div className="lost-pets-summary-grid">
              <div className="lost-pets-summary-card" aria-label={`${result.total.toLocaleString()} active public lost-pet posts`}>
                <span><LostPetsIcon name="paw" /></span>
                <strong>{result.total.toLocaleString()}</strong>
                <small>Active public posts</small>
              </div>
              <div className="lost-pets-summary-card">
                <span><LostPetsIcon name="community" /></span>
                <strong>Community</strong>
                <small>Neighbors helping</small>
              </div>
              <div className="lost-pets-summary-card">
                <span><LostPetsIcon name="shield" /></span>
                <strong>Privacy-safe</strong>
                <small>Approximate areas only</small>
              </div>
            </div>
            <div className="lost-pets-privacy-line"><LostPetsIcon name="lock" /><span>Exact locations are never shared. Only approximate areas are shown publicly.</span></div>
          </div>
          <div className="lost-pets-hero-art" aria-hidden="true">
            <span className="lost-pets-art-backdrop" />
            <Image
              alt=""
              height={1254}
              priority
              src="/images/lost-pets/lost-pets-hero-person-with-dog-and-cat.png"
              width={1254}
            />
          </div>
          <Link className="primary-action lost-pets-report-action" href={routes.lostPetNew}><LostPetsIcon name="plus" />Report lost pet</Link>
        </section>

        <form className="lost-pets-filter-panel" method="get" role="search">
          <label className="lost-pets-filter-field lost-pets-filter-search">
            <span>Search</span>
            <span className="lost-pets-input-shell"><LostPetsIcon name="search" /><input defaultValue={filters.query} name="query" placeholder="Name, color, or keyword…" /></span>
          </label>
          <label className="lost-pets-filter-field">
            <span>Species</span>
            <select defaultValue={filters.species ?? ''} name="species">
              <option value="">All species</option>
              <option value="CAT">Cats</option>
              <option value="DOG">Dogs</option>
              <option value="OTHER">Other</option>
            </select>
          </label>
          <label className="lost-pets-filter-field">
            <span>Status</span>
            <select defaultValue={filters.status ?? ''} name="status">
              <option value="">All public statuses</option>
              <option value="LOST">Lost</option>
              <option value="POSSIBLE_MATCH">Possible match</option>
              <option value="REUNITED">Reunited</option>
            </select>
          </label>
          <label className="lost-pets-filter-field">
            <span>Last seen since</span>
            <span className="lost-pets-input-shell"><LostPetsIcon name="calendar" /><input defaultValue={filters.lastSeenFrom} name="lastSeenFrom" type="date" /></span>
          </label>
          <button className="primary-action lost-pets-filter-submit" type="submit"><LostPetsIcon name="search" />Search</button>
          <Link className="lost-pets-clear-action" href={routes.lostPets}>Clear all</Link>
        </form>

        <div className="lost-pets-content-layout">
          <main className="lost-pets-results">
            <div className="lost-pets-results-summary" aria-live="polite">
              <strong>{result.total.toLocaleString()} {result.total === 1 ? 'lost-pet post' : 'lost-pet posts'}</strong>
              <span>Newest last-seen reports first · Page {result.page} of {Math.max(result.totalPages, 1)}</span>
            </div>

            {result.items.length > 0 ? (
              <section className="lost-pet-grid" aria-label="Lost-pet posts">
                {result.items.map((pet) => <LostPetCard key={pet.id} pet={pet} />)}
              </section>
            ) : (
              <section className="empty-state lost-pets-empty-state">
                <span aria-hidden="true"><LostPetsIcon name="search" /></span>
                <h2>No lost-pet posts match your search.</h2>
                <p>Try adjusting your filters or create a lost-pet report.</p>
                <div><Link className="secondary-action" href={routes.lostPets}>Clear filters</Link><Link className="primary-action" href={routes.lostPetNew}>Report lost pet</Link></div>
              </section>
            )}

            {result.totalPages > 1 ? (
              <nav className="pagination lost-pets-pagination" aria-label="Lost pets pagination">
                {result.page > 1 ? <Link className="secondary-action" href={pageHref(filters, result.page - 1)}>Previous</Link> : <span />}
                <span>Page {result.page} of {result.totalPages}</span>
                {result.page < result.totalPages ? <Link className="primary-action" href={pageHref(filters, result.page + 1)}>Next</Link> : <span />}
              </nav>
            ) : null}
          </main>

          <aside className="lost-pets-sidebar" aria-label="Lost-pet search help">
            <section className="lost-pets-sidebar-card">
              <header><span><LostPetsIcon name="lightbulb" /></span><h2>Tips to help find your pet</h2></header>
              <ul>
                <li><LostPetsIcon name="search" /><span><strong>Search nearby areas regularly</strong><small>Pets are often found close to familiar places.</small></span></li>
                <li><LostPetsIcon name="community" /><span><strong>Share with trusted people</strong><small>Photos and details help more people notice.</small></span></li>
                <li><LostPetsIcon name="shield" /><span><strong>Check shelters and veterinary clinics</strong><small>Visit local shelters and clinics regularly.</small></span></li>
                <li><LostPetsIcon name="refresh" /><span><strong>Keep the report updated</strong><small>Update your post whenever something changes.</small></span></li>
              </ul>
              <Link href={routes.communityGuidelines}>View full guidelines <span aria-hidden="true">→</span></Link>
            </section>

            <section className="lost-pets-sidebar-card lost-pets-sharing-card">
              <header><span><LostPetsIcon name="paw" /></span><div><h2>Every share makes a difference</h2><p>Share this page with trusted neighbors to help more pets reunite with their families.</p></div></header>
            </section>

            <section className="lost-pets-sidebar-card lost-pets-help-card">
              <header><span><LostPetsIcon name="heart" /></span><div><h2>Need help?</h2><p>Learn how to share lost-pet information safely while protecting private locations.</p></div></header>
              <Link href={routes.communityGuidelines}>Read safety guidelines <span aria-hidden="true">→</span></Link>
            </section>
          </aside>
        </div>
      </div>
    );
  } catch (error) {
    return (
      <div className="page-container state-page lost-pets-error-page">
        <section className="empty-state error-state">
          <span aria-hidden="true">!</span>
          <h1>Lost pets could not be loaded</h1>
          <p>{listErrorMessage(error)}</p>
          <Link className="primary-action" href={routes.lostPets}>Try again</Link>
        </section>
      </div>
    );
  }
}

type LostPetsIconName = 'calendar' | 'community' | 'heart' | 'leaf' | 'lightbulb' | 'lock' | 'paw' | 'plus' | 'refresh' | 'search' | 'shield';

function LostPetsIcon({ name }: { name: LostPetsIconName }) {
  const paths: Record<LostPetsIconName, ReactNode> = {
    calendar: <><path d="M5 4v3M19 4v3M4 9h16M5 6h14a1 1 0 0 1 1 1v13H4V7a1 1 0 0 1 1-1Z" /></>,
    community: <><circle cx="8" cy="9" r="3" /><circle cx="17" cy="8" r="2.5" /><path d="M3 20c.5-4 2.4-6 5-6s4.5 2 5 6M14 14c3.7-.3 5.8 1.7 6.4 5" /></>,
    heart: <path d="M20.8 5.8a5.5 5.5 0 0 0-7.8 0L12 6.9l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 22l8.8-8.4a5.5 5.5 0 0 0 0-7.8Z" />,
    leaf: <><path d="M20 4C10 4 5 9 5 19c10 0 15-5 15-15Z" /><path d="M5 19c3-4 6-7 11-10" /></>,
    lightbulb: <><path d="M9 18h6M10 22h4M8 14a6 6 0 1 1 8 0c-1 .8-1 1.8-1 2H9c0-.2 0-1.2-1-2Z" /></>,
    lock: <><rect x="5" y="10" width="14" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>,
    paw: <><circle cx="7.5" cy="8" r="2.1" fill="currentColor" stroke="none" /><circle cx="12" cy="5.8" r="2.1" fill="currentColor" stroke="none" /><circle cx="16.5" cy="8" r="2.1" fill="currentColor" stroke="none" /><path d="M6.4 16.2c0-3.2 2.4-5.6 5.6-5.6s5.6 2.4 5.6 5.6c0 2.1-1.7 3.3-3.5 2.7L12 18.3l-2.1.6c-1.8.6-3.5-.6-3.5-2.7Z" fill="currentColor" stroke="none" /></>,
    plus: <path d="M12 5v14M5 12h14" />,
    refresh: <><path d="M20 7v5h-5M4 17v-5h5" /><path d="M7 7a7 7 0 0 1 11 2M17 17A7 7 0 0 1 6 15" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    shield: <><path d="M12 3 20 6v6c0 5-3.4 8.2-8 10-4.6-1.8-8-5-8-10V6z" /><path d="m9 12 2 2 4-4" /></>,
  };
  return <svg className="lost-pets-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24">{paths[name]}</svg>;
}

function filtersFromSearchParams(
  params: Record<string, string | string[] | undefined>,
): LostPetListFilters {
  const query = singleValue(params['query'])?.trim();
  const species = singleValue(params['species']);
  const status = singleValue(params['status']);
  const lastSeenFrom = validDate(singleValue(params['lastSeenFrom']));
  return {
    page: positiveInteger(singleValue(params['page'])) ?? 1,
    pageSize: 12,
    ...(query ? { query } : {}),
    ...(isSpecies(species) ? { species } : {}),
    ...(isStatus(status) ? { status } : {}),
    ...(lastSeenFrom ? { lastSeenFrom } : {}),
  };
}

function pageHref(filters: LostPetListFilters, page: number): string {
  const params = new URLSearchParams();
  if (filters.query) params.set('query', filters.query);
  if (filters.species) params.set('species', filters.species);
  if (filters.status) params.set('status', filters.status);
  if (filters.lastSeenFrom) params.set('lastSeenFrom', filters.lastSeenFrom);
  params.set('page', String(page));
  return `${routes.lostPets}?${params.toString()}`;
}

function singleValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function positiveInteger(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

function validDate(value: string | undefined): string | undefined {
  return value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : undefined;
}

function isSpecies(value: string | undefined): value is AnimalSpecies {
  return value === 'CAT' || value === 'DOG' || value === 'OTHER';
}

function isStatus(value: string | undefined): value is LostPetStatus {
  return value === 'LOST' || value === 'POSSIBLE_MATCH' || value === 'REUNITED';
}

function listErrorMessage(error: unknown): string {
  if (error instanceof ApiClientError && error.status === 400) {
    return 'Check the lost-pet filters and try again.';
  }
  return 'The PetRadar service is unavailable right now. Please try again soon.';
}
