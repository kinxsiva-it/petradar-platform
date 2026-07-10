import { expect, test } from '@playwright/test';
import type { PrismaClient } from '@prisma/client';

import { cleanupE2eTestData, type E2eCleanupResult } from './e2e-helpers';

const marker = '[E2E-DEMO-JOURNEY:e2e-1783659352810-36457a72]';

test.describe('E2E cleanup helper safety', () => {
  let originalDatabaseUrl: string | undefined;
  let originalKeepData: string | undefined;
  let originalNodeEnv: string | undefined;

  test.beforeEach(() => {
    originalDatabaseUrl = process.env['DATABASE_URL'];
    originalKeepData = process.env['PETRADAR_E2E_KEEP_DATA'];
    originalNodeEnv = process.env['NODE_ENV'];
    process.env['DATABASE_URL'] = 'postgresql://e2e.invalid/petradar-test';
    process.env['NODE_ENV'] = 'test';
    delete process.env['PETRADAR_E2E_KEEP_DATA'];
  });

  test.afterEach(() => {
    restoreEnvironmentVariable('DATABASE_URL', originalDatabaseUrl);
    restoreEnvironmentVariable('PETRADAR_E2E_KEEP_DATA', originalKeepData);
    restoreEnvironmentVariable('NODE_ENV', originalNodeEnv);
  });

  test('refuses invalid markers before starting a transaction', async () => {
    const prisma = new FakePrisma();
    const invalidMarkers = [
      '',
      'demo',
      '[DEMO]',
      '[E2E]',
      '[E2E-DEMO-JOURNEY]',
      'normal-user-data',
    ];

    for (const invalidMarker of invalidMarkers) {
      await expect(cleanupE2eTestData(invalidMarker, {}, prisma.client)).rejects.toThrow(
        /run marker is missing or invalid/i,
      );
    }

    expect(prisma.calls).toEqual([]);
  });

  test('refuses production cleanup without starting a transaction', async () => {
    const prisma = new FakePrisma();
    process.env['NODE_ENV'] = 'production';

    await expect(cleanupE2eTestData(marker, {}, prisma.client)).rejects.toThrow(
      /disabled when NODE_ENV=production/i,
    );

    expect(prisma.calls).toEqual([]);
  });

  test('honors PETRADAR_E2E_KEEP_DATA without accessing Prisma', async () => {
    const prisma = new FakePrisma();
    process.env['PETRADAR_E2E_KEEP_DATA'] = '1';

    const result = await cleanupE2eTestData(marker, {}, prisma.client);

    expect(result).toEqual<E2eCleanupResult>({
      deleted: { auditLogs: 0, lostPets: 0, matchResults: 0, sightings: 0 },
      skipped: true,
      verified: false,
    });
    expect(prisma.calls).toEqual([]);
  });

  test('is idempotent when cleanup runs twice with the same tracked ids', async () => {
    const prisma = new FakePrisma({
      auditLogs: [{ entityId: 'sighting-e2e', id: 'audit-e2e' }],
      lostPets: [markedLostPet('lost-pet-e2e')],
      matches: [{ id: 'match-e2e', lostPetId: 'lost-pet-e2e', sightingId: 'sighting-e2e' }],
      sightings: [markedSighting('sighting-e2e')],
    });
    const trackedIds = {
      lostPetId: 'lost-pet-e2e',
      matchResultId: 'match-e2e',
      sightingId: 'sighting-e2e',
    };

    const first = await cleanupE2eTestData(marker, trackedIds, prisma.client);
    const second = await cleanupE2eTestData(marker, trackedIds, prisma.client);

    expect(first.deleted).toEqual({ auditLogs: 1, lostPets: 1, matchResults: 1, sightings: 1 });
    expect(second.deleted).toEqual({ auditLogs: 0, lostPets: 0, matchResults: 0, sightings: 0 });
    expect(second.verified).toBe(true);
    expect(prisma.callCount('$transaction')).toBe(2);
  });

  test('refuses a tracked sighting without matching marker ownership', async () => {
    const prisma = new FakePrisma({
      sightings: [{ description: 'Normal user sighting', id: 'seed-sighting' }],
    });

    await expect(
      cleanupE2eTestData(marker, { sightingId: 'seed-sighting' }, prisma.client),
    ).rejects.toThrow(/tracked sighting is not owned by this run/i);

    expect(prisma.deleteCalls()).toEqual([]);
    expect(prisma.hasSighting('seed-sighting')).toBe(true);
  });

  test('refuses a tracked lost pet without matching marker ownership', async () => {
    const prisma = new FakePrisma({
      lostPets: [{ description: 'Normal user pet', id: 'seed-lost-pet', name: 'Mali' }],
    });

    await expect(
      cleanupE2eTestData(marker, { lostPetId: 'seed-lost-pet' }, prisma.client),
    ).rejects.toThrow(/tracked lost pet is not owned by this run/i);

    expect(prisma.deleteCalls()).toEqual([]);
    expect(prisma.hasLostPet('seed-lost-pet')).toBe(true);
  });

  test('refuses a tracked match not connecting this run marked entities', async () => {
    const prisma = new FakePrisma({
      lostPets: [markedLostPet('lost-pet-e2e')],
      matches: [
        { id: 'match-e2e', lostPetId: 'lost-pet-e2e', sightingId: 'sighting-e2e' },
        { id: 'seed-match', lostPetId: 'seed-lost-pet', sightingId: 'seed-sighting' },
      ],
      sightings: [markedSighting('sighting-e2e')],
    });

    await expect(
      cleanupE2eTestData(marker, { matchResultId: 'seed-match' }, prisma.client),
    ).rejects.toThrow(/tracked match result is not owned by this run/i);

    expect(prisma.deleteCalls()).toEqual([]);
    expect(prisma.hasMatch('seed-match')).toBe(true);
  });

  test('marker fallback and audit cleanup target only exact marked entity ids', async () => {
    const prisma = new FakePrisma({
      auditLogs: [
        { entityId: 'sighting-e2e', id: 'audit-sighting-e2e' },
        { entityId: 'lost-pet-e2e', id: 'audit-lost-pet-e2e' },
        { entityId: 'match-e2e', id: 'audit-match-e2e' },
        { entityId: 'seed-sighting', id: 'audit-seed' },
      ],
      lostPets: [
        markedLostPet('lost-pet-e2e'),
        { description: 'Normal user pet', id: 'seed-lost-pet', name: 'Mali' },
      ],
      matches: [
        { id: 'match-e2e', lostPetId: 'lost-pet-e2e', sightingId: 'sighting-e2e' },
        { id: 'seed-match', lostPetId: 'seed-lost-pet', sightingId: 'seed-sighting' },
      ],
      sightings: [
        markedSighting('sighting-e2e'),
        { description: 'Normal user sighting', id: 'seed-sighting' },
      ],
    });

    const result = await cleanupE2eTestData(marker, {}, prisma.client);

    expect(result.deleted).toEqual({ auditLogs: 3, lostPets: 1, matchResults: 1, sightings: 1 });
    expect(prisma.hasSighting('seed-sighting')).toBe(true);
    expect(prisma.hasLostPet('seed-lost-pet')).toBe(true);
    expect(prisma.hasMatch('seed-match')).toBe(true);
    expect(prisma.hasAuditLog('audit-seed')).toBe(true);
    expect(prisma.callArgs('animalSighting.findMany')).toEqual({
      select: { id: true },
      where: { description: { startsWith: marker } },
    });
    expect(prisma.callArgs('lostPet.findMany')).toEqual({
      select: { id: true },
      where: {
        OR: [{ name: { startsWith: marker } }, { description: { startsWith: marker } }],
      },
    });
    expect(prisma.callArgs('auditLog.deleteMany')).toEqual({
      where: { entityId: { in: ['sighting-e2e', 'lost-pet-e2e', 'match-e2e'] } },
    });
    expect(prisma.deleteCalls()).toEqual([
      'matchResult.deleteMany',
      'lostPet.deleteMany',
      'animalSighting.deleteMany',
      'auditLog.deleteMany',
    ]);
  });
});

