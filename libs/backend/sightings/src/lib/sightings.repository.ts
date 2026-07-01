import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import {
  AnimalCondition,
  AnimalSpecies,
  CollarStatus,
  PhotoStorageProvider,
  Prisma,
  SightingLifecycleStatus,
  UrgencyLevel,
  VerificationStatus,
} from '@prisma/client';

import { LocationPrivacyService, PrismaService } from '@petradar/backend/shared';

export interface CreateSightingInput {
  reporterId: string;
  species: AnimalSpecies;
  animalCount: number;
  color?: string | null;
  pattern?: string | null;
  collarStatus?: CollarStatus;
  condition?: AnimalCondition;
  description?: string | null;
  seenAt: Date;
  urgency?: UrgencyLevel;
}

export interface UpdateSightingInput extends CreateSightingInput {
  id: string;
  exactLatitude: number;
  exactLongitude: number;
}

export interface ListSightingsInput {
  page: number;
  pageSize: number;
  query?: string;
  species?: AnimalSpecies;
  condition?: AnimalCondition;
  lifecycleStatus?: SightingLifecycleStatus;
  verificationStatus?: VerificationStatus;
  urgency?: UrgencyLevel;
  seenFrom?: Date;
  seenTo?: Date;
  createdFrom?: Date;
  createdTo?: Date;
  latitude?: number;
  longitude?: number;
  radiusMeters?: number;
  reporterId?: string;
  publicOnly: boolean;
}

export interface SightingRecord {
  id: string;
  reporterId: string | null;
  species: AnimalSpecies;
  animalCount: number;
  color: string | null;
  pattern: string | null;
  collarStatus: CollarStatus;
  condition: AnimalCondition;
  description: string | null;
  seenAt: Date;
  urgency: UrgencyLevel;
  lifecycleStatus: SightingLifecycleStatus;
  verificationStatus: VerificationStatus;
  publicLocation: {
    latitude: number;
    longitude: number;
  };
  publicRadiusMeters: number;
  exactLocation?: {
    latitude: number;
    longitude: number;
  };
  photos: SightingPhotoRecord[];
  rejectionReason?: string | null;
  createdAt: Date;
  updatedAt: Date;
  distanceMeters?: number;
}

export interface SightingPhotoRecord {
  id: string;
  sightingId: string;
  storageProvider: PhotoStorageProvider;
  storageKey: string | null;
  url: string;
  mimeType: string | null;
  fileSizeBytes: number | null;
  sortOrder: number;
  createdAt: Date;
}

export interface CreateSightingPhotoInput {
  id: string;
  fileSizeBytes: number;
  mimeType: string;
  sortOrder: number;
  storageKey: string;
  storageProvider: PhotoStorageProvider;
  url: string;
}

export interface PaginatedSightingsRecord {
  items: SightingRecord[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface NearbyPublicSighting {
  id: string;
  distanceMeters: number;
}

interface SightingRow {
  id: string;
  reporterId: string | null;
  species: AnimalSpecies;
  animalCount: number;
  color: string | null;
  pattern: string | null;
  collarStatus: CollarStatus;
  condition: AnimalCondition;
  description: string | null;
  seenAt: Date;
  urgency: UrgencyLevel;
  lifecycleStatus: SightingLifecycleStatus;
  verificationStatus: VerificationStatus;
  publicLatitude: number;
  publicLongitude: number;
  publicRadiusMeters: number;
  exactLatitude: number | null;
  exactLongitude: number | null;
  createdAt: Date;
  updatedAt: Date;
  distanceMeters: number | null;
}

interface CountRow {
  total: bigint | number;
}

interface NearbySightingRow {
  id: string;
  distance_meters: number;
}

interface SightingPhotoRow {
  id: string;
  sightingId: string;
  storageProvider: PhotoStorageProvider;
  storageKey: string | null;
  url: string;
  mimeType: string | null;
  fileSizeBytes: number | null;
  sortOrder: number;
  createdAt: Date;
}

type SightingDbClient = Pick<PrismaService, '$executeRaw' | '$queryRaw' | 'sightingPhoto'>;

@Injectable()
export class SightingsRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly locationPrivacy: LocationPrivacyService,
  ) {}

