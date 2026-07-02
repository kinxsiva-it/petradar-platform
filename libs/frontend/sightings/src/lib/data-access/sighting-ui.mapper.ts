import type {
  ApiAnimalCondition,
  ApiAnimalSpecies,
  ApiCollarStatus,
  ApiSightingLifecycleStatus,
  ApiUrgencyLevel,
  ApiVerificationStatus,
  CreateSightingRequest,
  OwnerSightingApiResponse,
  PublicSightingApiResponse,
  SightingListFilters,
  UpdateSightingRequest,
} from './sightings-api.models.js';

export type AnimalSpecies = 'Cat' | 'Dog' | 'Other';
export type VerificationStatus =
  | 'Community verified'
  | 'Duplicate'
  | 'Needs review'
  | 'Pending'
  | 'Rejected'
  | 'Verified';

export interface PublicSighting {
  approximateLocation: {
    area: string;
    label: string;
    latitude: number;
    longitude: number;
    radiusMeters: number;
  };
  collarStatus: string;
  color: string;
  condition: string;
  description: string;
  distanceLabel: string;
  id: string;
  pattern?: string;
  photos: { id: string; sortOrder: number; url: string }[];
  photoUrls: string[];
  reference: string;
  reporterLabel: string;
  seenAt: string;
  species: AnimalSpecies;
  status: string;
  title: string;
  urgency: string;
  verificationStatus: VerificationStatus;
  matchConfidence?: number;
}

export interface UserReport {
  animalCount: number;
  approximateLocationLabel: string;
  collarStatus: string;
  color: string;
  condition: string;
  description: string;
  editable: boolean;
  id: string;
  lifecycleStatus: 'Closed' | 'Needs rescue' | 'Possible match' | 'Submitted';
  matchCount: number;
  pattern: string;
  photos?: { id: string; sortOrder: number; url: string }[];
  photoUrls: string[];
  publicRadiusMeters: number;
  reference: string;
  rejectionReason: string | null; 
  seenAt: string;
  species: AnimalSpecies;
  title: string;
  urgency: string;
  verificationStatus: VerificationStatus;
}

const placeholderPhotoUrl =
  'https://images.unsplash.com/photo-1574158622682-e40e69881006?auto=format&fit=crop&w=900&q=80';

export function toPublicSightingView(sighting: PublicSightingApiResponse): PublicSighting {
  return {
    approximateLocation: {
      area: 'Approximate public area',
      label: 'Approximate public area',
      latitude: sighting.publicLocation.latitude,
      longitude: sighting.publicLocation.longitude,
      radiusMeters: sighting.publicLocation.radiusMeters,
    },
    collarStatus: fromApiCollarStatus(sighting.collarStatus),
    color: sighting.color ?? 'Unknown color',
    condition: fromApiCondition(sighting.condition),
    description: sighting.description ?? 'No public description provided.',
    distanceLabel:
      sighting.distanceMeters === undefined
        ? `${String(sighting.publicLocation.radiusMeters)} m public radius`
        : `${String(Math.round(sighting.distanceMeters))} m away`,
    id: sighting.id,
    photos: photoMetadataFor(sighting),
    photoUrls: photoUrlsFor(sighting),
    pattern: sighting.pattern ?? undefined,
    reference: referenceFor(sighting),
    reporterLabel: 'Community reporter',
    seenAt: formatDateTime(sighting.seenAt),
    species: fromApiSpecies(sighting.species),
    status: fromApiLifecycleStatus(sighting.lifecycleStatus),
    title: titleFor(sighting),
    urgency: fromApiUrgency(sighting.urgency),
    verificationStatus: fromApiVerificationStatus(sighting.verificationStatus),
  };
}

export function toUserReportView(sighting: OwnerSightingApiResponse): UserReport {
  return {
    animalCount: sighting.animalCount,
    approximateLocationLabel: 'Approximate public area',
    collarStatus: fromApiCollarStatus(sighting.collarStatus),
    color: sighting.color ?? 'Unknown color',
    condition: fromApiCondition(sighting.condition),
    description: sighting.description ?? '',
    editable: sighting.editable,
    id: sighting.id,
    lifecycleStatus: toUserLifecycleStatus(sighting.lifecycleStatus),
    matchCount: sighting.lifecycleStatus === 'POSSIBLE_MATCH' ? 1 : 0,
    pattern: sighting.pattern ?? '',
    photoUrls: photoUrlsFor(sighting),
    publicRadiusMeters: sighting.publicLocation.radiusMeters,
    reference: referenceFor(sighting),
    rejectionReason: sighting.rejectionReason ?? null,
    seenAt: formatDateTime(sighting.seenAt),
    species: fromApiSpecies(sighting.species),
    title: titleFor(sighting),
    urgency: fromApiUrgency(sighting.urgency),
    verificationStatus: fromApiVerificationStatus(sighting.verificationStatus),
  };
}

