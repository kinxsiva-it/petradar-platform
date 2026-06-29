import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import {
  AnimalCondition,
  AnimalSpecies,
  CollarStatus,
  Prisma,
  SightingLifecycleStatus,
  UrgencyLevel,
  VerificationStatus,
} from '@prisma/client';

import { LocationPrivacyService, PrismaService } from '@petradar/backend/shared';

export interface CreateSightingInput {
  reporterId?: string | null;
  species: AnimalSpecies;
  animalCount: number;
  color?: string | null;
  pattern?: string | null;
  collarStatus?: CollarStatus;
  condition?: AnimalCondition;
  description?: string | null;
  seenAt: Date;
  urgency?: UrgencyLevel;
  lifecycleStatus?: SightingLifecycleStatus;
  verificationStatus?: VerificationStatus;
  exactLatitude: number;
  exactLongitude: number;
  publicRadiusMeters?: number;
}

export interface NearbyPublicSighting {
  id: string;
  distanceMeters: number;
}

interface NearbySightingRow {
  id: string;
  distance_meters: number;
}

@Injectable()
export class SightingsRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly locationPrivacy: LocationPrivacyService,
  ) {}

  async create(input: CreateSightingInput): Promise<{ id: string }> {
    this.locationPrivacy.assertLatitude(input.exactLatitude);
    this.locationPrivacy.assertLongitude(input.exactLongitude);

    const id = randomUUID();
    const publicLocation = this.locationPrivacy.generatePublicLocation({
      entityId: id,
      latitude: input.exactLatitude,
      longitude: input.exactLongitude,
      radiusMeters: input.publicRadiusMeters,
    });

    await this.prisma.$executeRaw`
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
        CAST(${input.reporterId ?? null} AS uuid),
        CAST(${input.species} AS "AnimalSpecies"),
        ${input.animalCount},
        ${input.color ?? null},
        ${input.pattern ?? null},
        CAST(${input.collarStatus ?? CollarStatus.UNKNOWN} AS "CollarStatus"),
        CAST(${input.condition ?? AnimalCondition.UNKNOWN} AS "AnimalCondition"),
        ${input.description ?? null},
        ${input.seenAt},
        CAST(${input.urgency ?? UrgencyLevel.LOW} AS "UrgencyLevel"),
        CAST(${input.lifecycleStatus ?? SightingLifecycleStatus.SIGHTING} AS "SightingLifecycleStatus"),
        CAST(${input.verificationStatus ?? VerificationStatus.PENDING} AS "VerificationStatus"),
        ST_SetSRID(ST_MakePoint(${input.exactLongitude}, ${input.exactLatitude}), 4326)::geography,
        ST_SetSRID(ST_MakePoint(${publicLocation.longitude}, ${publicLocation.latitude}), 4326)::geography,
        ${publicLocation.radiusMeters}
      )
    `;

    return { id };
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
      WHERE ST_DWithin(
        "public_location",
        ST_SetSRID(ST_MakePoint(${input.longitude}, ${input.latitude}), 4326)::geography,
        ${input.radiusMeters}
      )
      ORDER BY "distance_meters" ASC
      LIMIT ${limit}
    `);

    return rows.map((row) => ({
      distanceMeters: row.distance_meters,
      id: row.id,
    }));
  }
}