  async create(
    input: CreateSightingInput & { exactLatitude: number; exactLongitude: number },
    client: SightingDbClient = this.prisma,
  ): Promise<SightingRecord> {
    this.locationPrivacy.assertLatitude(input.exactLatitude);
    this.locationPrivacy.assertLongitude(input.exactLongitude);

    const id = randomUUID();
    const publicLocation = this.locationPrivacy.generatePublicLocation({
      entityId: id,
      latitude: input.exactLatitude,
      longitude: input.exactLongitude,
    });

    await client.$executeRaw`
      INSERT INTO "animal_sightings" (
        "id",
        "reporter_id",
        "species",
        "animal_count",
        "color",
        "pattern",
        "collar_status",
        "condition",
        "description",
        "seen_at",
        "urgency",
        "lifecycle_status",
        "verification_status",
        "exact_location",
        "public_location",
        "public_radius_meters"
      )
      VALUES (
        CAST(${id} AS uuid),
        CAST(${input.reporterId} AS uuid),
        CAST(${input.species} AS "AnimalSpecies"),
        ${input.animalCount},
        ${input.color ?? null},
        ${input.pattern ?? null},
        CAST(${input.collarStatus ?? CollarStatus.UNKNOWN} AS "CollarStatus"),
        CAST(${input.condition ?? AnimalCondition.UNKNOWN} AS "AnimalCondition"),
        ${input.description ?? null},
        ${input.seenAt},
        CAST(${input.urgency ?? UrgencyLevel.LOW} AS "UrgencyLevel"),
        CAST(${SightingLifecycleStatus.SIGHTING} AS "SightingLifecycleStatus"),
        CAST(${VerificationStatus.PENDING} AS "VerificationStatus"),
        ST_SetSRID(ST_MakePoint(${input.exactLongitude}, ${input.exactLatitude}), 4326)::geography,
        ST_SetSRID(ST_MakePoint(${publicLocation.longitude}, ${publicLocation.latitude}), 4326)::geography,
        ${publicLocation.radiusMeters}
      )
    `;

    const created = await this.findById(id, { includeExactLocation: true }, client);
    if (!created) {
      throw new Error('Created sighting could not be loaded.');
    }

    return created;
  }

  async update(
    input: UpdateSightingInput,
    client: SightingDbClient = this.prisma,
  ): Promise<SightingRecord> {
    this.locationPrivacy.assertLatitude(input.exactLatitude);
    this.locationPrivacy.assertLongitude(input.exactLongitude);

    const publicLocation = this.locationPrivacy.generatePublicLocation({
      entityId: input.id,
      latitude: input.exactLatitude,
      longitude: input.exactLongitude,
    });

    await client.$executeRaw`
      UPDATE "animal_sightings"
      SET
        "species" = CAST(${input.species} AS "AnimalSpecies"),
        "animal_count" = ${input.animalCount},
        "color" = ${input.color ?? null},
        "pattern" = ${input.pattern ?? null},
        "collar_status" = CAST(${input.collarStatus ?? CollarStatus.UNKNOWN} AS "CollarStatus"),
        "condition" = CAST(${input.condition ?? AnimalCondition.UNKNOWN} AS "AnimalCondition"),
        "description" = ${input.description ?? null},
        "seen_at" = ${input.seenAt},
        "urgency" = CAST(${input.urgency ?? UrgencyLevel.LOW} AS "UrgencyLevel"),
        "exact_location" = ST_SetSRID(ST_MakePoint(${input.exactLongitude}, ${input.exactLatitude}), 4326)::geography,
        "public_location" = ST_SetSRID(ST_MakePoint(${publicLocation.longitude}, ${publicLocation.latitude}), 4326)::geography,
        "public_radius_meters" = ${publicLocation.radiusMeters},
        "updated_at" = CURRENT_TIMESTAMP
      WHERE "id" = CAST(${input.id} AS uuid)
    `;

    const updated = await this.findById(input.id, { includeExactLocation: true }, client);
    if (!updated) {
      throw new Error('Updated sighting could not be loaded.');
    }

    return updated;
  }

