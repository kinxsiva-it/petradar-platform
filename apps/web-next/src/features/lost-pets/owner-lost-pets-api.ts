import {
  arrayField,
  enumField,
  isRecord,
  nullableNumberField,
  nullableStringField,
  numberField,
  optionalBooleanField,
  recordField,
  safeMediaUrl,
  stringField,
  stringListField,
} from '../../lib/api/parse';
import type { AuthenticatedRequest } from '../auth/auth-types';
import type { AnimalSpecies, LostPetSex, LostPetStatus } from './lost-pet-types';

export interface OwnerLostPet {
  age: string | null;
  breed: string | null;
  collarDescription: string | null;
  color: string | null;
  contactMethod: string | null;
  description: string | null;
  exactLocation: { latitude: number; longitude: number } | null;
  id: string;
  lastSeenAt: string;
  microchipped: boolean;
  name: string;
  pattern: string | null;
  photoUrls: string[];
  publicRadiusMeters: number;
  rewardCents: number | null;
  sex: LostPetSex;
  species: AnimalSpecies;
  status: LostPetStatus;
}

export interface SaveLostPetRequest {
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
  rewardCents?: number;
  sex: LostPetSex;
  species: AnimalSpecies;
}

const species: readonly AnimalSpecies[] = ['CAT', 'DOG', 'OTHER'];
const sexes: readonly LostPetSex[] = ['FEMALE', 'MALE', 'UNKNOWN'];
const statuses: readonly LostPetStatus[] = ['CLOSED', 'LOST', 'POSSIBLE_MATCH', 'REUNITED'];

export async function listMyLostPets(request: AuthenticatedRequest): Promise<OwnerLostPet[]> {
  const value = await request<unknown>('lost-pets/mine?page=1&pageSize=50');
  if (!isRecord(value)) throw new Error('The owner lost-pet list response was not valid.');
  return arrayField(value, 'items').map((item) => parseOwnerLostPet(item, false));
}

export async function getMyLostPet(request: AuthenticatedRequest, id: string): Promise<OwnerLostPet> {
  return parseOwnerLostPet(await request<unknown>(`lost-pets/mine/${encodeURIComponent(id)}`), true);
}

export async function createLostPet(request: AuthenticatedRequest, payload: SaveLostPetRequest): Promise<OwnerLostPet> {
  return parseOwnerLostPet(await request<unknown>('lost-pets', { json: payload, method: 'POST' }), true);
}

export async function updateLostPet(request: AuthenticatedRequest, id: string, payload: Partial<SaveLostPetRequest>): Promise<OwnerLostPet> {
  return parseOwnerLostPet(await request<unknown>(`lost-pets/${encodeURIComponent(id)}`, { json: payload, method: 'PATCH' }), true);
}

function parseOwnerLostPet(value: unknown, includeExact: boolean): OwnerLostPet {
  if (!isRecord(value)) throw new Error('An owner lost-pet response was not valid.');
  const publicLocation = recordField(value, 'publicLocation');
  const exactValue = value['exactLocation'];
  const exactLocation = includeExact && isRecord(exactValue) ? { latitude: numberField(exactValue, 'latitude'), longitude: numberField(exactValue, 'longitude') } : null;
  return {
    age: nullableStringField(value, 'age'),
    breed: nullableStringField(value, 'breed'),
    collarDescription: nullableStringField(value, 'collarDescription'),
    color: nullableStringField(value, 'color'),
    contactMethod: nullableStringField(value, 'contactMethod'),
    description: nullableStringField(value, 'description'),
    exactLocation,
    id: stringField(value, 'id'),
    lastSeenAt: stringField(value, 'lastSeenAt'),
    microchipped: optionalBooleanField(value, 'microchipped') ?? false,
    name: stringField(value, 'name'),
    pattern: nullableStringField(value, 'pattern'),
    photoUrls: stringListField(value, 'photoUrls').filter(safeMediaUrl),
    publicRadiusMeters: numberField(publicLocation, 'radiusMeters'),
    rewardCents: nullableNumberField(value, 'rewardCents'),
    sex: enumField(value, 'sex', sexes),
    species: enumField(value, 'species', species),
    status: enumField(value, 'status', statuses),
  };
}
