import Link from 'next/link';

import { formatDate, formatSpecies, formatStatus } from '../../lib/formatting/display';
import { lostPetDetailRoute } from '../../lib/routes';
import type { PublicLostPet } from './lost-pet-types';

export function LostPetCard({ pet }: { pet: PublicLostPet }) {
  const photo = pet.photoUrls[0];

  return (
    <article className="lost-pet-card">
      <div className="pet-photo pet-photo-card">
        {photo ? <img alt={`${pet.name}, a lost ${formatSpecies(pet.species).toLowerCase()}`} src={photo} /> : <span aria-hidden="true">{pet.species === 'DOG' ? '🐕' : pet.species === 'CAT' ? '🐈' : '🐾'}</span>}
      </div>
      <div className="pet-card-body">
        <div className="card-title-row">
          <div>
            <span className="eyebrow">{formatSpecies(pet.species)}</span>
            <h2>{pet.name}</h2>
          </div>
          <span className={`status-badge status-${pet.status.toLowerCase()}`}>{formatStatus(pet.status)}</span>
        </div>
        <p>{pet.breed ?? 'Breed not specified'}{pet.color ? ` · ${pet.color}` : ''}</p>
        <dl className="card-facts">
          <div><dt>Last seen</dt><dd>{formatDate(pet.lastSeenAt)}</dd></div>
          <div><dt>Public area</dt><dd>Approximate area within {pet.approximateRadiusMeters.toLocaleString()} m</dd></div>
        </dl>
        <Link className="secondary-action" href={lostPetDetailRoute(pet.id)}>View details</Link>
      </div>
    </article>
  );
}