interface AuditLogRecord {
  entityId: string;
  id: string;
}

interface LostPetRecord {
  description: string | null;
  id: string;
  name: string;
}

interface MatchRecord {
  id: string;
  lostPetId: string;
  sightingId: string;
}

interface SightingRecord {
  description: string | null;
  id: string;
}

interface FakePrismaState {
  auditLogs?: AuditLogRecord[];
  lostPets?: LostPetRecord[];
  matches?: MatchRecord[];
  sightings?: SightingRecord[];
}

interface RecordedCall {
  args?: unknown;
  method: string;
}

class FakePrisma {
  readonly calls: RecordedCall[] = [];
  readonly client: PrismaClient;

  private readonly auditLogs: AuditLogRecord[];
  private readonly lostPets: LostPetRecord[];
  private readonly matches: MatchRecord[];
  private readonly sightings: SightingRecord[];

  constructor(state: FakePrismaState = {}) {
    this.auditLogs = [...(state.auditLogs ?? [])];
    this.lostPets = [...(state.lostPets ?? [])];
    this.matches = [...(state.matches ?? [])];
    this.sightings = [...(state.sightings ?? [])];

    const transactionClient = {
      animalSighting: {
        count: async (args: unknown) =>
          this.countByIds('animalSighting.count', args, this.sightings),
        deleteMany: async (args: unknown) =>
          this.deleteByIds('animalSighting.deleteMany', args, this.sightings),
        findMany: (args: unknown) => {
          this.record('animalSighting.findMany', args);
          const startsWith = sightingStartsWith(args);
          return Promise.resolve(
            this.sightings
              .filter(({ description }) => description?.startsWith(startsWith) ?? false)
              .map(({ id }) => ({ id })),
          );
        },
        findUnique: (args: unknown) => {
          this.record('animalSighting.findUnique', args);
          const record = this.sightings.find(({ id }) => id === uniqueId(args));
          return Promise.resolve(record ? { description: record.description } : null);
        },
      },
      auditLog: {
        deleteMany: (args: unknown) => {
          this.record('auditLog.deleteMany', args);
          const ids = entityIds(args);
          const count = removeMatching(this.auditLogs, ({ entityId }) => ids.includes(entityId));
          return Promise.resolve({ count });
        },
      },
      lostPet: {
        count: async (args: unknown) => this.countByIds('lostPet.count', args, this.lostPets),
        deleteMany: async (args: unknown) =>
          this.deleteByIds('lostPet.deleteMany', args, this.lostPets),
        findMany: (args: unknown) => {
          this.record('lostPet.findMany', args);
          const startsWith = lostPetStartsWith(args);
          return Promise.resolve(
            this.lostPets
              .filter(
                ({ description, name }) =>
                  name.startsWith(startsWith) || (description?.startsWith(startsWith) ?? false),
              )
              .map(({ id }) => ({ id })),
          );
        },
        findUnique: (args: unknown) => {
          this.record('lostPet.findUnique', args);
          const record = this.lostPets.find(({ id }) => id === uniqueId(args));
          return Promise.resolve(
            record ? { description: record.description, name: record.name } : null,
          );
        },
      },
      matchResult: {
        count: async (args: unknown) => this.countByIds('matchResult.count', args, this.matches),
        deleteMany: async (args: unknown) =>
          this.deleteByIds('matchResult.deleteMany', args, this.matches),
        findMany: (args: unknown) => {
          this.record('matchResult.findMany', args);
          const where = matchWhere(args);
          return Promise.resolve(
            this.matches
              .filter(
                ({ lostPetId, sightingId }) =>
                  where.lostPetIds.includes(lostPetId) && where.sightingIds.includes(sightingId),
              )
              .map(({ id }) => ({ id })),
          );
        },
        findUnique: (args: unknown) => {
          this.record('matchResult.findUnique', args);
          const record = this.matches.find(({ id }) => id === uniqueId(args));
          return Promise.resolve(
            record ? { lostPetId: record.lostPetId, sightingId: record.sightingId } : null,
          );
        },
      },
    };

    this.client = {
      $disconnect: () => {
        this.record('$disconnect');
        return Promise.resolve();
      },
      $transaction: (callback: (client: unknown) => unknown) => {
        this.record('$transaction');
        return Promise.resolve(callback(transactionClient));
      },
    } as unknown as PrismaClient;
  }

