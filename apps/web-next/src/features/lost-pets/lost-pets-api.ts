import { apiRequest } from '../../lib/api/http-client';
import type {
  AnimalSpecies,
  LostPetListFilters,
  LostPetSex,
  LostPetStatus,
  PublicLostPet,
  PublicLostPetPage,
} from './lost-pet-types';

const speciesValues: readonly AnimalSpecies[] = ['CAT', 'DOG', 'OTHER'];
const sexValues: readonly LostPetSex[] = ['FEMALE', 'MALE', 'UNKNOWN'];
const statusValues: readonly LostPetStatus[] = ['CLOSED', 'LOST', 'POSSIBLE_MATCH', 'REUNITED'];

export async function listPublicLostPets(
  filters: LostPetListFilters,
): Promise<PublicLostPetPage> {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== '') {
      query.set(key, String(value));
    }
  }

  const payload = await apiRequest<unknown>(`lost-pets?${query.toString()}`);
  return parsePublicLostPetPage(payload);
}

export async function getPublicLostPet(id: string): Promise<PublicLostPet> {
  const payload = await apiRequest<unknown>(`lost-pets/${encodeURIComponent(id)}`);
  return parsePublicLostPet(payload);
}

function parsePublicLostPetPage(value: unknown): PublicLostPetPage {
  if (!isRecord(value) || !Array.isArray(value['items'])) {
    throw new Error('The lost-pet list response was not valid.');
  }

  return {
    items: value['items'].map(parsePublicLostPet),
    page: requiredNumber(value, 'page'),
    pageSize: requiredNumber(value, 'pageSize'),
    total: requiredNumber(value, 'total'),
    totalPages: requiredNumber(value, 'totalPages'),
  };
}

function parsePublicLostPet(value: unknown): PublicLostPet {
  if (!isRecord(value)) {
    throw new Error('A lost-pet response was not valid.');
  }

  const publicLocation = value['publicLocation'];
  if (!isRecord(publicLocation)) {
    throw new Error('A lost-pet public location was not valid.');
  }

  return {
    age: nullableString(value, 'age'),
    approximateRadiusMeters: requiredNumber(publicLocation, 'radiusMeters'),
    breed: nullableString(value, 'breed'),
    collarDescription: nullableString(value, 'collarDescription'),
    color: nullableString(value, 'color'),
    createdAt: requiredString(value, 'createdAt'),
    description: nullableString(value, 'description'),
    id: requiredString(value, 'id'),
    lastSeenAt: requiredString(value, 'lastSeenAt'),
    name: requiredString(value, 'name'),
    pattern: nullableString(value, 'pattern'),
    photoUrls: stringArray(value, 'photoUrls').filter(isSafePhotoUrl),
    rewardCents: nullableNumber(value, 'rewardCents'),
    sex: enumValue(value, 'sex', sexValues),
    species: enumValue(value, 'species', speciesValues),
    status: enumValue(value, 'status', statusValues),
    updatedAt: requiredString(value, 'updatedAt'),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function requiredString(value: Record<string, unknown>, key: string): string {
  const field = value[key];
  if (typeof field !== 'string') throw new Error(`Expected ${key} to be a string.`);
  return field;
}

function nullableString(value: Record<string, unknown>, key: string): string | null {
  const field = value[key];
  if (field === null || field === undefined) return null;
  if (typeof field !== 'string') throw new Error(`Expected ${key} to be text or null.`);
  return field;
}

function requiredNumber(value: Record<string, unknown>, key: string): number {
  const field = value[key];
  if (typeof field !== 'number' || !Number.isFinite(field)) {
    throw new Error(`Expected ${key} to be a number.`);
  }
  return field;
}

function nullableNumber(value: Record<string, unknown>, key: string): number | null {
  const field = value[key];
  if (field === null || field === undefined) return null;
  if (typeof field !== 'number' || !Number.isFinite(field)) {
    throw new Error(`Expected ${key} to be a number or null.`);
  }
  return field;
}

function stringArray(value: Record<string, unknown>, key: string): string[] {
  const field = value[key];
  if (!Array.isArray(field) || !field.every((item) => typeof item === 'string')) {
    throw new Error(`Expected ${key} to be a list of strings.`);
  }
  return field;
}

function enumValue<T extends string>(
  value: Record<string, unknown>,
  key: string,
  values: readonly T[],
): T {
  const field = value[key];
  if (typeof field !== 'string') {
    throw new Error(`Expected ${key} to be a supported value.`);
  }
  const match = values.find((value) => value === field);
  if (!match) {
    throw new Error(`Expected ${key} to be a supported value.`);
  }
  return match;
}

function isSafePhotoUrl(value: string): boolean {
  return value.startsWith('/') || value.startsWith('https://') || value.startsWith('http://');
}
