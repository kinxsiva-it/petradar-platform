import {
  toApiListFilters,
  toCreateSightingRequest,
  toPublicSightingView,
  toUserReportView,
} from './sighting-ui.mapper.js';
import type {
  OwnerSightingApiResponse,
  PublicSightingApiResponse,
} from './sightings-api.models.js';

const publicSighting: PublicSightingApiResponse = {
  animalCount: 1,
  collarStatus: 'NO_COLLAR',
  color: 'White',
  condition: 'INJURED',
  createdAt: '2026-06-30T00:00:00.000Z',
  description: 'Limping near the roadside.',
  distanceMeters: 125.4,
  id: '11111111-1111-4111-8111-111111111111',
  lifecycleStatus: 'SIGHTING',
  pattern: 'Solid',
  publicLocation: { latitude: 13.751, longitude: 100.502, radiusMeters: 300 },
  seenAt: '2026-06-30T01:00:00.000Z',
  species: 'DOG',
  updatedAt: '2026-06-30T02:00:00.000Z',
  urgency: 'HIGH',
  verificationStatus: 'PENDING',
};

describe('sighting UI mappers', () => {
  it('creates report requests without reporter, public location, or server statuses', () => {
    const request = toCreateSightingRequest({
      animalCount: 1,
      collarStatus: 'No collar',
      color: 'White',
      condition: 'Injured',
      description: 'Limping near the roadside.',
      latitude: 13.7563,
      longitude: 100.5018,
      pattern: 'Solid',
      seenAt: '2026-06-30T01:00:00.000Z',
      species: 'Dog',
      urgency: 'High',
    });

    expect(request).toMatchObject({
      condition: 'INJURED',
      count: 1,
      latitude: 13.7563,
      longitude: 100.5018,
      species: 'DOG',
    });
    expect(request).not.toHaveProperty('reporterId');
    expect(request).not.toHaveProperty('publicLocation');
    expect(request).not.toHaveProperty('verificationStatus');
    expect(request).not.toHaveProperty('lifecycleStatus');
  });

  it('maps public API sightings to marker data without exact coordinates', () => {
    const view = toPublicSightingView(publicSighting);

    expect(view.approximateLocation).toMatchObject({
      latitude: 13.751,
      longitude: 100.502,
      radiusMeters: 300,
    });
    expect(view.distanceLabel).toBe('125 m away');
    expect(JSON.stringify(view)).not.toContain('13.7563');
    expect(JSON.stringify(view)).not.toContain('100.5018');
  });

  it('maps owner responses to editable report cards', () => {
    const view = toUserReportView({
      ...publicSighting,
      editable: false,
      exactLocation: { latitude: 13.7563, longitude: 100.5018 },
    } satisfies OwnerSightingApiResponse);

    expect(view.editable).toBe(false);
    expect(view.lifecycleStatus).toBe('Submitted');
    expect(view.verificationStatus).toBe('Pending');
  });

  it('translates map filter selections into API query parameters', () => {
    expect(
      toApiListFilters({
        condition: 'Injured',
        lifecycleStatus: 'Needs rescue',
        query: 'white dog',
        species: 'Dog',
        verificationStatus: 'Pending',
      }),
    ).toEqual({
      condition: 'INJURED',
      lifecycleStatus: 'NEEDS_RESCUE',
      query: 'white dog',
      species: 'DOG',
      verificationStatus: 'PENDING',
    });
  });
});