  callArgs(method: string): unknown {
    return this.calls.find((call) => call.method === method)?.args;
  }

  callCount(method: string): number {
    return this.calls.filter((call) => call.method === method).length;
  }

  deleteCalls(): string[] {
    return this.calls
      .filter(({ method }) => method.endsWith('.deleteMany'))
      .map(({ method }) => method);
  }

  hasAuditLog(id: string): boolean {
    return this.auditLogs.some((record) => record.id === id);
  }

  hasLostPet(id: string): boolean {
    return this.lostPets.some((record) => record.id === id);
  }

  hasMatch(id: string): boolean {
    return this.matches.some((record) => record.id === id);
  }

  hasSighting(id: string): boolean {
    return this.sightings.some((record) => record.id === id);
  }

  private countByIds(
    method: string,
    args: unknown,
    records: readonly { id: string }[],
  ): Promise<number> {
    this.record(method, args);
    const ids = whereIds(args);
    return Promise.resolve(records.filter(({ id }) => ids.includes(id)).length);
  }

  private deleteByIds(
    method: string,
    args: unknown,
    records: { id: string }[],
  ): Promise<{ count: number }> {
    this.record(method, args);
    const ids = whereIds(args);
    return Promise.resolve({ count: removeMatching(records, ({ id }) => ids.includes(id)) });
  }

