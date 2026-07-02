import { HttpErrorResponse } from '@angular/common/http';

import type {
  ApiAnimalSpecies,
  ApiErrorResponse,
  ApiLostPetSex,
  ApiLostPetStatus,
  ApiMatchLevel,
  ApiMatchReviewStatus,
  CreateLostPetRequest,
  LostPetApiResponse,
  MatchApiResponse,
} from './lost-pets-api.models.js';

export interface LostPetView {
  ageDescription: string | null;
  apiStatus: ApiLostPetStatus;
  approximateLastSeenLabel: string;
  approximateLastSeenLocation: {
    label: string;
    latitude: number;
    longitude: number;
    radiusMeters: number;
  };
  breed: string | null;
  collarDescription: string | null;
  color: string | null;
  description: string | null;
  id: string;
  lastSeenAt: string;
  lastSeenInputValue: string;
  pattern: string | null;
  petName: string;
  photoUrls: string[];
  possibleMatchCount: number;
  reference: string;
  rewardCents: number | null;
  rewardLabel: string;
  sex: string;
  sexValue: ApiLostPetSex;
  species: string;
  speciesValue: ApiAnimalSpecies;
  status: string;
}

export interface AuthorizedLostPetView extends LostPetView {
  contactMethod: string | null;
  exactLocation?: {
    latitude: number;
    longitude: number;
  };
  microchipped?: boolean;
  ownerId?: string;
}

export interface LostPetMatchView {
  approximateLocationLabel: string;
  distanceLabel: string;
  id: string;
  level: ApiMatchLevel;
  levelLabel: string;
  lostPet: {
    id: string;
    name: string;
  };
  matchedAt: string;
  reasons: string[];
  rejectionReason: string | null;
  reviewStatus: ApiMatchReviewStatus;
  reviewStatusLabel: string;
  reviewedAt: string | null;
  score: number;
  seenAt: string;
  sighting: {
    condition: string;
    id: string;
    publicLocation: {
      latitude: number;
      longitude: number;
      radiusMeters: number;
    };
    seenAt: string;
    species: string;
    speciesValue: ApiAnimalSpecies;
    title: string;
  };
}

const placeholderPhoto =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 240"><rect width="320" height="240" fill="%23eef7f4"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%230f766e" font-family="Arial" font-size="20">PetRadar</text></svg>';

export function toLostPetView(item: LostPetApiResponse, matchCount = 0): LostPetView {
  const publicLabel = approximateLocationLabel(item.publicLocation.latitude, item.publicLocation.longitude);
  return {
    ageDescription: item.age,
    apiStatus: item.status,
    approximateLastSeenLabel: publicLabel,
    approximateLastSeenLocation: {
      label: `${publicLabel} (${String(item.publicLocation.radiusMeters)}m public radius)`,
      latitude: item.publicLocation.latitude,
      longitude: item.publicLocation.longitude,
      radiusMeters: item.publicLocation.radiusMeters,
    },
    breed: item.breed,
    collarDescription: item.collarDescription,
    color: item.color,
    description: item.description,
    id: item.id,
    lastSeenAt: formatDateTime(item.lastSeenAt),
    lastSeenInputValue: toDateTimeLocalValue(item.lastSeenAt),
    pattern: item.pattern,
    petName: item.name,
    photoUrls: item.photoUrls.length > 0 ? item.photoUrls : [placeholderPhoto],
    possibleMatchCount: matchCount,
    reference: `LP-${item.id.slice(0, 8).toUpperCase()}`,
    rewardCents: item.rewardCents,
    rewardLabel: formatReward(item.rewardCents),
    sex: sexLabel(item.sex),
    sexValue: item.sex,
    species: speciesLabel(item.species),
    speciesValue: item.species,
    status: lostPetStatusLabel(item.status),
  };
}

export function toAuthorizedLostPetView(item: LostPetApiResponse, matchCount = 0): AuthorizedLostPetView {
  return {
    ...toLostPetView(item, matchCount),
    contactMethod: item.contactMethod ?? null,
    exactLocation: item.exactLocation,
    microchipped: item.microchipped,
    ownerId: item.ownerId,
  };
}

export function toLostPetMatchView(item: MatchApiResponse): LostPetMatchView {
  return {
    approximateLocationLabel: approximateLocationLabel(
      item.sighting.publicLocation.latitude,
      item.sighting.publicLocation.longitude,
    ),
    distanceLabel: formatDistance(item.distanceMeters),
    id: item.id,
    level: item.level,
    levelLabel: matchLevelLabel(item.level),
    lostPet: item.lostPet,
    matchedAt: formatDateTime(item.matchedAt),
    reasons: item.reasons.map(formatMatchReason),
    rejectionReason: item.rejectionReason,
    reviewStatus: item.reviewStatus,
    reviewStatusLabel: reviewStatusLabel(item.reviewStatus),
    reviewedAt: item.reviewedAt ? formatDateTime(item.reviewedAt) : null,
    score: item.score,
    seenAt: formatDateTime(item.sighting.seenAt),
    sighting: {
      condition: item.sighting.condition,
      id: item.sighting.id,
      publicLocation: item.sighting.publicLocation,
      seenAt: item.sighting.seenAt,
      species: speciesLabel(item.sighting.species),
      speciesValue: item.sighting.species,
      title: `${speciesLabel(item.sighting.species)} sighting`,
    },
  };
}

