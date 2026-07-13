import type { AuthenticatedRequest } from '../auth/auth-types';
import {
  arrayField,
  booleanField,
  enumField,
  isRecord,
  nullableStringField,
  numberField,
  recordField,
  safeMediaUrl,
  stringField,
} from '../../lib/api/parse';
import type {
  AnimalCondition,
  AnimalSpecies,
  CollarStatus,
  CreateSightingRequest,
  OwnerSighting,
  OwnerSightingPage,
  SightingLifecycleStatus,
  UrgencyLevel,
  VerificationStatus,
} from './sighting-types';

const species: readonly AnimalSpecies[] = ['CAT', 'DOG', 'OTHER'];
const conditions: readonly AnimalCondition[] = ['NORMAL_STRAY', 'INJURED', 'NEEDS_RESCUE', 'NEWBORN_LITTER', 'POSSIBLE_LOST_PET', 'SICK', 'PREGNANT', 'AGGRESSIVE', 'UNKNOWN'];
const collars: readonly CollarStatus[] = ['NO_COLLAR', 'RED_COLLAR_WITH_BELL', 'BLUE_COLLAR', 'UNKNOWN', 'OTHER'];
const urgencies: readonly UrgencyLevel[] = ['LOW', 'MEDIUM', 'HIGH', 'EMERGENCY'];
const lifecycles: readonly SightingLifecycleStatus[] = ['SIGHTING', 'POSSIBLE_MATCH', 'NEEDS_RESCUE', 'REUNITED', 'CLOSED'];
const verifications: readonly VerificationStatus[] = ['PENDING', 'VERIFIED', 'COMMUNITY_VERIFIED', 'NEEDS_REVIEW', 'REJECTED', 'DUPLICATE'];

export async function listMySightings(request: AuthenticatedRequest): Promise<OwnerSightingPage> {
  return parseOwnerSightingPage(await request<unknown>('sightings/mine?page=1&pageSize=50'));
}

export async function createSighting(
  request: AuthenticatedRequest,
  payload: CreateSightingRequest,
): Promise<OwnerSighting> {
  return parseOwnerSighting(await request<unknown>('sightings', { json: payload, method: 'POST' }));
}

export async function uploadSightingPhotos(
  request: AuthenticatedRequest,
  sightingId: string,
  files: readonly File[],
): Promise<void> {
  const body = new FormData();
  files.forEach((file) => body.append('photos', file));
  const value = await request<unknown>(`sightings/${encodeURIComponent(sightingId)}/photos`, {
    body,
    method: 'POST',
  });
  if (!isRecord(value)) throw new Error('The photo upload response was not valid.');
  arrayField(value, 'photos');
}

function parseOwnerSightingPage(value: unknown): OwnerSightingPage {
  if (!isRecord(value)) throw new Error('The report list response was not valid.');
  return {
    items: arrayField(value, 'items').map(parseOwnerSighting),
    page: numberField(value, 'page'),
    pageSize: numberField(value, 'pageSize'),
    total: numberField(value, 'total'),
    totalPages: numberField(value, 'totalPages'),
  };
}

function parseOwnerSighting(value: unknown): OwnerSighting {
  if (!isRecord(value)) throw new Error('A report response was not valid.');
  const publicLocation = recordField(value, 'publicLocation');
  const photos = arrayField(value, 'photos')
    .map((photo) => {
      if (!isRecord(photo)) throw new Error('A report photo was not valid.');
      return { sortOrder: numberField(photo, 'sortOrder'), url: stringField(photo, 'url') };
    })
    .filter((photo) => safeMediaUrl(photo.url))
    .sort((left, right) => left.sortOrder - right.sortOrder);

  return {
    animalCount: numberField(value, 'animalCount'),
    collarStatus: enumField(value, 'collarStatus', collars),
    color: nullableStringField(value, 'color'),
    condition: enumField(value, 'condition', conditions),
    description: nullableStringField(value, 'description'),
    editable: booleanField(value, 'editable'),
    id: stringField(value, 'id'),
    lifecycleStatus: enumField(value, 'lifecycleStatus', lifecycles),
    pattern: nullableStringField(value, 'pattern'),
    photoUrls: photos.map((photo) => photo.url),
    publicRadiusMeters: numberField(publicLocation, 'radiusMeters'),
    rejectionReason: nullableStringField(value, 'rejectionReason'),
    seenAt: stringField(value, 'seenAt'),
    species: enumField(value, 'species', species),
    urgency: enumField(value, 'urgency', urgencies),
    verificationStatus: enumField(value, 'verificationStatus', verifications),
  };
}
