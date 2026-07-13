import { apiRequest } from '../../lib/api/http-client';
import { arrayField, enumField, isRecord, nullableNumberField, nullableStringField, numberField, stringField } from '../../lib/api/parse';
import type { AnimalCondition, AnimalSpecies, SightingLifecycleStatus, UrgencyLevel, VerificationStatus } from '../sightings/sighting-types';

export interface PublicMapSighting {
  condition: AnimalCondition;
  distanceMeters: number | null;
  id: string;
  latitude: number;
  lifecycleStatus: SightingLifecycleStatus;
  longitude: number;
  radiusMeters: number;
  seenAt: string;
  species: AnimalSpecies;
  thumbnailUrl: string | null;
  urgency: UrgencyLevel;
  verificationStatus: VerificationStatus;
}

export interface MapFilters { condition?: AnimalCondition; species?: AnimalSpecies; }

const species: readonly AnimalSpecies[] = ['CAT', 'DOG', 'OTHER'];
const conditions: readonly AnimalCondition[] = ['NORMAL_STRAY', 'INJURED', 'NEEDS_RESCUE', 'NEWBORN_LITTER', 'POSSIBLE_LOST_PET', 'SICK', 'PREGNANT', 'AGGRESSIVE', 'UNKNOWN'];
const urgencies: readonly UrgencyLevel[] = ['LOW', 'MEDIUM', 'HIGH', 'EMERGENCY'];
const lifecycles: readonly SightingLifecycleStatus[] = ['SIGHTING', 'POSSIBLE_MATCH', 'NEEDS_RESCUE', 'REUNITED', 'CLOSED'];
const verifications: readonly VerificationStatus[] = ['PENDING', 'VERIFIED', 'COMMUNITY_VERIFIED', 'NEEDS_REVIEW', 'REJECTED', 'DUPLICATE'];

export async function listMapSightings(filters: MapFilters): Promise<PublicMapSighting[]> {
  const query = new URLSearchParams({ pageSize: '100' });
  if (filters.condition) query.set('condition', filters.condition);
  if (filters.species) query.set('species', filters.species);
  return parsePage(await apiRequest<unknown>(`map/sightings?${query.toString()}`));
}

export async function listNearbySightings(latitude: number, longitude: number): Promise<PublicMapSighting[]> {
  const query = new URLSearchParams({ lat: String(latitude), limit: '100', lng: String(longitude), radius: '5000' });
  return parsePage(await apiRequest<unknown>(`map/nearby?${query.toString()}`));
}

function parsePage(value: unknown): PublicMapSighting[] {
  if (!isRecord(value)) throw new Error('The public map response was not valid.');
  return arrayField(value, 'items').map(parseSighting).filter((item) => item.radiusMeters > 0);
}

function parseSighting(value: unknown): PublicMapSighting {
  if (!isRecord(value)) throw new Error('A public map marker was not valid.');
  const latitude = numberField(value, 'latitude');
  const longitude = numberField(value, 'longitude');
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) throw new Error('A public map marker had invalid coordinates.');
  return {
    condition: enumField(value, 'condition', conditions),
    distanceMeters: nullableNumberField(value, 'distanceMeters'),
    id: stringField(value, 'id'),
    latitude,
    lifecycleStatus: enumField(value, 'lifecycleStatus', lifecycles),
    longitude,
    radiusMeters: numberField(value, 'radiusMeters'),
    seenAt: stringField(value, 'seenAt'),
    species: enumField(value, 'species', species),
    thumbnailUrl: nullableStringField(value, 'thumbnailUrl'),
    urgency: enumField(value, 'urgency', urgencies),
    verificationStatus: enumField(value, 'verificationStatus', verifications),
  };
}
