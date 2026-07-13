import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cache } from 'react';

import { getPublicLostPet } from '../../../features/lost-pets/lost-pets-api';
import { ApiClientError } from '../../../lib/api/http-client';
import {
  formatDate,
  formatReward,
  formatSpecies,
  formatStatus,
} from '../../../lib/formatting/display';
import { routes } from '../../../lib/routes';

interface LostPetDetailPageProps {
  params: Promise<{ id: string }>;
}

const getCachedPublicLostPet = cache(getPublicLostPet);

export async function generateMetadata({ params }: LostPetDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  if (!isUuid(id)) {
    return fallbackMetadata;
  }

  try {
    const pet = await getCachedPublicLostPet(id);
    return {
      title: `${pet.name} — Lost ${formatSpecies(pet.species)}`,
      description: `${pet.name} is listed as ${formatStatus(pet.status).toLowerCase()} on PetRadar. View the privacy-safe public post.`,
    };
  } catch {
    return fallbackMetadata;
  }
}

export default async function LostPetDetailPage({ params }: LostPetDetailPageProps) {
  const { id } = await params;
  if (!isUuid(id)) notFound();

  try {
    const pet = await getCachedPublicLostPet(id);
    const reward = formatReward(pet.rewardCents);

    return (
      <div className="page-container lost-pet-detail-page">
        <Link className="back-link" href={routes.lostPets}>← Back to lost pets</Link>

        <section className="detail-hero">
          <div className="pet-gallery" aria-label={`${pet.name} photos`}>
            {pet.photoUrls.length > 0 ? pet.photoUrls.map((photo, index) => (
              <div className={index === 0 ? 'pet-photo pet-photo-featured' : 'pet-photo'} key={photo}>
                <img alt={`${pet.name}${index === 0 ? '' : ` photo ${index + 1}`}`} src={photo} />
              </div>
            )) : (
              <div className="pet-photo pet-photo-featured pet-photo-empty" aria-label="No public photo available">🐾</div>
            )}
          </div>

          <div className="detail-summary">
            <div className="card-title-row">
              <span className="eyebrow">Lost {formatSpecies(pet.species)}</span>
              <span className={`status-badge status-${pet.status.toLowerCase()}`}>{formatStatus(pet.status)}</span>
            </div>
            <h1>{pet.name}</h1>
            <p className="detail-lead">{pet.description ?? 'No additional public description was provided.'}</p>
            <div className="detail-actions">
              <Link className="primary-action" href={routes.reportAnimal}>Report a possible sighting</Link>
              <Link className="secondary-action" href={routes.lostPets}>Browse other posts</Link>
            </div>
          </div>
        </section>

        <section className="detail-grid">
          <article className="detail-card">
            <h2>Pet details</h2>
            <dl className="detail-list">
              <Detail label="Species" value={formatSpecies(pet.species)} />
              <Detail label="Breed" value={pet.breed ?? 'Not specified'} />
              <Detail label="Sex" value={formatStatus(pet.sex)} />
              <Detail label="Age" value={pet.age ?? 'Not specified'} />
              <Detail label="Color" value={pet.color ?? 'Not specified'} />
              <Detail label="Pattern" value={pet.pattern ?? 'Not specified'} />
              <Detail label="Collar" value={pet.collarDescription ?? 'Not specified'} />
              {reward ? <Detail label="Reward" value={reward} /> : null}
            </dl>
          </article>

          <article className="detail-card">
            <h2>Last seen</h2>
            <dl className="detail-list">
              <Detail label="Date" value={formatDate(pet.lastSeenAt)} />
              <Detail label="Public location" value={`Approximate area within ${pet.approximateRadiusMeters.toLocaleString()} m`} />
              <Detail label="Post updated" value={formatDate(pet.updatedAt)} />
            </dl>
            <aside className="privacy-note compact-note">
              <strong>Approximate area only</strong>
              <span>The exact last-seen pin and the owner's private contact details are not included on this page.</span>
            </aside>
          </article>
        </section>
      </div>
    );
  } catch (error) {
    if (error instanceof ApiClientError && error.status === 404) notFound();

    return (
      <div className="page-container state-page">
        <section className="empty-state error-state">
          <span aria-hidden="true">!</span>
          <h1>This lost-pet post could not be loaded</h1>
          <p>Please return to the public list and try again.</p>
          <Link className="primary-action" href={routes.lostPets}>Back to lost pets</Link>
        </section>
      </div>
    );
  }
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div><dt>{label}</dt><dd>{value}</dd></div>;
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

const fallbackMetadata: Metadata = {
  title: 'Lost-pet details',
  description: 'View a privacy-safe public lost-pet post on PetRadar.',
};