export function toCreateSightingRequest(input: {
  animalCount: number;
  collarStatus: string;
  color: string;
  condition: string;
  description: string;
  latitude: number;
  longitude: number;
  pattern: string;
  seenAt: string;
  species: string;
  urgency: string;
}): CreateSightingRequest {
  return {
    collarStatus: toApiCollarStatus(input.collarStatus),
    color: cleanText(input.color),
    condition: toApiCondition(input.condition),
    count: input.animalCount,
    description: cleanText(input.description),
    latitude: input.latitude,
    longitude: input.longitude,
    pattern: cleanText(input.pattern),
    seenAt: input.seenAt,
    species: toApiSpecies(input.species),
    urgency: toApiUrgency(input.urgency),
  };
}

export function toUpdateSightingRequest(input: {
  color: string;
  description: string;
  pattern: string;
}): UpdateSightingRequest {
  return {
    color: cleanText(input.color),
    description: cleanText(input.description),
    pattern: cleanText(input.pattern),
  };
}

export function toApiListFilters(input: {
  condition?: string;
  lifecycleStatus?: string;
  page?: number;
  pageSize?: number;
  query?: string;
  species?: string;
  verificationStatus?: string;
}): SightingListFilters {
  return {
    condition:
      input.condition && input.condition !== 'All' ? toApiCondition(input.condition) : undefined,
    lifecycleStatus:
      input.lifecycleStatus && input.lifecycleStatus !== 'All'
        ? toApiLifecycleStatus(input.lifecycleStatus)
        : undefined,
    page: input.page,
    pageSize: input.pageSize,
    query: cleanText(input.query),
    species: input.species && input.species !== 'All' ? toApiSpecies(input.species) : undefined,
    verificationStatus:
      input.verificationStatus && input.verificationStatus !== 'All'
        ? toApiVerificationStatus(input.verificationStatus)
        : undefined,
  };
}

function cleanText(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) {
    return undefined;
  }

  return trimmed;
}

function referenceFor(sighting: PublicSightingApiResponse): string {
  return `${fromApiSpecies(sighting.species).toUpperCase().slice(0, 3)}-${sighting.id.slice(0, 8).toUpperCase()}`;
}

function titleFor(sighting: PublicSightingApiResponse): string {
  return `${sighting.color ?? 'Unknown'} ${fromApiSpecies(sighting.species).toLowerCase()} sighting`;
}

function photoUrlsFor(sighting: PublicSightingApiResponse): string[] {
  const urls = orderedPhotos(sighting)
    .map((photo) => photo.url)
    .filter((url) => url.trim().length > 0);

  return urls.length > 0 ? urls : [placeholderPhotoUrl];
}

function photoMetadataFor(sighting: PublicSightingApiResponse) {
  return orderedPhotos(sighting).map((photo) => ({
    id: photo.id,
    sortOrder: photo.sortOrder,
    url: photo.url,
  }));
}

