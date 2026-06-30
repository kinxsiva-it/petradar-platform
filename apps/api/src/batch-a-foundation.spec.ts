import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ConfigService } from '@nestjs/config';
import {
  AccountStatus,
  AnimalCondition,
  AnimalSpecies,
  CollarStatus,
  Prisma,
  SightingLifecycleStatus,
  UrgencyLevel,
  UserRole,
  VerificationStatus,
  VolunteerVerificationState,
} from '@prisma/client';

import { AuditService } from '@petradar/backend/audit';
import { LocationPrivacyService } from '@petradar/backend/shared';
import {
  SightingsRepository,
  toAuthorizedSightingResponse,
  toPublicSightingResponse,
  type SightingResponseSource,
} from '@petradar/backend/sightings';
import { UsersRepository } from '@petradar/backend/users';

function configService(values: Record<string, unknown>): ConfigService {
  return {
    get: jest.fn((key: string) => values[key]),
  } as unknown as ConfigService;
}

function distanceMeters(a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }): number {
  const earthRadiusMeters = 6_371_000;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;
  const haversine =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return earthRadiusMeters * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

describe('Batch A location privacy foundation', () => {
  const service = new LocationPrivacyService(
    configService({
      LOCATION_OBFUSCATION_SECRET: 'a-secure-test-secret-that-is-long-enough',
      LOCATION_PRIVACY_RADIUS_METERS: 300,
    }),
  );

  it('validates latitude range', () => {
    expect(() => {
      service.assertLatitude(91);
    }).toThrow(RangeError);
    expect(() => {
      service.assertLatitude(-91);
    }).toThrow(RangeError);
    expect(() => {
      service.assertLatitude(13.7563);
    }).not.toThrow();
  });

  it('validates longitude range', () => {
    expect(() => {
      service.assertLongitude(181);
    }).toThrow(RangeError);
    expect(() => {
      service.assertLongitude(-181);
    }).toThrow(RangeError);
    expect(() => {
      service.assertLongitude(100.5018);
    }).not.toThrow();
  });

  it('generates deterministic public locations within the configured radius', () => {
    const exact = { latitude: 13.7563, longitude: 100.5018 };
    const first = service.generatePublicLocation({ entityId: 'sighting-1', ...exact });
    const second = service.generatePublicLocation({ entityId: 'sighting-1', ...exact });

    expect(first).toEqual(second);
    expect(distanceMeters(exact, first)).toBeLessThanOrEqual(first.radiusMeters + 1);
    expect(first).not.toMatchObject(exact);
  });

  it('wraps longitude and clamps polar latitude for public locations', () => {
    const wrapped = service.generatePublicLocation({
      entityId: 'anti-meridian-sighting',
      latitude: 0,
      longitude: 179.9999,
      radiusMeters: 300,
    });
    const polar = service.generatePublicLocation({
      entityId: 'polar-sighting',
      latitude: 89.9999,
      longitude: 45,
      radiusMeters: 300,
    });

    expect(wrapped.longitude).toBeGreaterThanOrEqual(-180);
    expect(wrapped.longitude).toBeLessThanOrEqual(180);
    expect(polar.latitude).toBeGreaterThanOrEqual(-90);
    expect(polar.latitude).toBeLessThanOrEqual(90);
  });
});

describe('Batch A sighting response mappers', () => {
  const source: SightingResponseSource = {
    animalCount: 1,
    collarStatus: CollarStatus.RED_COLLAR_WITH_BELL,
    color: 'Orange',
    condition: AnimalCondition.NORMAL_STRAY,
    createdAt: new Date('2026-06-29T00:00:00.000Z'),
    description: 'Friendly and calm.',
    exactLocation: { latitude: 12.345678, longitude: 98.765432 },
    id: 'sighting-id',
    lifecycleStatus: SightingLifecycleStatus.SIGHTING,
    pattern: 'Tabby',
    photos: [],
    publicLocation: { latitude: 13.751, longitude: 100.501 },
    publicRadiusMeters: 300,
    seenAt: new Date('2026-06-29T00:10:00.000Z'),
    species: AnimalSpecies.CAT,
    updatedAt: new Date('2026-06-29T00:20:00.000Z'),
    urgency: UrgencyLevel.LOW,
    verificationStatus: VerificationStatus.PENDING,
  };

  it('excludes exact location from public responses', () => {
    const response = toPublicSightingResponse(source);

    expect(response).not.toHaveProperty('exactLocation');
    expect(JSON.stringify(response)).not.toContain('12.345678');
    expect(JSON.stringify(response)).not.toContain('98.765432');
    expect(response.publicLocation).toEqual({
      latitude: 13.751,
      longitude: 100.501,
      radiusMeters: 300,
    });
  });

  it('includes exact location only when explicitly authorized', () => {
    expect(toAuthorizedSightingResponse(source, { includeExactLocation: false })).not.toHaveProperty('exactLocation');
    expect(toAuthorizedSightingResponse(source, { includeExactLocation: true })).toHaveProperty('exactLocation', {
      latitude: 12.345678,
      longitude: 98.765432,
    });
  });
});

describe('Batch A audit metadata protection', () => {
  it('removes sensitive metadata keys recursively', () => {
    const service = new AuditService({} as never);
    const metadata = service.sanitizeMetadata({
      action: 'created',
      exactLatitude: 13.75,
      nested: {
        database_url: 'secret',
        note: 'safe',
        rawToken: 'token',
      },
      password: 'secret',
    });

    expect(metadata).toEqual({
      action: 'created',
      nested: {
        note: 'safe',
      },
    });
  });
});

describe('Batch A persistence helpers', () => {
  it('normalizes email before persistence', async () => {
    interface UserCreateArgs {
      data: { email: string };
    }
    const create = jest.fn<Promise<{ id: string }>, [UserCreateArgs]>().mockResolvedValue({ id: 'user-id' });
    const prisma = {
      user: {
        create,
      },
    };
    const repository = new UsersRepository(prisma as never);

    await repository.create({
      displayName: 'Nicha',
      email: '  NICHA@Example.COM ',
      passwordHash: 'hashed',
      roles: [UserRole.REPORTER],
      status: AccountStatus.ACTIVE,
      volunteerVerification: VolunteerVerificationState.NOT_APPLICABLE,
    });

    expect(create).toHaveBeenCalledTimes(1);
    const [createArgs] = create.mock.calls[0] ?? [];
    expect(createArgs?.data.email).toBe('nicha@example.com');
  });

  it('uses a parameterized PostGIS public-location radius query', async () => {
    const queryRaw = jest
      .fn<Promise<{ distance_meters: number; id: string }[]>, [Prisma.Sql]>()
      .mockResolvedValue([{ distance_meters: 12.5, id: 'sighting-id' }]);
    const prisma = {
      $queryRaw: queryRaw,
    };
    const location = new LocationPrivacyService(
      configService({
        LOCATION_OBFUSCATION_SECRET: 'a-secure-test-secret-that-is-long-enough',
        LOCATION_PRIVACY_RADIUS_METERS: 300,
      }),
    );
    const repository = new SightingsRepository(prisma as never, location);

    await expect(
      repository.findPublicNearby({ latitude: 13.7563, longitude: 100.5018, radiusMeters: 500 }),
    ).resolves.toEqual([{ distanceMeters: 12.5, id: 'sighting-id' }]);

    expect(queryRaw).toHaveBeenCalledTimes(1);
    const [queryArgument] = queryRaw.mock.calls[0] ?? [];
    expect(typeof queryArgument).toBe('object');
    expect(JSON.stringify(queryArgument)).toContain('ST_DWithin');
    expect(JSON.stringify(queryArgument)).toContain('public_location');
  });
});

describe('Batch A migration contract', () => {
  const migrationSql = readFileSync(
    join(process.cwd(), 'prisma/migrations/0002_foundation_sightings_audit/migration.sql'),
    'utf8',
  );

  it('defines required constraints and spatial indexes', () => {
    expect(migrationSql).toContain('animal_sightings_animal_count_positive');
    expect(migrationSql).toContain('animal_sightings_public_radius_positive');
    expect(migrationSql).toContain('USING GIST ("exact_location")');
    expect(migrationSql).toContain('USING GIST ("public_location")');
  });
});
