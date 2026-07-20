import Link from 'next/link';

import { BrandMark } from '../../components/layout/brand-mark';
import { formatDate, formatSpecies, formatStatus } from '../../lib/formatting/display';
import { lostPetDetailRoute } from '../../lib/routes';
import type { PublicLostPet } from './lost-pet-types';

export function LostPetCard({ pet }: { pet: PublicLostPet }) {
  const photo = pet.photoUrls[0];

  return (
    <article className="lost-pet-card">
      <div className="pet-photo pet-photo-card">
        {photo ? (
          <img alt={`${pet.name}, a lost ${formatSpecies(pet.species).toLowerCase()}`} src={photo} />
        ) : (
          <span className="lost-pet-photo-fallback" aria-hidden="true"><BrandMark /></span>
        )}
        <span className={`status-badge status-${pet.status.toLowerCase()}`}>{formatStatus(pet.status)}</span>
      </div>
      <div className="pet-card-body">
        <span className="eyebrow">{formatSpecies(pet.species)}</span>
        <h2>{pet.name}</h2>
        <p>{pet.breed ?? 'Breed not specified'}{pet.color ? ` · ${pet.color}` : ''}</p>
        <dl className="card-facts">
          <div><dt><CardIcon name="calendar" />Last seen</dt><dd>{formatDate(pet.lastSeenAt)}</dd></div>
          <div><dt><CardIcon name="pin" />Public area</dt><dd>Approximate area within {pet.approximateRadiusMeters.toLocaleString()} m</dd></div>
        </dl>
        <Link className="secondary-action" href={lostPetDetailRoute(pet.id)}>View details</Link>
      </div>
    </article>
  );
}

function CardIcon({ name }: { name: 'calendar' | 'pin' }) {
  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24">
      {name === 'calendar' ? (
        <><path d="M5 4v3M19 4v3M4 9h16M5 6h14a1 1 0 0 1 1 1v13H4V7a1 1 0 0 1 1-1Z" /></>
      ) : (
        <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>
      )}
    </svg>
  );
}
