import { AnimalSpecies, LostPetSex, UserRole, VolunteerVerificationState } from '@prisma/client';

import type { AuditLogInput } from '@petradar/backend/audit';
import type { AuthenticatedUser } from '@petradar/backend/auth';
import { LostPetsService, LostPetSexValue, type LostPetRow } from '@petradar/backend/lost-pets';

const owner: AuthenticatedUser = {
  displayName: 'Owner Nicha',
  email: 'owner@example.test',
  id: '11111111-1111-4111-8111-111111111111',
  roles: [UserRole.PET_OWNER],
  volunteerVerification: VolunteerVerificationState.NOT_APPLICABLE,
};

describe('LostPetsService automatic matching', () => {
  it('runs rule-based matching after a lost-pet post is created', async () => {
    const row = lostPetRow();
    const audit = createAuditDouble();
    const matching = createMatchingDouble();
    const service = createService({ audit, matching, row });

    const response = await service.create(
      owner,
      createLostPetRequest(),
      'request-id-123',
    );

    expect(response.id).toBe(row.id);
    expect(response.exactLocation).toEqual({ latitude: 13.7563, longitude: 100.5018 });
    expect(matching.runForLostPet).toHaveBeenCalledWith(owner, row.id, 'request-id-123');
    expect(audit.createWithClient).toHaveBeenCalledTimes(1);
    const createdAuditInput = audit.createWithClient.mock.calls[0]?.[1];
    expect(createdAuditInput?.action).toBe('LOST_PET_CREATED');
    expect(typeof createdAuditInput?.entityId).toBe('string');
    expect(createdAuditInput?.entityType).toBe('LostPet');
    expect(audit.create).not.toHaveBeenCalled();
  });

  it('keeps the created lost-pet post when automatic matching fails', async () => {
    const row = lostPetRow();
    const audit = createAuditDouble();
    const matching = createMatchingDouble(new Error('matching unavailable'));
    const service = createService({ audit, matching, row });

    const response = await service.create(owner, createLostPetRequest(), 'request-id-123');

    expect(response.id).toBe(row.id);
    expect(matching.runForLostPet).toHaveBeenCalledWith(owner, row.id, 'request-id-123');
    expect(audit.create).toHaveBeenCalledWith({
      action: 'LOST_PET_MATCHING_AUTO_FAILED',
      actorId: owner.id,
      entityId: row.id,
      entityType: 'LostPet',
      metadata: {
        actorId: owner.id,
        errorName: 'Error',
        lostPetId: row.id,
      },
      requestId: 'request-id-123',
    });
  });
});

interface TransactionClient {
  $queryRaw: jest.Mock<Promise<LostPetRow[]>>;
}

interface AuditDouble {
  create: jest.Mock<Promise<{ id: string }>, [AuditLogInput]>;
  createWithClient: jest.Mock<Promise<{ id: string }>, [unknown, AuditLogInput]>;
}

interface MatchingDouble {
  runForLostPet: jest.Mock<Promise<{ items: unknown[] }>, [AuthenticatedUser, string, string | null | undefined]>;
}

function createService(input: {
  audit: AuditDouble;
  matching: MatchingDouble;
  row: LostPetRow;
}): LostPetsService {
  const queryRaw = jest.fn<Promise<LostPetRow[]>, []>().mockResolvedValue([input.row]);
  const transaction = jest.fn(async (callback: (client: TransactionClient) => Promise<LostPetRow>) =>
    callback({
      $queryRaw: queryRaw,
    }),
  );

  return new LostPetsService(
    input.audit as never,
    {
      generatePublicLocationForPublicApi: jest.fn().mockResolvedValue({
        latitude: 13.751,
        longitude: 100.502,
        radiusMeters: 300,
      }),
    } as never,
    input.matching as never,
    {
      $transaction: transaction,
    } as never,
  );
}

function createAuditDouble(): AuditDouble {
  return {
    create: jest.fn<Promise<{ id: string }>, [AuditLogInput]>().mockResolvedValue({ id: 'audit-id' }),
    createWithClient: jest
      .fn<Promise<{ id: string }>, [unknown, AuditLogInput]>()
      .mockResolvedValue({ id: 'audit-id' }),
  };
}

function createMatchingDouble(error?: Error): MatchingDouble {
  const runForLostPet = jest.fn<
    Promise<{ items: unknown[] }>,
    [AuthenticatedUser, string, string | null | undefined]
  >();
  if (error) {
    runForLostPet.mockRejectedValue(error);
  } else {
    runForLostPet.mockResolvedValue({ items: [] });
  }
  return { runForLostPet };
}

function createLostPetRequest() {
  return {
    lastSeenAt: '2026-07-07T08:00:00.000Z',
    latitude: 13.7563,
    longitude: 100.5018,
    name: 'Milo',
    sex: LostPetSexValue.MALE,
    species: AnimalSpecies.CAT,
  };
}

function lostPetRow(): LostPetRow {
  return {
    age: null,
    breed: null,
    collarDescription: 'Red collar',
    color: 'Orange',
    contactMethod: null,
    createdAt: new Date('2026-07-07T08:00:00.000Z'),
    description: null,
    exactLatitude: 13.7563,
    exactLongitude: 100.5018,
    id: '22222222-2222-4222-8222-222222222222',
    lastSeenAt: new Date('2026-07-07T08:00:00.000Z'),
    microchipped: false,
    name: 'Milo',
    ownerId: owner.id,
    pattern: 'Tabby',
    photoUrls: [],
    publicLatitude: 13.751,
    publicLongitude: 100.502,
    publicRadiusMeters: 300,
    rewardCents: null,
    sex: LostPetSex.MALE,
    species: AnimalSpecies.CAT,
    status: 'LOST',
    updatedAt: new Date('2026-07-07T08:01:00.000Z'),
  };
}
