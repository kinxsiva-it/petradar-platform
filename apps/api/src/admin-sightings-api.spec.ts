import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { validate } from 'class-validator';
import {
  AnimalCondition,
  AnimalSpecies,
  CollarStatus,
  PhotoStorageProvider,
  SightingLifecycleStatus,
  UrgencyLevel,
  UserRole,
  VerificationStatus,
  VolunteerVerificationState,
} from '@prisma/client';

import type { AuthenticatedUser } from '@petradar/backend/auth';
import {
  AdminSightingsController,
  AdminSightingsService,
  RejectSightingDto,
} from '@petradar/backend/admin';
import {
  canModerateSighting,
  SightingsRepository,
  type SightingPhotoRecord,
  type SightingRecord,
} from '@petradar/backend/sightings';

const admin: AuthenticatedUser = {
  displayName: 'Admin Nicha',
  email: 'admin@example.com',
  id: '11111111-1111-4111-8111-111111111111',
  roles: [UserRole.ADMIN],
  volunteerVerification: VolunteerVerificationState.NOT_APPLICABLE,
};

const user: AuthenticatedUser = {
  ...admin,
  displayName: 'Normal User',
  email: 'user@example.com',
  id: '22222222-2222-4222-8222-222222222222',
  roles: [UserRole.REPORTER],
};

const sightingId = '33333333-3333-4333-8333-333333333333';

const record: SightingRecord = {
  animalCount: 1,
  collarStatus: CollarStatus.UNKNOWN,
  color: 'White',
  condition: AnimalCondition.INJURED,
  createdAt: new Date('2026-06-30T00:00:00.000Z'),
  description: 'Limping near the roadside.',
  exactLocation: { latitude: 13.7563, longitude: 100.5018 },
  id: sightingId,
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

const photo: SightingPhotoRecord = {
  createdAt: new Date('2026-06-30T03:00:00.000Z'),
  fileSizeBytes: 64,
  id: '44444444-4444-4444-8444-444444444444',
  mimeType: 'image/jpeg',
  sightingId,
  sortOrder: 0,
  storageKey: `${sightingId}/44444444-4444-4444-8444-444444444444.jpg`,
  storageProvider: PhotoStorageProvider.LOCAL_PLACEHOLDER,
  url: '/api/v1/sightings/photos/44444444-4444-4444-8444-444444444444/file',
};

const row = {
  animalCount: record.animalCount,
  collarStatus: record.collarStatus,
  color: record.color,
  condition: record.condition,
  createdAt: record.createdAt,
  description: record.description,
  exactLatitude: record.exactLocation?.latitude ?? null,
  exactLongitude: record.exactLocation?.longitude ?? null,
  id: record.id,
  lifecycleStatus: record.lifecycleStatus,
  pattern: record.pattern,
  publicLatitude: record.publicLocation.latitude,
  publicLongitude: record.publicLocation.longitude,
  publicRadiusMeters: record.publicRadiusMeters,
  reporterDisplayName: 'Reporter Pim',
  reporterEmail: 'reporter@example.com',
  reporterId: record.reporterId,
  reporterPhone: null,
  seenAt: record.seenAt,
  species: record.species,
  updatedAt: record.updatedAt,
  urgency: record.urgency,
  verificationStatus: record.verificationStatus,
};

function createService(
  overrides: {
    audit?: Record<string, jest.Mock>;
    authorization?: Record<string, jest.Mock>;
    prisma?: Record<string, unknown>;
    repository?: Record<string, jest.Mock>;
  } = {},
): AdminSightingsService {
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
    findById: jest.fn().mockResolvedValue(record),
    findPhotosForSighting: jest.fn().mockResolvedValue([photo]),
    ...overrides.repository,
  };
  const prisma = {
    $queryRaw: jest
      .fn()
      .mockResolvedValueOnce([row])
      .mockResolvedValueOnce([{ total: 1 }]),
    $transaction: jest.fn((callback: (tx: unknown) => unknown) =>
      Promise.resolve(
        callback({
          $queryRaw: jest.fn().mockResolvedValue([
            {
              id: sightingId,
              previousVerificationStatus: VerificationStatus.PENDING,
              verificationStatus: VerificationStatus.VERIFIED,
            },
          ]),
        }),
      ),
    ),
    auditLog: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    sightingPhoto: {
      findMany: jest.fn().mockResolvedValue([photo]),
    },
    ...overrides.prisma,
  };

  return new AdminSightingsService(
    audit as never,
    authorization,
    prisma as never,
    repository as never,
  );
}

