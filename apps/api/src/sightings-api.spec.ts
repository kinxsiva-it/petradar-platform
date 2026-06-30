import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { BadRequestException, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { validate } from 'class-validator';
import {
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

import type { AuthenticatedUser } from '@petradar/backend/auth';
import {
  CreateSightingDto,
  SightingsController,
  SightingsRepository,
  SightingsService,
  toPublicSightingResponse,
  type SightingRecord,
} from '@petradar/backend/sightings';

const user: AuthenticatedUser = {
  displayName: 'Nicha',
  email: 'nicha@example.com',
  id: 'user-id',
  roles: [UserRole.REPORTER],
  volunteerVerification: VolunteerVerificationState.NOT_APPLICABLE,
};

const record: SightingRecord = {
  animalCount: 1,
  collarStatus: CollarStatus.UNKNOWN,
  color: 'White',
  condition: AnimalCondition.INJURED,
  createdAt: new Date('2026-06-30T00:00:00.000Z'),
  description: 'Limping near the roadside.',
  exactLocation: { latitude: 13.7563, longitude: 100.5018 },
  id: '11111111-1111-4111-8111-111111111111',
  lifecycleStatus: SightingLifecycleStatus.SIGHTING,
  pattern: 'Solid',
  photos: [],
  publicLocation: { latitude: 13.751, longitude: 100.502 },
  publicRadiusMeters: 300,
  reporterId: user.id,
  seenAt: new Date('2026-06-30T01:00:00.000Z'),
  species: AnimalSpecies.DOG,
  updatedAt: new Date('2026-06-30T02:00:00.000Z'),
  urgency: UrgencyLevel.HIGH,
  verificationStatus: VerificationStatus.PENDING,
};

function createService(
  overrides: {
    audit?: Record<string, jest.Mock>;
    authorization?: Record<string, jest.Mock>;
    prisma?: Record<string, jest.Mock>;
    repository?: Record<string, jest.Mock>;
  } = {},
): SightingsService {
  const audit = {
    create: jest.fn().mockResolvedValue({ id: 'audit-id' }),
    createWithClient: jest.fn().mockResolvedValue({ id: 'audit-id' }),
    ...overrides.audit,
  };
  const authorization = {
    canAccessExactLocation: jest.fn().mockReturnValue(true),
    ...overrides.authorization,
  };
  const repository = {
    create: jest.fn().mockResolvedValue(record),
    findById: jest.fn().mockResolvedValue(record),
    list: jest.fn().mockResolvedValue({
      items: [record],
      page: 1,
      pageSize: 25,
      total: 1,
      totalPages: 1,
    }),
    update: jest.fn().mockResolvedValue(record),
    ...overrides.repository,
  };
  const prisma = {
    $transaction: jest.fn((callback: (tx: unknown) => unknown) =>
      Promise.resolve(callback({ tx: true })),
    ),
    ...overrides.prisma,
  };
  const photoValidation = {
    validate: jest.fn().mockReturnValue([]),
  };
  const photoStorage = {
    delete: jest.fn().mockResolvedValue(undefined),
    provider: 'local',
    read: jest.fn(),
    store: jest.fn(),
  };

  return new SightingsService(
    audit as never,
    authorization,
    prisma as never,
    repository as never,
    photoValidation as never,
    photoStorage as never,
  );
}

function createDto(overrides: Partial<CreateSightingDto> = {}): CreateSightingDto {
  return {
    count: 1,
    latitude: 13.7563,
    longitude: 100.5018,
    seenAt: '2026-06-30T01:00:00.000Z',
    species: AnimalSpecies.DOG,
    ...overrides,
  };
}

describe('Animal sightings API security and privacy', () => {
  it('creates sightings with the authenticated user as reporter', async () => {
    const repository = { create: jest.fn().mockResolvedValue(record) };
    const service = createService({ repository });

    await service.create(user, createDto({ species: AnimalSpecies.CAT }), {
      requestId: 'request-id',
    });

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        reporterId: user.id,
        species: AnimalSpecies.CAT,
      }),
      expect.anything(),
    );
  });

  it('does not accept reporter or server-controlled fields in the create DTO contract', async () => {
    const dto = Object.assign(new CreateSightingDto(), createDto(), {
      lifecycleStatus: SightingLifecycleStatus.CLOSED,
      publicLatitude: 13.75,
      reporterId: 'attacker-id',
      verificationStatus: VerificationStatus.VERIFIED,
    });
    const propertyNames = Object.keys(new CreateSightingDto());

    expect(propertyNames).not.toContain('reporterId');
    expect(propertyNames).not.toContain('publicLatitude');
    expect(propertyNames).not.toContain('lifecycleStatus');
    expect(propertyNames).not.toContain('verificationStatus');
    await expect(validate(dto, { forbidNonWhitelisted: true, whitelist: true })).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ property: 'reporterId' }),
        expect.objectContaining({ property: 'publicLatitude' }),
        expect.objectContaining({ property: 'lifecycleStatus' }),
        expect.objectContaining({ property: 'verificationStatus' }),
      ]),
    );
  });

  it('rejects invalid coordinates and non-positive counts at DTO validation', async () => {
    const dto = Object.assign(new CreateSightingDto(), createDto({ count: 0, latitude: 91 }));
    const errors = await validate(dto);

    expect(errors.map((error) => error.property)).toEqual(
      expect.arrayContaining(['count', 'latitude']),
    );
  });

  it('rejects anonymous controller create calls', () => {
    const controller = new SightingsController(createService());

    expect(() => {
      void controller.create(undefined, createDto(), { header: jest.fn() } as never);
    }).toThrow(UnauthorizedException);
  });

  it('excludes exact location from public responses', () => {
    const response = toPublicSightingResponse(record);

    expect(response).not.toHaveProperty('exactLocation');
    expect(JSON.stringify(response)).not.toContain('13.7563');
    expect(JSON.stringify(response)).not.toContain('100.5018');
  });

  it('uses the authenticated user ID for /mine list queries', async () => {
    const repository = {
      list: jest
        .fn()
        .mockResolvedValue({ items: [], page: 1, pageSize: 25, total: 0, totalPages: 0 }),
    };
    const service = createService({ repository });

    await service.listMine(user, {});

    expect(repository.list).toHaveBeenCalledWith(expect.objectContaining({ reporterId: user.id }));
  });

  it('denies non-owner updates and audits only safe metadata', async () => {
    const audit = { create: jest.fn().mockResolvedValue({ id: 'audit-id' }) };
    const repository = {
      findById: jest.fn().mockResolvedValue({ ...record, reporterId: 'someone-else' }),
    };
    const service = createService({ audit, repository });

    await expect(service.update(user, record.id, { color: 'Black' })).rejects.toThrow(
      ForbiddenException,
    );
    expect(JSON.stringify(audit.create.mock.calls)).not.toContain('13.7563');
    expect(JSON.stringify(audit.create.mock.calls)).not.toContain('100.5018');
  });

  it('allows editable owner updates and passes regenerated-coordinate inputs to the repository', async () => {
    const repository = {
      findById: jest.fn().mockResolvedValue(record),
      update: jest.fn().mockResolvedValue({ ...record, color: 'Black' }),
    };
    const service = createService({ repository });

    await service.update(user, record.id, {
      color: 'Black',
      latitude: 13.75,
      longitude: 100.49,
    });

    expect(repository.update).toHaveBeenCalledWith(
      expect.objectContaining({
        color: 'Black',
        exactLatitude: 13.75,
        exactLongitude: 100.49,
        reporterId: user.id,
      }),
      expect.anything(),
    );
  });

  it('denies owner updates for non-editable records', async () => {
    const repository = {
      findById: jest.fn().mockResolvedValue({
        ...record,
        verificationStatus: VerificationStatus.VERIFIED,
      }),
    };
    const service = createService({ repository });

    await expect(service.update(user, record.id, { color: 'Black' })).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('requires latitude, longitude, and radius together for nearby public search', async () => {
    const service = createService();

    await expect(service.listPublic({ latitude: 13.75 })).rejects.toThrow(BadRequestException);
  });

  it('keeps /mine routes declared before /:id routes', () => {
    const controllerSource = readFileSync(
      join(process.cwd(), 'libs/backend/sightings/src/lib/sightings.controller.ts'),
      'utf8',
    );

    expect(controllerSource.indexOf("@Get('mine')")).toBeLessThan(
      controllerSource.indexOf("@Get(':id')"),
    );
  });
});

describe('Animal sightings repository SQL contract', () => {
  it('uses parameterized PostGIS SQL against public_location for nearby search', async () => {
    const queryRaw = jest
      .fn<Promise<{ distance_meters: number; id: string }[]>, [Prisma.Sql]>()
      .mockResolvedValue([{ distance_meters: 12, id: record.id }]);
    const repository = new SightingsRepository(
      { $queryRaw: queryRaw } as never,
      {
        assertLatitude: jest.fn(),
        assertLongitude: jest.fn(),
      } as never,
    );

    await repository.findPublicNearby({ latitude: 13.75, longitude: 100.5, radiusMeters: 300 });

    const [sql] = queryRaw.mock.calls[0] ?? [];
    expect(JSON.stringify(sql)).toContain('ST_DWithin');
    expect(JSON.stringify(sql)).toContain('public_location');
    expect(JSON.stringify(sql)).not.toContain('exact_location');
  });
});