  async findById(
    id: string,
    options: { includeExactLocation?: boolean; publicOnly?: boolean } = {},
    client: SightingDbClient = this.prisma,
  ): Promise<SightingRecord | null> {
    const where = [
      Prisma.sql`"id" = CAST(${id} AS uuid)`,
      ...(options.publicOnly ? publicVisibilityWhere() : []),
    ];
    const rows = await client.$queryRaw<SightingRow[]>(Prisma.sql`
      ${selectSightingSql(options.includeExactLocation === true)}
      FROM "animal_sightings"
      WHERE ${Prisma.join(where, ' AND ')}
      LIMIT 1
    `);

    const sightings = await this.attachPhotos(rows.map(mapRow), client);
    return sightings[0] ?? null;
  }

  async list(
    input: ListSightingsInput,
    client: SightingDbClient = this.prisma,
  ): Promise<PaginatedSightingsRecord> {
    const page = Math.max(1, input.page);
    const pageSize = Math.min(Math.max(1, input.pageSize), 50);
    const offset = (page - 1) * pageSize;
    const where = this.listWhere(input);
    const distanceSql = nearbyConfigured(input)
      ? Prisma.sql`
          ST_Distance(
            "public_location",
            ST_SetSRID(ST_MakePoint(${input.longitude}, ${input.latitude}), 4326)::geography
          )::float8
        `
      : Prisma.sql`NULL::float8`;

    const [rows, countRows] = await Promise.all([
      client.$queryRaw<SightingRow[]>(Prisma.sql`
        ${selectSightingSql(false, distanceSql)}
        FROM "animal_sightings"
        WHERE ${Prisma.join(where, ' AND ')}
        ORDER BY "seen_at" DESC, "created_at" DESC, "id" DESC
        LIMIT ${pageSize}
        OFFSET ${offset}
      `),
      client.$queryRaw<CountRow[]>(Prisma.sql`
        SELECT COUNT(*) AS "total"
        FROM "animal_sightings"
        WHERE ${Prisma.join(where, ' AND ')}
      `),
    ]);

    const totalValue = countRows[0]?.total ?? 0;
    const total = typeof totalValue === 'bigint' ? Number(totalValue) : totalValue;

    return {
      items: await this.attachPhotos(rows.map(mapRow), client),
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findPublicNearby(input: {
    latitude: number;
    longitude: number;
    radiusMeters: number;
    limit?: number;
  }): Promise<NearbyPublicSighting[]> {
    this.locationPrivacy.assertLatitude(input.latitude);
    this.locationPrivacy.assertLongitude(input.longitude);

    if (!Number.isFinite(input.radiusMeters) || input.radiusMeters <= 0) {
      throw new RangeError('Search radius must be greater than zero.');
    }

    const limit = Math.min(Math.max(input.limit ?? 50, 1), 100);
    const rows = await this.prisma.$queryRaw<NearbySightingRow[]>(Prisma.sql`
      SELECT
        "id"::text,
        ST_Distance(
          "public_location",
          ST_SetSRID(ST_MakePoint(${input.longitude}, ${input.latitude}), 4326)::geography
        )::float8 AS "distance_meters"
      FROM "animal_sightings"
      WHERE ${Prisma.join(
        [
          ...publicVisibilityWhere(),
          Prisma.sql`
            ST_DWithin(
              "public_location",
              ST_SetSRID(ST_MakePoint(${input.longitude}, ${input.latitude}), 4326)::geography,
              ${input.radiusMeters}
            )
          `,
        ],
        ' AND ',
      )}
      ORDER BY "distance_meters" ASC
      LIMIT ${limit}
    `);

    return rows.map((row) => ({
      distanceMeters: row.distance_meters,
      id: row.id,
    }));
  }

  async countPhotosForSighting(
    sightingId: string,
    client: SightingDbClient = this.prisma,
  ): Promise<number> {
    return client.sightingPhoto.count({ where: { sightingId } });
  }

  async createPhotos(
    sightingId: string,
    photos: readonly CreateSightingPhotoInput[],
    client: SightingDbClient = this.prisma,
  ): Promise<SightingPhotoRecord[]> {
    if (photos.length === 0) {
      return [];
    }

    await client.sightingPhoto.createMany({
      data: photos.map((photo) => ({
        fileSizeBytes: photo.fileSizeBytes,
        id: photo.id,
        mimeType: photo.mimeType,
        sightingId,
        sortOrder: photo.sortOrder,
        storageKey: photo.storageKey,
        storageProvider: photo.storageProvider,
        url: photo.url,
      })),
    });

    return this.findPhotosForSighting(sightingId, client);
  }

  async findPhotoById(
    photoId: string,
    client: SightingDbClient = this.prisma,
  ): Promise<SightingPhotoRecord | null> {
    const photo = await client.sightingPhoto.findUnique({ where: { id: photoId } });
    return photo ? mapPhoto(photo) : null;
  }

  async findPhotosForSighting(
    sightingId: string,
    client: SightingDbClient = this.prisma,
  ): Promise<SightingPhotoRecord[]> {
    const photos = await client.sightingPhoto.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }],
      where: { sightingId },
    });

    return photos.map(mapPhoto);
  }

  async deletePhoto(
    photoId: string,
    client: SightingDbClient = this.prisma,
  ): Promise<SightingPhotoRecord | null> {
    const photo = await this.findPhotoById(photoId, client);
    if (!photo) {
      return null;
    }

    await client.sightingPhoto.delete({ where: { id: photoId } });
    return photo;
  }

  private listWhere(input: ListSightingsInput): Prisma.Sql[] {
    const where: Prisma.Sql[] = [];

    if (input.publicOnly) {
      where.push(...publicVisibilityWhere());
    }

    if (input.reporterId) {
      where.push(Prisma.sql`"reporter_id" = CAST(${input.reporterId} AS uuid)`);
    }

    if (input.query?.trim()) {
      const query = `%${input.query.trim()}%`;
      where.push(Prisma.sql`
        (
          "color" ILIKE ${query}
          OR "pattern" ILIKE ${query}
          OR "description" ILIKE ${query}
          OR "id"::text ILIKE ${query}
        )
      `);
    }

    if (input.species) {
      where.push(Prisma.sql`"species" = CAST(${input.species} AS "AnimalSpecies")`);
    }

    if (input.condition) {
      where.push(Prisma.sql`"condition" = CAST(${input.condition} AS "AnimalCondition")`);
    }

    if (input.lifecycleStatus) {
      where.push(
        Prisma.sql`"lifecycle_status" = CAST(${input.lifecycleStatus} AS "SightingLifecycleStatus")`,
      );
    }

    if (input.verificationStatus) {
      where.push(
        Prisma.sql`"verification_status" = CAST(${input.verificationStatus} AS "VerificationStatus")`,
      );
    }

    if (input.urgency) {
      where.push(Prisma.sql`"urgency" = CAST(${input.urgency} AS "UrgencyLevel")`);
    }

    if (input.seenFrom) {
      where.push(Prisma.sql`"seen_at" >= ${input.seenFrom}`);
    }

    if (input.seenTo) {
      where.push(Prisma.sql`"seen_at" <= ${input.seenTo}`);
    }

    if (input.createdFrom) {
      where.push(Prisma.sql`"created_at" >= ${input.createdFrom}`);
    }

    if (input.createdTo) {
      where.push(Prisma.sql`"created_at" <= ${input.createdTo}`);
    }

    if (nearbyConfigured(input)) {
      this.locationPrivacy.assertLatitude(input.latitude);
      this.locationPrivacy.assertLongitude(input.longitude);
      where.push(Prisma.sql`
        ST_DWithin(
          "public_location",
          ST_SetSRID(ST_MakePoint(${input.longitude}, ${input.latitude}), 4326)::geography,
          ${input.radiusMeters}
        )
      `);
    }

    return where.length > 0 ? where : [Prisma.sql`TRUE`];
  }

  private async attachPhotos(
    sightings: SightingRecord[],
    client: SightingDbClient,
  ): Promise<SightingRecord[]> {
    if (sightings.length === 0) {
      return sightings;
    }

    const ids = sightings.map((sighting) => Prisma.sql`CAST(${sighting.id} AS uuid)`);
    const rows = await client.$queryRaw<SightingPhotoRow[]>(Prisma.sql`
      SELECT
        "id"::text AS "id",
        "sighting_id"::text AS "sightingId",
        "storage_provider" AS "storageProvider",
        "storage_key" AS "storageKey",
        "url" AS "url",
        "mime_type" AS "mimeType",
        "file_size_bytes" AS "fileSizeBytes",
        "sort_order" AS "sortOrder",
        "created_at" AS "createdAt"
      FROM "sighting_photos"
      WHERE "sighting_id" IN (${Prisma.join(ids)})
      ORDER BY "sighting_id" ASC, "sort_order" ASC, "created_at" ASC, "id" ASC
    `);
    const photosBySighting = new Map<string, SightingPhotoRecord[]>();
    for (const row of rows) {
      const photos = photosBySighting.get(row.sightingId) ?? [];
      photos.push(mapPhoto(row));
      photosBySighting.set(row.sightingId, photos);
    }

    return sightings.map((sighting) => ({
      ...sighting,
      photos: photosBySighting.get(sighting.id) ?? [],
    }));
  }
}

