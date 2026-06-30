import {
  AnimalCondition,
  AnimalSpecies,
  CollarStatus,
  SightingLifecycleStatus,
  UrgencyLevel,
  VerificationStatus,
} from '@prisma/client';

import type { GeographicPoint } from '@petradar/backend/shared';
import { isOwnerEditableSighting } from './sighting-policies.js';
import type { PaginatedSightingsRecord, SightingRecord } from './sightings.repository.js';

export interface SightingResponseSource {
  id: string;
  reporterId?: string | null;
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
  distanceMeters?: number;
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
  distanceMeters?: number;
}

export interface AuthorizedSightingResponse extends PublicSightingResponse {
  editable: boolean;
  exactLocation?: GeographicPoint;
}

export interface PaginatedSightingsResponse<TItem> {
  items: TItem[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
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
    ...(source.distanceMeters === undefined ? {} : { distanceMeters: source.distanceMeters }),
  };
}

export function toAuthorizedSightingResponse(
  source: SightingResponseSource,
  options: { includeExactLocation: boolean },
): AuthorizedSightingResponse {
  const response: AuthorizedSightingResponse = {
    ...toPublicSightingResponse(source),
    editable: isOwnerEditableSighting(source),
  };

  if (options.includeExactLocation && source.exactLocation) {
    response.exactLocation = {
      latitude: source.exactLocation.latitude,
      longitude: source.exactLocation.longitude,
    };
  }

  return response;
}

export function toPaginatedPublicSightingsResponse(
  source: PaginatedSightingsRecord,
): PaginatedSightingsResponse<PublicSightingResponse> {
  return {
    items: source.items.map((item) => toPublicSightingResponse(toResponseSource(item))),
    page: source.page,
    pageSize: source.pageSize,
    total: source.total,
    totalPages: source.totalPages,
  };
}

export function toPaginatedAuthorizedSightingsResponse(
  source: PaginatedSightingsRecord,
): PaginatedSightingsResponse<AuthorizedSightingResponse> {
  return {
    items: source.items.map((item) =>
      toAuthorizedSightingResponse(toResponseSource(item), { includeExactLocation: false }),
    ),
    page: source.page,
    pageSize: source.pageSize,
    total: source.total,
    totalPages: source.totalPages,
  };
}

export function toResponseSource(record: SightingRecord): SightingResponseSource {
  return {
    animalCount: record.animalCount,
    collarStatus: record.collarStatus,
    color: record.color,
    condition: record.condition,
    createdAt: record.createdAt,
    description: record.description,
    distanceMeters: record.distanceMeters,
    exactLocation: record.exactLocation,
    id: record.id,
    lifecycleStatus: record.lifecycleStatus,
    pattern: record.pattern,
    publicLocation: record.publicLocation,
    publicRadiusMeters: record.publicRadiusMeters,
    reporterId: record.reporterId,
    seenAt: record.seenAt,
    species: record.species,
    updatedAt: record.updatedAt,
    urgency: record.urgency,
    verificationStatus: record.verificationStatus,
  };
}
