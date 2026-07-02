import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';
import { randomUUID } from 'node:crypto';

import { AuditService } from '@petradar/backend/audit';
import type { AuthenticatedUser } from '@petradar/backend/auth';
import { LocationPrivacyService, PrismaService } from '@petradar/backend/shared';

import { CreateLostPetDto, ListLostPetsQueryDto, UpdateLostPetDto } from './dto/lost-pet.dto.js';

export interface LostPetRow {
  id: string;
  ownerId: string;
  name: string;
  species: string;
  breed: string | null;
  sex: string;
  age: string | null;
  color: string | null;
  pattern: string | null;
  collarDescription: string | null;
  microchipped: boolean;
  description: string | null;
  photoUrls: string[];
  publicLatitude: number;
  publicLongitude: number;
  exactLatitude: number | null;
  exactLongitude: number | null;
  publicRadiusMeters: number;
  lastSeenAt: Date;
  contactMethod: string | null;
  rewardCents: number | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class LostPetsService {
  constructor(
    private readonly audit: AuditService,
    private readonly locationPrivacy: LocationPrivacyService,
    private readonly prisma: PrismaService,
  ) {}

  async create(user: AuthenticatedUser, dto: CreateLostPetDto) {
    const id = randomUUID();
    const publicLocation = this.locationPrivacy.generatePublicLocation({
      entityId: id,
      latitude: dto.latitude,
      longitude: dto.longitude,
    });
    const row = await this.prisma.$transaction(async (tx) => {
      const rows = await tx.$queryRaw<LostPetRow[]>(Prisma.sql`
        INSERT INTO "lost_pets" (
          "id",
          "owner_id",
          "name",
          "species",
          "breed",
          "sex",
          "age",
          "color",
          "pattern",
          "collar_description",
          "microchipped",
          "description",
          "photo_urls",
          "exact_last_seen_location",
          "public_last_seen_location",
          "public_radius_meters",
          "last_seen_at",
          "contact_method",
          "reward_cents"
        )
        VALUES (
          CAST(${id} AS uuid),
          CAST(${user.id} AS uuid),
          ${cleanText(dto.name) ?? ''},
          CAST(${dto.species} AS "AnimalSpecies"),
          ${cleanText(dto.breed)},
          CAST(${dto.sex ?? 'UNKNOWN'} AS "LostPetSex"),
          ${cleanText(dto.age)},
          ${cleanText(dto.color)},
          ${cleanText(dto.pattern)},
          ${cleanText(dto.collarDescription)},
          ${dto.microchipped ?? false},
          ${cleanText(dto.description)},
          ${textArraySql(dto.photoUrls ?? [])},
          ST_SetSRID(ST_MakePoint(${dto.longitude}, ${dto.latitude}), 4326)::geography,
          ST_SetSRID(ST_MakePoint(${publicLocation.longitude}, ${publicLocation.latitude}), 4326)::geography,
          ${publicLocation.radiusMeters},
          ${parseDate(dto.lastSeenAt)},
          ${cleanText(dto.contactMethod)},
          ${dto.rewardCents ?? null}
        )
        RETURNING ${lostPetSelectSql(true)}
      `);
      await this.audit.createWithClient(tx, {
        action: 'LOST_PET_CREATED',
        actorId: user.id,
        entityId: id,
        entityType: 'LostPet',
        metadata: { actorId: user.id, lostPetId: id, species: dto.species },
      });
      return requireRow(rows);
    });

    return toLostPetResponse(row, { includeExact: true, includePrivate: true });
  }

  async list(query: ListLostPetsQueryDto) {
    const page = Math.max(query.page ?? 1, 1);
    const pageSize = Math.min(Math.max(query.pageSize ?? 25, 1), 50);
    const where = whereForList(query);
    const [rows, countRows] = await Promise.all([
      this.prisma.$queryRaw<LostPetRow[]>(Prisma.sql`
        SELECT ${lostPetSelectSql(false)}
        FROM "lost_pets"
        WHERE ${Prisma.join(where, ' AND ')}
        ORDER BY "last_seen_at" DESC, "created_at" DESC, "id" DESC
        LIMIT ${pageSize}
        OFFSET ${(page - 1) * pageSize}
      `),
      this.prisma.$queryRaw<{ total: bigint | number }[]>(Prisma.sql`
        SELECT COUNT(*) AS "total"
        FROM "lost_pets"
        WHERE ${Prisma.join(where, ' AND ')}
      `),
    ]);
    const totalValue = countRows[0]?.total ?? 0;
    const total = typeof totalValue === 'bigint' ? Number(totalValue) : totalValue;
    return {
      items: rows.map((row) => toLostPetResponse(row, { includeExact: false, includePrivate: false })),
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async listMine(user: AuthenticatedUser, query: ListLostPetsQueryDto) {
    const page = Math.max(query.page ?? 1, 1);
    const pageSize = Math.min(Math.max(query.pageSize ?? 25, 1), 50);
    const where = [
      Prisma.sql`"owner_id" = CAST(${user.id} AS uuid)`,
      ...whereForList(query, { includeClosed: true }),
    ];
    const [rows, countRows] = await Promise.all([
      this.prisma.$queryRaw<LostPetRow[]>(Prisma.sql`
        SELECT ${lostPetSelectSql(true)}
        FROM "lost_pets"
        WHERE ${Prisma.join(where, ' AND ')}
        ORDER BY "last_seen_at" DESC, "created_at" DESC, "id" DESC
        LIMIT ${pageSize}
        OFFSET ${(page - 1) * pageSize}
      `),
      this.prisma.$queryRaw<{ total: bigint | number }[]>(Prisma.sql`
        SELECT COUNT(*) AS "total"
        FROM "lost_pets"
        WHERE ${Prisma.join(where, ' AND ')}
      `),
    ]);
    const totalValue = countRows[0]?.total ?? 0;
    const total = typeof totalValue === 'bigint' ? Number(totalValue) : totalValue;
    return {
      items: rows.map((row) => toLostPetResponse(row, { includeExact: true, includePrivate: true })),
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findPublic(id: string) {
    const row = await this.findRow(id, false);
    if (!row) {
      throw new NotFoundException('Lost pet not found.');
    }
    return toLostPetResponse(row, { includeExact: false, includePrivate: false });
  }

  async findAuthorized(user: AuthenticatedUser, id: string) {
    const row = await this.loadAccessible(user, id);
    return toLostPetResponse(row, {
      includeExact: true,
      includePrivate: true,
    });
  }

  async update(user: AuthenticatedUser, id: string, dto: UpdateLostPetDto) {
    const current = await this.loadAccessible(user, id);
    if ((dto.latitude === undefined) !== (dto.longitude === undefined)) {
      throw new BadRequestException('Latitude and longitude must be updated together.');
    }

    const exactLatitude = dto.latitude ?? current.exactLatitude;
    const exactLongitude = dto.longitude ?? current.exactLongitude;
    if (exactLatitude === null || exactLongitude === null) {
      throw new BadRequestException('Exact location is required.');
    }

    const publicLocation =
      dto.latitude !== undefined && dto.longitude !== undefined
        ? this.locationPrivacy.generatePublicLocation({
            entityId: id,
            latitude: dto.latitude,
            longitude: dto.longitude,
          })
        : {
            latitude: current.publicLatitude,
            longitude: current.publicLongitude,
            radiusMeters: current.publicRadiusMeters,
          };

    const rows = await this.prisma.$queryRaw<LostPetRow[]>(Prisma.sql`
      UPDATE "lost_pets"
      SET
        "name" = ${cleanText(dto.name) ?? current.name},
        "species" = CAST(${dto.species ?? current.species} AS "AnimalSpecies"),
        "breed" = ${dto.breed === undefined ? current.breed : cleanText(dto.breed)},
        "sex" = CAST(${dto.sex ?? current.sex} AS "LostPetSex"),
        "age" = ${dto.age === undefined ? current.age : cleanText(dto.age)},
        "color" = ${dto.color === undefined ? current.color : cleanText(dto.color)},
        "pattern" = ${dto.pattern === undefined ? current.pattern : cleanText(dto.pattern)},
        "collar_description" = ${dto.collarDescription === undefined ? current.collarDescription : cleanText(dto.collarDescription)},
        "microchipped" = ${dto.microchipped ?? current.microchipped},
        "description" = ${dto.description === undefined ? current.description : cleanText(dto.description)},
        "photo_urls" = ${textArraySql(dto.photoUrls ?? current.photoUrls)},
        "exact_last_seen_location" = ST_SetSRID(ST_MakePoint(${exactLongitude}, ${exactLatitude}), 4326)::geography,
        "public_last_seen_location" = ST_SetSRID(ST_MakePoint(${publicLocation.longitude}, ${publicLocation.latitude}), 4326)::geography,
        "public_radius_meters" = ${publicLocation.radiusMeters},
        "last_seen_at" = ${dto.lastSeenAt ? parseDate(dto.lastSeenAt) : current.lastSeenAt},
        "contact_method" = ${dto.contactMethod === undefined ? current.contactMethod : cleanText(dto.contactMethod)},
        "reward_cents" = ${dto.rewardCents ?? current.rewardCents},
        "status" = CAST(${dto.status ?? current.status} AS "LostPetStatus"),
        "updated_at" = CURRENT_TIMESTAMP
      WHERE "id" = CAST(${id} AS uuid)
      RETURNING ${lostPetSelectSql(true)}
    `);

    await this.audit.create({
      action: 'LOST_PET_UPDATED',
      actorId: user.id,
      entityId: id,
      entityType: 'LostPet',
      metadata: { actorId: user.id, lostPetId: id },
    });

    return toLostPetResponse(requireRow(rows), { includeExact: true, includePrivate: true });
  }

  async loadAccessible(user: AuthenticatedUser, id: string): Promise<LostPetRow> {
    const row = await this.findRow(id, true);
    if (!row) {
      throw new NotFoundException('Lost pet not found.');
    }

    if (row.ownerId === user.id || user.roles.includes(UserRole.ADMIN)) {
      return row;
    }

    throw new ForbiddenException('Lost pet access denied.');
  }

  async findRow(id: string, includeExact: boolean): Promise<LostPetRow | null> {
    const rows = await this.prisma.$queryRaw<LostPetRow[]>(Prisma.sql`
      SELECT ${lostPetSelectSql(includeExact)}
      FROM "lost_pets"
      WHERE "id" = CAST(${id} AS uuid)
      LIMIT 1
    `);
    return rows[0] ?? null;
  }
}

function whereForList(
  query: ListLostPetsQueryDto,
  options: { includeClosed?: boolean } = {},
): Prisma.Sql[] {
  const where: Prisma.Sql[] = options.includeClosed
    ? []
    : [Prisma.sql`"status" != CAST(${'CLOSED'} AS "LostPetStatus")`];
  if (query.species) where.push(Prisma.sql`"species" = CAST(${query.species} AS "AnimalSpecies")`);
  if (query.status) where.push(Prisma.sql`"status" = CAST(${query.status} AS "LostPetStatus")`);
  if (query.lastSeenFrom) where.push(Prisma.sql`"last_seen_at" >= ${parseDate(query.lastSeenFrom)}`);
  if (query.lastSeenTo) where.push(Prisma.sql`"last_seen_at" <= ${parseDate(query.lastSeenTo)}`);
  if (query.query?.trim()) {
    const value = `%${query.query.trim()}%`;
    where.push(Prisma.sql`("name" ILIKE ${value} OR "color" ILIKE ${value} OR "description" ILIKE ${value})`);
  }
  return where;
}

function lostPetSelectSql(includeExact: boolean): Prisma.Sql {
  return Prisma.sql`
    "id"::text AS "id",
    "owner_id"::text AS "ownerId",
    "name",
    "species"::text AS "species",
    "breed",
    "sex"::text AS "sex",
    "age",
    "color",
    "pattern",
    "collar_description" AS "collarDescription",
    "microchipped",
    "description",
    "photo_urls" AS "photoUrls",
    ST_Y("public_last_seen_location"::geometry)::float8 AS "publicLatitude",
    ST_X("public_last_seen_location"::geometry)::float8 AS "publicLongitude",
    ${
      includeExact
        ? Prisma.sql`ST_Y("exact_last_seen_location"::geometry)::float8`
        : Prisma.sql`NULL::float8`
    } AS "exactLatitude",
    ${
      includeExact
        ? Prisma.sql`ST_X("exact_last_seen_location"::geometry)::float8`
        : Prisma.sql`NULL::float8`
    } AS "exactLongitude",
    "public_radius_meters" AS "publicRadiusMeters",
    "last_seen_at" AS "lastSeenAt",
    "contact_method" AS "contactMethod",
    "reward_cents" AS "rewardCents",
    "status"::text AS "status",
    "created_at" AS "createdAt",
    "updated_at" AS "updatedAt"
  `;
}

export function toLostPetResponse(
  row: LostPetRow,
  options: { includeExact: boolean; includePrivate: boolean },
) {
  return {
    age: row.age,
    breed: row.breed,
    collarDescription: row.collarDescription,
    color: row.color,
    createdAt: row.createdAt.toISOString(),
    description: row.description,
    id: row.id,
    lastSeenAt: row.lastSeenAt.toISOString(),
    microchipped: options.includePrivate ? row.microchipped : undefined,
    name: row.name,
    ownerId: options.includePrivate ? row.ownerId : undefined,
    pattern: row.pattern,
    photoUrls: row.photoUrls,
    publicLocation: {
      latitude: row.publicLatitude,
      longitude: row.publicLongitude,
      radiusMeters: row.publicRadiusMeters,
    },
    rewardCents: row.rewardCents,
    sex: row.sex,
    species: row.species,
    status: row.status,
    updatedAt: row.updatedAt.toISOString(),
    ...(options.includePrivate ? { contactMethod: row.contactMethod } : {}),
    ...(options.includeExact && row.exactLatitude !== null && row.exactLongitude !== null
      ? { exactLocation: { latitude: row.exactLatitude, longitude: row.exactLongitude } }
      : {}),
  };
}

function requireRow<T>(rows: readonly T[]): T {
  const row = rows[0];
  if (!row) {
    throw new Error('Expected database row was not returned.');
  }
  return row;
}

function cleanText(value: string | undefined | null): string | null {
  const trimmed = value?.trim();
  if (trimmed === undefined || trimmed.length === 0) {
    return null;
  }
  return trimmed;
}

function parseDate(value: string): Date {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new BadRequestException('Invalid date.');
  }
  return date;
}

function textArraySql(values: readonly string[]): Prisma.Sql {
  if (values.length === 0) {
    return Prisma.sql`ARRAY[]::text[]`;
  }
  return Prisma.sql`ARRAY[${Prisma.join(values.map((value) => Prisma.sql`${value}`))}]::text[]`;
}