function publicVisibilityWhere(): Prisma.Sql[] {
  return [
    Prisma.sql`"public_location" IS NOT NULL`,
    Prisma.sql`"verification_status" NOT IN (CAST(${VerificationStatus.REJECTED} AS "VerificationStatus"), CAST(${VerificationStatus.DUPLICATE} AS "VerificationStatus"))`,
  ];
}

function nearbyConfigured(input: {
  latitude?: number;
  longitude?: number;
  radiusMeters?: number;
}): input is { latitude: number; longitude: number; radiusMeters: number } {
  return (
    input.latitude !== undefined &&
    input.longitude !== undefined &&
    input.radiusMeters !== undefined
  );
}

function selectSightingSql(
  includeExactLocation: boolean,
  distanceSql: Prisma.Sql = Prisma.sql`NULL::float8`,
): Prisma.Sql {
  return Prisma.sql`
    SELECT
      "id"::text AS "id",
      "reporter_id"::text AS "reporterId",
      "species" AS "species",
      "animal_count" AS "animalCount",
      "color" AS "color",
      "pattern" AS "pattern",
      "collar_status" AS "collarStatus",
      "condition" AS "condition",
      "description" AS "description",
      "seen_at" AS "seenAt",
      "urgency" AS "urgency",
      "lifecycle_status" AS "lifecycleStatus",
      "verification_status" AS "verificationStatus",
      ST_Y("public_location"::geometry)::float8 AS "publicLatitude",
      ST_X("public_location"::geometry)::float8 AS "publicLongitude",
      "public_radius_meters" AS "publicRadiusMeters",
      ${
        includeExactLocation
          ? Prisma.sql`ST_Y("exact_location"::geometry)::float8`
          : Prisma.sql`NULL::float8`
      } AS "exactLatitude",
      ${
        includeExactLocation
          ? Prisma.sql`ST_X("exact_location"::geometry)::float8`
          : Prisma.sql`NULL::float8`
      } AS "exactLongitude",
      "created_at" AS "createdAt",
      "updated_at" AS "updatedAt",
      ${distanceSql} AS "distanceMeters"
  `;
}

