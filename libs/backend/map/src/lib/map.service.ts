import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '@petradar/backend/shared';

import { HeatmapQueryDto, MapSightingsQueryDto, NearbyQueryDto } from './dto/map-query.dto.js';

interface MapSightingRow {
  id: string;
  species: string;
  condition: string;
  urgency: string;
  lifecycleStatus: string;
  verificationStatus: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  thumbnailUrl: string | null;
  seenAt: Date;
  distanceMeters: number | null;
}

interface HeatmapRow {
  latitude: number;
  longitude: number;
  count: bigint | number;
  weight: number;
}

@Injectable()
export class MapService {
  constructor(private readonly prisma: PrismaService) {}

  async sightings(query: MapSightingsQueryDto): Promise<{ items: ReturnType<typeof mapSighting>[] }> {
    const pageSize = Math.min(Math.max(query.pageSize ?? 100, 1), 100);
    const page = Math.max(query.page ?? 1, 1);
    const rows = await this.prisma.$queryRaw<MapSightingRow[]>(Prisma.sql`
      ${mapSightingSelectSql(Prisma.sql`NULL::float8`)}
      FROM "animal_sightings" s
      LEFT JOIN LATERAL (
        SELECT p."url"
        FROM "sighting_photos" p
        WHERE p."sighting_id" = s."id"
        ORDER BY p."sort_order" ASC, p."created_at" ASC, p."id" ASC
        LIMIT 1
      ) p ON true
      WHERE ${Prisma.join(whereForMapQuery(query), ' AND ')}
      ORDER BY s."seen_at" DESC, s."created_at" DESC, s."id" DESC
      LIMIT ${pageSize}
      OFFSET ${(page - 1) * pageSize}
    `);

    return { items: rows.map(mapSighting) };
  }

  async heatmap(query: HeatmapQueryDto): Promise<{ items: ReturnType<typeof mapHeatmap>[] }> {
    const limit = Math.min(Math.max(query.limit ?? 100, 1), 200);
    const minCount = Math.min(Math.max(query.minCount ?? 1, 1), 20);
    const rows = await this.prisma.$queryRaw<HeatmapRow[]>(Prisma.sql`
      SELECT
        ROUND(ST_Y(s."public_location"::geometry)::numeric, 2)::float8 AS "latitude",
        ROUND(ST_X(s."public_location"::geometry)::numeric, 2)::float8 AS "longitude",
        COUNT(*) AS "count",
        SUM(
          CASE s."urgency"
            WHEN CAST(${'EMERGENCY'} AS "UrgencyLevel") THEN 4
            WHEN CAST(${'HIGH'} AS "UrgencyLevel") THEN 3
            WHEN CAST(${'MEDIUM'} AS "UrgencyLevel") THEN 2
            ELSE 1
          END
        )::float8 AS "weight"
      FROM "animal_sightings" s
      WHERE ${Prisma.join(whereForMapQuery(query), ' AND ')}
      GROUP BY 1, 2
      HAVING COUNT(*) >= ${minCount}
      ORDER BY "weight" DESC, "count" DESC
      LIMIT ${limit}
    `);

    return { items: rows.map(mapHeatmap) };
  }

  async nearby(query: NearbyQueryDto): Promise<{ items: ReturnType<typeof mapSighting>[] }> {
    const limit = Math.min(Math.max(query.limit ?? 50, 1), 100);
    const distanceSql = Prisma.sql`
      ST_Distance(
        s."public_location",
        ST_SetSRID(ST_MakePoint(${query.lng}, ${query.lat}), 4326)::geography
      )::float8
    `;
    const rows = await this.prisma.$queryRaw<MapSightingRow[]>(Prisma.sql`
      ${mapSightingSelectSql(distanceSql)}
      FROM "animal_sightings" s
      LEFT JOIN LATERAL (
        SELECT p."url"
        FROM "sighting_photos" p
        WHERE p."sighting_id" = s."id"
        ORDER BY p."sort_order" ASC, p."created_at" ASC, p."id" ASC
        LIMIT 1
      ) p ON true
      WHERE ${Prisma.join(
        [
          ...whereForMapQuery({}),
          Prisma.sql`
            ST_DWithin(
              s."public_location",
              ST_SetSRID(ST_MakePoint(${query.lng}, ${query.lat}), 4326)::geography,
              ${query.radius}
            )
          `,
        ],
        ' AND ',
      )}
      ORDER BY "distanceMeters" ASC, s."seen_at" DESC
      LIMIT ${limit}
    `);

    return { items: rows.map(mapSighting) };
  }
}

function whereForMapQuery(query: MapSightingsQueryDto): Prisma.Sql[] {
  const where: Prisma.Sql[] = [
    Prisma.sql`s."public_location" IS NOT NULL`,
    Prisma.sql`s."verification_status" NOT IN (CAST(${'REJECTED'} AS "VerificationStatus"), CAST(${'DUPLICATE'} AS "VerificationStatus"))`,
  ];

  if (query.species) where.push(Prisma.sql`s."species" = CAST(${query.species} AS "AnimalSpecies")`);
  if (query.condition) where.push(Prisma.sql`s."condition" = CAST(${query.condition} AS "AnimalCondition")`);
  if (query.status) where.push(Prisma.sql`s."lifecycle_status" = CAST(${query.status} AS "SightingLifecycleStatus")`);
  if (query.verification) where.push(Prisma.sql`s."verification_status" = CAST(${query.verification} AS "VerificationStatus")`);
  if (query.seenFrom) where.push(Prisma.sql`s."seen_at" >= ${new Date(query.seenFrom)}`);
  if (query.seenTo) where.push(Prisma.sql`s."seen_at" <= ${new Date(query.seenTo)}`);

  if (
    query.north !== undefined &&
    query.south !== undefined &&
    query.east !== undefined &&
    query.west !== undefined
  ) {
    where.push(Prisma.sql`
      ST_Intersects(
        s."public_location"::geometry,
        ST_MakeEnvelope(${query.west}, ${query.south}, ${query.east}, ${query.north}, 4326)
      )
    `);
  }

  return where;
}

function mapSightingSelectSql(distanceSql: Prisma.Sql): Prisma.Sql {
  return Prisma.sql`
    SELECT
      s."id"::text AS "id",
      s."species"::text AS "species",
      s."condition"::text AS "condition",
      s."urgency"::text AS "urgency",
      s."lifecycle_status"::text AS "lifecycleStatus",
      s."verification_status"::text AS "verificationStatus",
      ST_Y(s."public_location"::geometry)::float8 AS "latitude",
      ST_X(s."public_location"::geometry)::float8 AS "longitude",
      s."public_radius_meters" AS "radiusMeters",
      p."url" AS "thumbnailUrl",
      s."seen_at" AS "seenAt",
      ${distanceSql} AS "distanceMeters"
  `;
}

function mapSighting(row: MapSightingRow) {
  return {
    condition: row.condition,
    distanceMeters: row.distanceMeters ?? undefined,
    id: row.id,
    latitude: row.latitude,
    lifecycleStatus: row.lifecycleStatus,
    longitude: row.longitude,
    radiusMeters: row.radiusMeters,
    seenAt: row.seenAt.toISOString(),
    species: row.species,
    thumbnailUrl: row.thumbnailUrl,
    urgency: row.urgency,
    verificationStatus: row.verificationStatus,
  };
}

function mapHeatmap(row: HeatmapRow) {
  const count = typeof row.count === 'bigint' ? Number(row.count) : row.count;
  return {
    count,
    latitude: row.latitude,
    longitude: row.longitude,
    weight: row.weight,
  };
}