  private record(method: string, args?: unknown): void {
    this.calls.push({ args, method });
  }
}

function markedLostPet(id: string): LostPetRecord {
  return { description: `${marker} marked pet`, id, name: `${marker} Match Cat` };
}

function markedSighting(id: string): SightingRecord {
  return { description: `${marker} marked sighting`, id };
}

function restoreEnvironmentVariable(name: string, value: string | undefined): void {
  if (value === undefined) {
    Reflect.deleteProperty(process.env, name);
  } else {
    process.env[name] = value;
  }
}

function removeMatching<T>(records: T[], predicate: (record: T) => boolean): number {
  let count = 0;
  for (let index = records.length - 1; index >= 0; index -= 1) {
    const record = records[index];
    if (record !== undefined && predicate(record)) {
      records.splice(index, 1);
      count += 1;
    }
  }
  return count;
}

function sightingStartsWith(args: unknown): string {
  return (args as { where: { description: { startsWith: string } } }).where.description.startsWith;
}

function lostPetStartsWith(args: unknown): string {
  return (args as { where: { OR: [{ name: { startsWith: string } }] } }).where.OR[0].name
    .startsWith;
}

function uniqueId(args: unknown): string {
  return (args as { where: { id: string } }).where.id;
}

function whereIds(args: unknown): string[] {
  return (args as { where: { id: { in: string[] } } }).where.id.in;
}

function entityIds(args: unknown): string[] {
  return (args as { where: { entityId: { in: string[] } } }).where.entityId.in;
}

function matchWhere(args: unknown): { lostPetIds: string[]; sightingIds: string[] } {
  const where = (
    args as {
      where: { lostPetId: { in: string[] }; sightingId: { in: string[] } };
    }
  ).where;
  return { lostPetIds: where.lostPetId.in, sightingIds: where.sightingId.in };
}
