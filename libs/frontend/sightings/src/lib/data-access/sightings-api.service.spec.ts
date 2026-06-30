import { HttpClient, HttpParams } from '@angular/common/http';
import { Injector, runInInjectionContext } from '@angular/core';
import { of } from 'rxjs';

import { API_BASE_PATH } from '@petradar/frontend/core';

import { SightingsApiService } from './sightings-api.service.js';
import type { CreateSightingRequest, OwnerSightingApiResponse } from './sightings-api.models.js';

interface HttpOptionsWithParams {
  params: HttpParams;
}

let http: {
  get: ReturnType<typeof vi.fn>;
  patch: ReturnType<typeof vi.fn>;
  post: ReturnType<typeof vi.fn>;
};

describe('SightingsApiService', () => {
  let service: SightingsApiService;

  beforeEach(() => {
    http = {
      get: vi
        .fn()
        .mockReturnValue(of({ items: [], page: 1, pageSize: 50, total: 0, totalPages: 0 })),
      patch: vi.fn().mockReturnValue(of(ownerResponse())),
      post: vi.fn().mockReturnValue(of(ownerResponse())),
    };
    const injector = Injector.create({
      providers: [
        SightingsApiService,
        { provide: HttpClient, useValue: http },
        { provide: API_BASE_PATH, useValue: '/api/v1' },
      ],
    });

    service = runInInjectionContext(injector, () => injector.get(SightingsApiService));
  });

  it('posts create sighting requests without reporter or server-controlled fields', () => {
    service
      .create({
        collarStatus: 'NO_COLLAR',
        color: 'White',
        condition: 'INJURED',
        count: 1,
        description: 'Limping near the roadside.',
        latitude: 13.7563,
        longitude: 100.5018,
        seenAt: '2026-06-30T01:00:00.000Z',
        species: 'DOG',
        urgency: 'HIGH',
      })
      .subscribe();

    expect(http.post).toHaveBeenCalledWith('/api/v1/sightings', expect.any(Object));
    const body = postBody();
    expect(body).not.toHaveProperty('reporterId');
    expect(body).not.toHaveProperty('publicLocation');
    expect(body).not.toHaveProperty('publicLatitude');
    expect(body).not.toHaveProperty('publicRadiusMeters');
    expect(body).not.toHaveProperty('verificationStatus');
    expect(body).not.toHaveProperty('lifecycleStatus');
  });

  it('generates public list query parameters for API-backed map filters', () => {
    service
      .listPublic({
        condition: 'INJURED',
        pageSize: 50,
        query: 'white',
        species: 'DOG',
        verificationStatus: 'PENDING',
      })
      .subscribe();

    const options = getOptions();
    expect(http.get).toHaveBeenCalledWith('/api/v1/sightings', options);
    expect(options.params.get('species')).toBe('DOG');
    expect(options.params.get('condition')).toBe('INJURED');
    expect(options.params.get('verificationStatus')).toBe('PENDING');
    expect(options.params.get('query')).toBe('white');
    expect(options.params.get('pageSize')).toBe('50');
  });

  it('uses owner endpoints for authenticated reports and updates', () => {
    service.mySightings({ pageSize: 50 }).subscribe();
    expect(http.get).toHaveBeenCalledWith('/api/v1/sightings/mine', getOptions());

    service.update('sighting-id', { color: 'Black' }).subscribe();
    expect(http.patch).toHaveBeenCalledWith('/api/v1/sightings/sighting-id', { color: 'Black' });
  });
});

function postBody(): CreateSightingRequest {
  const calls = httpPostCalls();
  const body = calls[0]?.[1];
  if (!body) {
    throw new Error('Expected a POST request body.');
  }

  return body;
}

function getOptions(index = 0): HttpOptionsWithParams {
  const calls = httpGetCalls();
  const options = calls[index]?.[1];
  if (!options) {
    throw new Error('Expected GET request options.');
  }

  return options;
}

function httpPostCalls(): [string, CreateSightingRequest][] {
  return http.post.mock.calls as [string, CreateSightingRequest][];
}

function httpGetCalls(): [string, HttpOptionsWithParams][] {
  return http.get.mock.calls as [string, HttpOptionsWithParams][];
}

function ownerResponse(
  overrides: Partial<OwnerSightingApiResponse> = {},
): OwnerSightingApiResponse {
  return {
    ...baseResponse(),
    editable: true,
    exactLocation: { latitude: 13.7563, longitude: 100.5018 },
    ...overrides,
  };
}

function baseResponse() {
  return {
    animalCount: 1,
    collarStatus: 'NO_COLLAR',
    color: 'White',
    condition: 'INJURED',
    createdAt: '2026-06-30T00:00:00.000Z',
    description: 'Limping near the roadside.',
    id: 'sighting-id',
    lifecycleStatus: 'SIGHTING',
    pattern: null,
    publicLocation: { latitude: 13.751, longitude: 100.502, radiusMeters: 300 },
    seenAt: '2026-06-30T01:00:00.000Z',
    species: 'DOG',
    updatedAt: '2026-06-30T02:00:00.000Z',
    urgency: 'HIGH',
    verificationStatus: 'PENDING',
  } as const;
}
