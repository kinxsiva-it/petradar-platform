import {
  AnimalCondition,
  AnimalSpecies,
  CollarStatus,
  SightingLifecycleStatus,
  UrgencyLevel,
  VerificationStatus,
} from '@prisma/client';

import type { GeographicPoint } from '@petradar/backend/shared';

export interface SightingResponseSource {
  id: string;
  species: AnimalSpecies;
  animalCount: number;
  color: string | null;
  pattern: string | null;
  collarStatus: CollarStatus;
  condition: AnimalCondition;
  description: string | null;
  seenAt: Date;
  urgency: UrgencyLevel;
  lifecycleStatus: SightingLifecycleStatus;
  verificationStatus: VerificationStatus;
  publicLocation: GeographicPoint;
  publicRadiusMeters: number;
  exactLocation?: GeographicPoint;
  createdAt: Date;
  updatedAt: Date;
}

export interface PublicSightingResponse {
  id: string;
  species: AnimalSpecies;
  animalCount: number;
  color: string | null;
  pattern: string | null;
  collarStatus: CollarStatus;
  condition: AnimalCondition;
  description: string | null;
  seenAt: string;
  urgency: UrgencyLevel;
  lifecycleStatus: SightingLifecycleStatus;
  verificationStatus: VerificationStatus;
  publicLocation: GeographicPoint & { radiusMeters: number };
  createdAt: string;
  updatedAt: string;
}

export interface AuthorizedSightingResponse extends PublicSightingResponse {
  exactLocation?: GeographicPoint;
}

export function toPublicSightingResponse(source: SightingResponseSource): PublicSightingResponse {
  return {
    animalCount: source.animalCount,
    collarStatus: source.collarStatus,
    color: source.color,
    condition: source.condition,
    createdAt: source.createdAt.toISOString(),
    description: source.description,
    id: source.id,
    lifecycleStatus: source.lifecycleStatus,
    pattern: source.pattern,
    publicLocation: {
      latitude: source.publicLocation.latitude,
      longitude: source.publicLocation.longitude,
      radiusMeters: source.publicRadiusMeters,
    },
    seenAt: source.seenAt.toISOString(),
    species: source.species,
    updatedAt: source.updatedAt.toISOString(),
    urgency: source.urgency,
    verificationStatus: source.verificationStatus,
  };
}

export function toAuthorizedSightingResponse(
  source: SightingResponseSource,
  options: { includeExactLocation: boolean },
): AuthorizedSightingResponse {
  const response: AuthorizedSightingResponse = toPublicSightingResponse(source);

  if (options.includeExactLocation && source.exactLocation) {
    response.exactLocation = {
      latitude: source.exactLocation.latitude,
      longitude: source.exactLocation.longitude,
    };
  }

  return response;
}
