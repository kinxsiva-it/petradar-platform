import { expect, type APIRequestContext, type APIResponse, type Page } from '@playwright/test';

export const apiBaseUrl = 'http://localhost:3000/api/v1';
export const webBaseUrl = 'http://localhost:4200';
export const adminBaseUrl = 'http://127.0.0.1:4201';

const demoPassword = 'ChangeMe-PetRadar-Dev-Only-2026';

export const demoUsers = {
  admin: { email: 'admin@petradar.local', password: demoPassword },
  owner: { email: 'owner@petradar.local', password: demoPassword },
  reporter: { email: 'reporter@petradar.local', password: demoPassword },
} as const;

export interface AuthSession {
  accessToken: string;
}

export interface SightingResponse {
  id: string;
  seenAt: string;
  publicLocation: PublicLocation;
}

export interface LostPetResponse {
  id: string;
  name: string;
  publicLocation: PublicLocation;
}

export interface MatchResponse {
  id: string;
  lostPet: {
    id: string;
    name: string;
  };
  reviewStatus: string;
  score: number;
  sighting: {
    id: string;
    publicLocation: PublicLocation;
  };
}

export interface PublicLocation {
  latitude: number;
  longitude: number;
  radiusMeters: number;
}

export interface PaginatedResponse<TItem> {
  items: TItem[];
  total: number;
}

interface ApiRequestOptions {
  data?: unknown;
  token?: string;
}

export async function assertApiHealthy(request: APIRequestContext): Promise<void> {
  const response = await request.get(`${apiBaseUrl}/health`);
  expect(response.ok(), 'PetRadar API must be healthy for API-backed E2E').toBe(true);
}

export async function apiLogin(
  request: APIRequestContext,
  credentials: { email: string; password: string },
): Promise<AuthSession> {
  return apiPost(request, '/auth/login', {
    data: credentials,
    decode: decodeAuthSession,
  });
}

export async function verifySighting(
  request: APIRequestContext,
  adminToken: string,
  sightingId: string,
): Promise<SightingResponse> {
  return apiPatch(request, `/admin/sightings/${encodeURIComponent(sightingId)}/verify`, {
    token: adminToken,
    decode: decodeSightingResponse,
  });
}

export async function createVerifiedSighting(
  request: APIRequestContext,
  reporterToken: string,
  adminToken: string,
  payload: {
    collarStatus?: string;
    color: string;
    condition?: string;
    count: number;
    description: string;
    latitude: number;
    longitude: number;
    pattern: string;
    seenAt: string;
    species: string;
    urgency?: string;
  },
): Promise<SightingResponse> {
  const created = await apiPost(request, '/sightings', {
    data: payload,
    token: reporterToken,
    decode: decodeSightingResponse,
  });
  await verifySighting(request, adminToken, created.id);
  return created;
}

export async function listLostPetMatches(
  request: APIRequestContext,
  ownerToken: string,
  lostPetId: string,
): Promise<MatchResponse[]> {
  const response = await apiGet(request, `/lost-pets/${encodeURIComponent(lostPetId)}/matches`, {
    token: ownerToken,
    decode: decodeLostPetMatchesResponse,
  });
  return response.items;
}

export async function listPendingMatches(
  request: APIRequestContext,
  adminToken: string,
): Promise<PaginatedResponse<MatchResponse>> {
  return apiGet(request, '/matches?status=PENDING&pageSize=50', {
    token: adminToken,
    decode: decodePaginatedMatchesResponse,
  });
}

export async function loginViaUi(
  page: Page,
  credentials: { email: string; password: string },
  options: { baseUrl?: string; expectedHeading?: RegExp | string } = {},
): Promise<void> {
  await page.goto(`${options.baseUrl ?? webBaseUrl}/login`);
  await page.getByLabel('Email address').fill(credentials.email);
  await page.getByLabel('Password').fill(credentials.password);
  await page.getByRole('button', { name: /^log in$/i }).click();
  if (options.expectedHeading) {
    await expect(page.getByRole('heading', { name: options.expectedHeading })).toBeVisible();
  } else {
    await expect(page).not.toHaveURL(/\/login(?:\?|$)/);
  }
}

export function uniqueSuffix(testTitle: string): string {
  const cleaned = testTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return `${cleaned.slice(0, 24)}-${Date.now().toString(36)}`;
}

export async function expectPageDoesNotExposePrivateValues(
  page: Page,
  values: readonly string[],
): Promise<void> {
  const body = page.locator('body');
  for (const value of values) {
    await expect(body).not.toContainText(value);
  }
}