export function toCreateLostPetRequest(input: {
  age?: string;
  breed?: string;
  collarDescription?: string;
  color?: string;
  contactMethod?: string;
  description?: string;
  lastSeenAt: string;
  latitude: number;
  longitude: number;
  microchipped?: boolean;
  name: string;
  pattern?: string;
  photoUrls?: string[];
  rewardCents?: number | null;
  sex?: ApiLostPetSex;
  species: ApiAnimalSpecies;
}): CreateLostPetRequest {
  const request: CreateLostPetRequest = {
    lastSeenAt: input.lastSeenAt,
    latitude: input.latitude,
    longitude: input.longitude,
    name: input.name.trim(),
    species: input.species,
  };
  const age = clean(input.age);
  const breed = clean(input.breed);
  const collarDescription = clean(input.collarDescription);
  const color = clean(input.color);
  const contactMethod = clean(input.contactMethod);
  const description = clean(input.description);
  const pattern = clean(input.pattern);
  const photoUrls = input.photoUrls?.filter((url) => url.trim().length > 0).map((url) => url.trim());

  if (age) request.age = age;
  if (breed) request.breed = breed;
  if (collarDescription) request.collarDescription = collarDescription;
  if (color) request.color = color;
  if (contactMethod) request.contactMethod = contactMethod;
  if (description) request.description = description;
  if (input.microchipped !== undefined) request.microchipped = input.microchipped;
  if (pattern) request.pattern = pattern;
  if (photoUrls && photoUrls.length > 0) request.photoUrls = photoUrls;
  if (input.rewardCents !== null && input.rewardCents !== undefined) request.rewardCents = input.rewardCents;
  if (input.sex) request.sex = input.sex;

  return request;
}

export function speciesLabel(value: ApiAnimalSpecies): string {
  return value === 'CAT' ? 'Cat' : value === 'DOG' ? 'Dog' : 'Other';
}

export function lostPetStatusLabel(value: ApiLostPetStatus): string {
  const labels: Record<ApiLostPetStatus, string> = {
    CLOSED: 'Closed',
    LOST: 'Lost',
    POSSIBLE_MATCH: 'Possible match',
    REUNITED: 'Reunited',
  };
  return labels[value];
}

export function matchLevelLabel(value: ApiMatchLevel): string {
  const labels: Record<ApiMatchLevel, string> = {
    HIGH: 'High',
    LOW: 'Low',
    MEDIUM: 'Medium',
  };
  return labels[value];
}

export function reviewStatusLabel(value: ApiMatchReviewStatus): string {
  const labels: Record<ApiMatchReviewStatus, string> = {
    CONFIRMED: 'Confirmed',
    PENDING: 'Pending',
    REJECTED: 'Rejected',
  };
  return labels[value];
}

export function toUserMessage(error: unknown, fallback: string): string {
  if (!(error instanceof HttpErrorResponse)) {
    return fallback;
  }

  if (error.status === 0) return 'The PetRadar API is unavailable. Please try again soon.';
  if (error.status === 401) return 'Sign in to continue.';
  if (error.status === 403) return 'You do not have permission to manage this lost-pet post.';
  if (error.status === 404) return 'That lost-pet or match record was not found.';
  if (error.status === 409) return 'This workflow can no longer be completed.';

  const message = isApiErrorResponse(error.error) ? error.error.message : undefined;
  if (Array.isArray(message) && message.length > 0) return message.join(' ');
  if (typeof message === 'string' && message.trim()) return message;
  if (error.status === 400) return 'Check the form fields and try again.';

  return fallback;
}

function sexLabel(value: ApiLostPetSex): string {
  const labels: Record<ApiLostPetSex, string> = {
    FEMALE: 'Female',
    MALE: 'Male',
    UNKNOWN: 'Unknown sex',
  };
  return labels[value];
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function toDateTimeLocalValue(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function approximateLocationLabel(latitude: number, longitude: number): string {
  return `${latitude.toFixed(3)}, ${longitude.toFixed(3)}`;
}

function formatReward(value: number | null): string {
  if (value === null || value <= 0) return 'No reward listed';
  return new Intl.NumberFormat(undefined, { currency: 'USD', style: 'currency' }).format(value / 100);
}

function formatDistance(value: number | null): string {
  if (value === null) return 'Distance unavailable';
  if (value >= 1000) return `${(value / 1000).toFixed(1)} km away`;
  return `${String(Math.round(value))} m away`;
}

function formatMatchReason(value: string): string {
  return value.trim() || 'Possible attribute match';
}

function clean(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ?? undefined;
}

function isApiErrorResponse(value: unknown): value is Pick<ApiErrorResponse, 'message'> {
  return typeof value === 'object' && value !== null && 'message' in value;
}