describe('Admin animal sighting moderation API', () => {
  it('rejects anonymous controller queue access before service calls', () => {
    const service = createService();
    const controller = new AdminSightingsController(service);

    expect(() => {
      void controller.list(undefined, {}, { header: jest.fn() } as never);
    }).toThrow(UnauthorizedException);
  });

  it('uses existing role metadata for Admin-only controller access', () => {
    const roles = Reflect.getMetadata(
      'petradar:required_roles',
      AdminSightingsController,
    ) as unknown;

    expect(roles).toEqual([UserRole.ADMIN]);
  });

  it('allows only pending or needs-review sightings through moderation policy', () => {
    expect(canModerateSighting(record, 'verify')).toEqual({ allowed: true });
    expect(
      canModerateSighting({ ...record, verificationStatus: VerificationStatus.REJECTED }, 'verify')
        .allowed,
    ).toBe(false);
    expect(
      canModerateSighting({ ...record, lifecycleStatus: SightingLifecycleStatus.CLOSED }, 'reject')
        .allowed,
    ).toBe(false);
  });

  it('validates rejection reasons and rejects unknown fields', async () => {
    const dto = Object.assign(new RejectSightingDto(), {
      reason: 'Too short',
      status: VerificationStatus.REJECTED,
    });

    const errors = await validate(dto, { forbidNonWhitelisted: true, whitelist: true });

    expect(errors.map((error) => error.property)).toContain('status');
  });

  it('rejects unsafe HTML-like rejection reasons', async () => {
    const dto = Object.assign(new RejectSightingDto(), {
      reason: '<script>alert(1)</script> unsafe reason',
    });

    const errors = await validate(dto);

    expect(errors.map((error) => error.property)).toContain('reason');
  });

  it('lists the default pending moderation queue with safe photo metadata', async () => {
    const service = createService();

    const response = await service.listQueue(admin, {}, { requestId: 'request-id' });

    expect(response.items).toHaveLength(1);
    expect(response.items[0]?.verificationStatus).toBe(VerificationStatus.PENDING);
    expect(response.items[0]?.thumbnailPhoto?.url).toContain('/api/v1/sightings/photos/');
    expect(JSON.stringify(response)).not.toContain(String(photo.storageKey));
  });

  it('returns Admin detail with exact and public locations separated', async () => {
    const service = createService({
      prisma: {
        $queryRaw: jest.fn().mockResolvedValueOnce([row]),
        auditLog: { findMany: jest.fn().mockResolvedValue([]) },
        sightingPhoto: { findMany: jest.fn().mockResolvedValue([]) },
      },
    });

    const response = await service.detail(admin, sightingId, { requestId: 'request-id' });

    expect(response.exactLocation).toEqual(record.exactLocation);
    expect(response.publicLocation).toEqual({
      latitude: record.publicLocation.latitude,
      longitude: record.publicLocation.longitude,
      radiusMeters: record.publicRadiusMeters,
    });
  });

  it('denies Admin detail exact-location access when the policy denies it', async () => {
    const audit = { create: jest.fn().mockResolvedValue({ id: 'audit-id' }) };
    const service = createService({
      audit,
      authorization: { canAccessExactLocation: jest.fn().mockReturnValue(false) },
      prisma: { $queryRaw: jest.fn().mockResolvedValueOnce([row]) },
    });

    await expect(service.detail(admin, sightingId)).rejects.toThrow(ForbiddenException);
    expect(JSON.stringify(audit.create.mock.calls)).not.toContain('13.7563');
  });

  it('prevents repeated verify attempts', async () => {
    const service = createService({
      repository: {
        findById: jest.fn().mockResolvedValue({
          ...record,
          verificationStatus: VerificationStatus.VERIFIED,
        }),
      },
    });

    await expect(service.verify(admin, sightingId)).rejects.toThrow('already verified');
  });

  it('prevents concurrent moderation overwrite when conditional update finds no row', async () => {
    const service = createService({
      prisma: {
        $transaction: jest.fn((callback: (tx: unknown) => unknown) =>
          Promise.resolve(callback({ $queryRaw: jest.fn().mockResolvedValue([]) })),
        ),
      },
    });

    await expect(service.verify(admin, sightingId)).rejects.toThrow('already moderated');
  });

  it('stores rejection reason only in sanitized audit metadata and returns a safe detail response', async () => {
    const audit = {
      create: jest.fn().mockResolvedValue({ id: 'audit-id' }),
      createWithClient: jest.fn().mockResolvedValue({ id: 'audit-id' }),
    };
    const service = createService({
      audit,
      prisma: {
        $queryRaw: jest
          .fn()
          .mockResolvedValueOnce([{ ...row, verificationStatus: VerificationStatus.REJECTED }]),
        $transaction: jest.fn((callback: (tx: unknown) => unknown) =>
          Promise.resolve(
            callback({
              $queryRaw: jest.fn().mockResolvedValue([
                {
                  id: sightingId,
                  previousVerificationStatus: VerificationStatus.PENDING,
                  verificationStatus: VerificationStatus.REJECTED,
                },
              ]),
            }),
          ),
        ),
        auditLog: {
          findMany: jest.fn().mockResolvedValue([
            {
              action: 'SIGHTING_REJECTED',
              actor: { displayName: 'Admin Nicha' },
              actorId: admin.id,
              createdAt: new Date('2026-06-30T04:00:00.000Z'),
              entityId: sightingId,
              id: 'audit-id',
              metadata: {
                newVerificationStatus: VerificationStatus.REJECTED,
                previousVerificationStatus: VerificationStatus.PENDING,
                rejectionReason: 'Photo is too unclear for moderation.',
              },
            },
          ]),
        },
        sightingPhoto: { findMany: jest.fn().mockResolvedValue([]) },
      },
    });

    const response = await service.reject(
      admin,
      sightingId,
      'Photo is too unclear for moderation.',
    );

    expect(response.rejectionReason).toBe('Photo is too unclear for moderation.');
    expect(JSON.stringify(audit.createWithClient.mock.calls)).not.toContain('13.7563');
    expect(JSON.stringify(audit.createWithClient.mock.calls)).not.toContain('100.5018');
  });
});

describe('Admin moderation public visibility protection', () => {
  it('keeps rejected sightings out of nearby public SQL', async () => {
    const queryRaw = jest.fn().mockResolvedValue([]);
    const repository = new SightingsRepository(
      { $queryRaw: queryRaw } as never,
      {
        assertLatitude: jest.fn(),
        assertLongitude: jest.fn(),
      } as never,
    );

    await repository.findPublicNearby({ latitude: 13.75, longitude: 100.5, radiusMeters: 300 });

    const calls = queryRaw.mock.calls as [unknown][];
    const sql = JSON.stringify(calls[0]?.[0]);
    expect(sql).toContain('REJECTED');
    expect(sql).toContain('DUPLICATE');
  });
});