async function apiGet<TResponse>(
  request: APIRequestContext,
  path: string,
  options: ApiRequestOptions & { decode: (value: unknown) => TResponse },
): Promise<TResponse> {
  const response = await request.get(`${apiBaseUrl}${path}`, { headers: authHeaders(options.token) });
  return decodeApiResponse(response, options.decode);
}

async function apiPost<TResponse>(
  request: APIRequestContext,
  path: string,
  options: ApiRequestOptions & { decode: (value: unknown) => TResponse },
): Promise<TResponse> {
  const response = await request.post(`${apiBaseUrl}${path}`, {
    data: options.data,
    headers: authHeaders(options.token),
  });
  return decodeApiResponse(response, options.decode);
}

async function apiPatch<TResponse>(
  request: APIRequestContext,
  path: string,
  options: ApiRequestOptions & { decode: (value: unknown) => TResponse },
): Promise<TResponse> {
  const response = await request.patch(`${apiBaseUrl}${path}`, {
    data: options.data ?? {},
    headers: authHeaders(options.token),
  });
  return decodeApiResponse(response, options.decode);
}

async function decodeApiResponse<TResponse>(
  response: APIResponse,
  decode: (value: unknown) => TResponse,
): Promise<TResponse> {
  const text = await response.text();
  const value = text.length === 0 ? null : JSON.parse(text);
  expect(response.ok(), `API ${response.url()} returned ${response.status()}`).toBe(true);
  return decode(value);
}

function authHeaders(token?: string): Record<string, string> | undefined {
  return token ? { authorization: `Bearer ${token}` } : undefined;
}

function decodeAuthSession(value: unknown): AuthSession {
  const record = expectRecord(value, 'auth session');
  return { accessToken: expectString(record.accessToken, 'auth access token') };
}

function decodeSightingResponse(value: unknown): SightingResponse {
  const record = expectRecord(value, 'sighting response');
  return {
    id: expectString(record.id, 'sighting id'),
    publicLocation: decodePublicLocation(record.publicLocation),
    seenAt: expectString(record.seenAt, 'sighting seenAt'),
  };
}

function decodeLostPetResponse(value: unknown): LostPetResponse {
  const record = expectRecord(value, 'lost pet response');
  return {
    id: expectString(record.id, 'lost pet id'),
    name: expectString(record.name, 'lost pet name'),
    publicLocation: decodePublicLocation(record.publicLocation),
  };
}

function decodeMatchResponse(value: unknown): MatchResponse {
  const record = expectRecord(value, 'match response');
  const lostPet = expectRecord(record.lostPet, 'match lost pet');
  const sighting = expectRecord(record.sighting, 'match sighting');
  return {
    id: expectString(record.id, 'match id'),
    lostPet: {
      id: expectString(lostPet.id, 'match lost pet id'),
      name: expectString(lostPet.name, 'match lost pet name'),
    },
    reviewStatus: expectString(record.reviewStatus, 'match review status'),
    score: expectNumber(record.score, 'match score'),
    sighting: {
      id: expectString(sighting.id, 'match sighting id'),
      publicLocation: decodePublicLocation(sighting.publicLocation),
    },
  };
}

function decodeLostPetMatchesResponse(value: unknown): { items: MatchResponse[] } {
  const record = expectRecord(value, 'lost pet matches response');
  return { items: expectArray(record.items, 'lost pet matches').map(decodeMatchResponse) };
}

function decodePaginatedMatchesResponse(value: unknown): PaginatedResponse<MatchResponse> {
  const record = expectRecord(value, 'paginated matches response');
  return {
    items: expectArray(record.items, 'match items').map(decodeMatchResponse),
    total: expectNumber(record.total, 'match total'),
  };
}

export function decodeBrowserLostPetResponse(value: unknown): LostPetResponse {
  return decodeLostPetResponse(value);
}

export function decodeBrowserSightingResponse(value: unknown): SightingResponse {
  return decodeSightingResponse(value);
}

function decodePublicLocation(value: unknown): PublicLocation {
  const record = expectRecord(value, 'public location');
  return {
    latitude: expectNumber(record.latitude, 'public latitude'),
    longitude: expectNumber(record.longitude, 'public longitude'),
    radiusMeters: expectNumber(record.radiusMeters, 'public radius'),
  };
}

function expectRecord(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`Expected ${label} to be an object.`);
  }
  return value as Record<string, unknown>;
}

function expectArray(value: unknown, label: string): unknown[] {
  if (!Array.isArray(value)) {
    throw new Error(`Expected ${label} to be an array.`);
  }
  return value;
}

function expectString(value: unknown, label: string): string {
  if (typeof value !== 'string') {
    throw new Error(`Expected ${label} to be a string.`);
  }
  return value;
}

function expectNumber(value: unknown, label: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`Expected ${label} to be a finite number.`);
  }
  return value;
}