function mapRow(row: SightingRow): SightingRecord {
  return {
    animalCount: row.animalCount,
    collarStatus: row.collarStatus,
    color: row.color,
    condition: row.condition,
    createdAt: row.createdAt,
    description: row.description,
    distanceMeters: row.distanceMeters ?? undefined,
    exactLocation:
      row.exactLatitude !== null && row.exactLongitude !== null
        ? { latitude: row.exactLatitude, longitude: row.exactLongitude }
        : undefined,
    id: row.id,
    lifecycleStatus: row.lifecycleStatus,
    pattern: row.pattern,
    photos: [],
    rejectionReason: null,
    publicLocation: {
      latitude: row.publicLatitude,
      longitude: row.publicLongitude,
    },
    publicRadiusMeters: row.publicRadiusMeters,
    reporterId: row.reporterId,
    seenAt: row.seenAt,
    species: row.species,
    updatedAt: row.updatedAt,
    urgency: row.urgency,
    verificationStatus: row.verificationStatus,
  };
}

function mapPhoto(row: SightingPhotoRow): SightingPhotoRecord {
  return {
    createdAt: row.createdAt,
    fileSizeBytes: row.fileSizeBytes,
    id: row.id,
    mimeType: row.mimeType,
    sightingId: row.sightingId,
    sortOrder: row.sortOrder,
    storageKey: row.storageKey,
    storageProvider: row.storageProvider,
    url: row.url,
  };
}