function orderedPhotos(sighting: PublicSightingApiResponse) {
  return sighting.photos.slice().sort((left, right) => left.sortOrder - right.sortOrder);
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function toApiSpecies(value: string): ApiAnimalSpecies {
  if (value === 'Cat') return 'CAT';
  if (value === 'Other') return 'OTHER';
  return 'DOG';
}

export function toApiCondition(value: string): ApiAnimalCondition {
  const map: Record<string, ApiAnimalCondition> = {
    Aggressive: 'AGGRESSIVE',
    Injured: 'INJURED',
    'Needs rescue': 'NEEDS_RESCUE',
    'Newborn litter': 'NEWBORN_LITTER',
    'Normal stray': 'NORMAL_STRAY',
    'Possible lost pet': 'POSSIBLE_LOST_PET',
    Pregnant: 'PREGNANT',
    Sick: 'SICK',
    Unknown: 'UNKNOWN',
  };
  return map[value] ?? 'UNKNOWN';
}

export function toApiCollarStatus(value: string): ApiCollarStatus {
  const map: Record<string, ApiCollarStatus> = {
    'Blue collar': 'BLUE_COLLAR',
    'No collar': 'NO_COLLAR',
    Other: 'OTHER',
    'Red collar with bell': 'RED_COLLAR_WITH_BELL',
    Unknown: 'UNKNOWN',
  };
  return map[value] ?? 'UNKNOWN';
}

export function toApiUrgency(value: string): ApiUrgencyLevel {
  const map: Record<string, ApiUrgencyLevel> = {
    Emergency: 'EMERGENCY',
    High: 'HIGH',
    Low: 'LOW',
    Medium: 'MEDIUM',
  };
  return map[value] ?? 'LOW';
}

function toApiLifecycleStatus(value: string): ApiSightingLifecycleStatus {
  const map: Record<string, ApiSightingLifecycleStatus> = {
    Closed: 'CLOSED',
    'Needs rescue': 'NEEDS_RESCUE',
    'Possible match': 'POSSIBLE_MATCH',
    Reunited: 'REUNITED',
    Sighting: 'SIGHTING',
    Submitted: 'SIGHTING',
  };
  return map[value] ?? 'SIGHTING';
}

function toApiVerificationStatus(value: string): ApiVerificationStatus {
  const map: Record<string, ApiVerificationStatus> = {
    'Community verified': 'COMMUNITY_VERIFIED',
    Duplicate: 'DUPLICATE',
    'Needs review': 'NEEDS_REVIEW',
    Pending: 'PENDING',
    Rejected: 'REJECTED',
    Verified: 'VERIFIED',
  };
  return map[value] ?? 'PENDING';
}

function fromApiSpecies(value: ApiAnimalSpecies): 'Cat' | 'Dog' | 'Other' {
  if (value === 'CAT') return 'Cat';
  if (value === 'OTHER') return 'Other';
  return 'Dog';
}

function fromApiCondition(value: ApiAnimalCondition) {
  const map = {
    AGGRESSIVE: 'Aggressive',
    INJURED: 'Injured',
    NEEDS_RESCUE: 'Needs rescue',
    NEWBORN_LITTER: 'Newborn litter',
    NORMAL_STRAY: 'Normal stray',
    POSSIBLE_LOST_PET: 'Possible lost pet',
    PREGNANT: 'Pregnant',
    SICK: 'Sick',
    UNKNOWN: 'Unknown',
  } as const;
  return map[value];
}

function fromApiCollarStatus(value: ApiCollarStatus) {
  const map = {
    BLUE_COLLAR: 'Blue collar',
    NO_COLLAR: 'No collar',
    OTHER: 'Other',
    RED_COLLAR_WITH_BELL: 'Red collar with bell',
    UNKNOWN: 'Unknown',
  } as const;
  return map[value];
}

function fromApiUrgency(value: ApiUrgencyLevel) {
  const map = {
    EMERGENCY: 'Emergency',
    HIGH: 'High',
    LOW: 'Low',
    MEDIUM: 'Medium',
  } as const;
  return map[value];
}

function fromApiLifecycleStatus(value: ApiSightingLifecycleStatus) {
  const map = {
    CLOSED: 'Closed',
    NEEDS_RESCUE: 'Needs rescue',
    POSSIBLE_MATCH: 'Possible match',
    REUNITED: 'Reunited',
    SIGHTING: 'Sighting',
  } as const;
  return map[value];
}

function toUserLifecycleStatus(value: ApiSightingLifecycleStatus) {
  const map = {
    CLOSED: 'Closed',
    NEEDS_RESCUE: 'Needs rescue',
    POSSIBLE_MATCH: 'Possible match',
    REUNITED: 'Closed',
    SIGHTING: 'Submitted',
  } as const;
  return map[value];
}

function fromApiVerificationStatus(value: ApiVerificationStatus) {
  const map = {
    COMMUNITY_VERIFIED: 'Community verified',
    DUPLICATE: 'Duplicate',
    NEEDS_REVIEW: 'Needs review',
    PENDING: 'Pending',
    REJECTED: 'Rejected',
    VERIFIED: 'Verified',
  } as const;
  return map[value];
}
