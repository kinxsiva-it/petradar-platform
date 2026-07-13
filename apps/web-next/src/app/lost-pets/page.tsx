import type { Metadata } from 'next';
import Link from 'next/link';

import { ApiClientError } from '../../lib/api/http-client';
import { routes } from '../../lib/routes';
import { LostPetCard } from '../../features/lost-pets/lost-pet-card';
import { listPublicLostPets } from '../../features/lost-pets/lost-pets-api';
import type {
  AnimalSpecies,
  LostPetListFilters,
  LostPetStatus,
} from '../../features/lost-pets/lost-pet-types';

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
        <header className="page-heading">
          <div>
            <span className="eyebrow">Community search</span>
            <h1>Lost pets</h1>
            <p>Browse active community posts using only privacy-safe, approximate locations.</p>
          </div>
          <Link className="primary-action" href={routes.reportAnimal}>Report an animal</Link>
        </header>

        <form className="filter-panel" method="get" role="search">
          <label className="form-field filter-search">
            <span>Search</span>
            <input defaultValue={filters.query} name="query" placeholder="Name, breed, color…" />
          </label>
          <label className="form-field">
            <span>Species</span>
            <select defaultValue={filters.species ?? ''} name="species">
              <option value="">All species</option>
              <option value="CAT">Cats</option>
              <option value="DOG">Dogs</option>
              <option value="OTHER">Other</option>
            </select>
          </label>
          <label className="form-field">
            <span>Status</span>
            <select defaultValue={filters.status ?? ''} name="status">
              <option value="">All statuses</option>
              <option value="LOST">Lost</option>
              <option value="POSSIBLE_MATCH">Possible match</option>
              <option value="REUNITED">Reunited</option>
              <option value="CLOSED">Closed</option>
            </select>
          </label>
          <button className="primary-action" type="submit">Search</button>
          <Link className="text-action" href={routes.lostPets}>Clear</Link>
        </form>

        <div className="results-summary" aria-live="polite">
          <strong>{result.total.toLocaleString()} {result.total === 1 ? 'post' : 'posts'}</strong>
          <span>Page {result.page} of {Math.max(result.totalPages, 1)}</span>
        </div>

        {result.items.length > 0 ? (
          <section className="lost-pet-grid" aria-label="Lost-pet posts">
            {result.items.map((pet) => <LostPetCard key={pet.id} pet={pet} />)}
          </section>
        ) : (
          <section className="empty-state">
            <span aria-hidden="true">🐾</span>
            <h2>No lost-pet posts found</h2>
            <p>Try clearing a filter or searching with a different name, breed, or color.</p>
            <Link className="secondary-action" href={routes.lostPets}>Clear filters</Link>
          </section>
        )}

        {result.totalPages > 1 ? (
          <nav className="pagination" aria-label="Lost pets pagination">
            {result.page > 1 ? <Link className="secondary-action" href={pageHref(filters, result.page - 1)}>Previous</Link> : <span />}
            {result.page < result.totalPages ? <Link className="primary-action" href={pageHref(filters, result.page + 1)}>Next</Link> : null}
          </nav>
        ) : null}

        <aside className="privacy-note">
          <strong>Location privacy</strong>
          <span>Public posts describe an approximate area only. Exact last-seen pins and owner contact details stay private.</span>
        </aside>
      </div>
    );
  } catch (error) {
    return (
      <div className="page-container state-page">
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

function filtersFromSearchParams(
  params: Record<string, string | string[] | undefined>,
): LostPetListFilters {
  const query = singleValue(params['query'])?.trim();
  const species = singleValue(params['species']);
  const status = singleValue(params['status']);
  return {
    page: positiveInteger(singleValue(params['page'])) ?? 1,
    pageSize: 12,
    ...(query ? { query } : {}),
    ...(isSpecies(species) ? { species } : {}),
    ...(isStatus(status) ? { status } : {}),
  };
}

function pageHref(filters: LostPetListFilters, page: number): string {
  const params = new URLSearchParams();
  if (filters.query) params.set('query', filters.query);
  if (filters.species) params.set('species', filters.species);
  if (filters.status) params.set('status', filters.status);
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

function isSpecies(value: string | undefined): value is AnimalSpecies {
  return value === 'CAT' || value === 'DOG' || value === 'OTHER';
}

function isStatus(value: string | undefined): value is LostPetStatus {
  return value === 'CLOSED' || value === 'LOST' || value === 'POSSIBLE_MATCH' || value === 'REUNITED';
}

function listErrorMessage(error: unknown): string {
  if (error instanceof ApiClientError && error.status === 400) {
    return 'Check the lost-pet filters and try again.';
  }
  return 'The PetRadar service is unavailable right now. Please try again soon.';
}
