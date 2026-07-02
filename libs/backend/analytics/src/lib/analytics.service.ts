import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '@petradar/backend/shared';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async summary() {
    const [sightingRows, lostRows, matchRows, rescueRows] = await Promise.all([
      this.prisma.$queryRaw<Record<string, bigint | number>[]>`
        SELECT
          COUNT(*) AS "totalSightings",
          COUNT(*) FILTER (WHERE "verification_status" = CAST(${'PENDING'} AS "VerificationStatus")) AS "pendingSightings",
          COUNT(*) FILTER (WHERE "verification_status" = CAST(${'VERIFIED'} AS "VerificationStatus")) AS "verifiedSightings",
          COUNT(*) FILTER (WHERE "condition" IN (
            CAST(${'INJURED'} AS "AnimalCondition"),
            CAST(${'NEEDS_RESCUE'} AS "AnimalCondition"),
            CAST(${'SICK'} AS "AnimalCondition")
          )) AS "injuredCases"
        FROM "animal_sightings"
      `,
      this.prisma.$queryRaw<Record<string, bigint | number>[]>`
        SELECT COUNT(*) FILTER (WHERE "status" IN (
          CAST(${'LOST'} AS "LostPetStatus"),
          CAST(${'POSSIBLE_MATCH'} AS "LostPetStatus")
        )) AS "activeLostPets"
        FROM "lost_pets"
      `,
      this.prisma.$queryRaw<Record<string, bigint | number>[]>`
        SELECT COUNT(*) FILTER (WHERE "review_status" = CAST(${'PENDING'} AS "MatchReviewStatus")) AS "possibleMatches"
        FROM "match_results"
      `,
      this.prisma.$queryRaw<Record<string, bigint | number>[]>`
        SELECT
          COUNT(*) FILTER (WHERE "status" NOT IN (
            CAST(${'RESOLVED'} AS "RescueCaseStatus"),
            CAST(${'CLOSED'} AS "RescueCaseStatus")
          )) AS "activeRescueCases",
          COUNT(*) FILTER (WHERE "status" IN (
            CAST(${'RESOLVED'} AS "RescueCaseStatus"),
            CAST(${'CLOSED'} AS "RescueCaseStatus")
          )) AS "resolvedRescueCases"
        FROM "rescue_cases"
      `,
    ]);

    return {
      ...numberRecord(sightingRows[0] ?? {}),
      ...numberRecord(lostRows[0] ?? {}),
      ...numberRecord(matchRows[0] ?? {}),
      ...numberRecord(rescueRows[0] ?? {}),
    };
  }

  async bySpecies() {
    const rows = await this.prisma.$queryRaw<{ species: string; count: bigint | number }[]>`
      SELECT "species"::text AS "species", COUNT(*) AS "count"
      FROM "animal_sightings"
      GROUP BY "species"
      ORDER BY "species" ASC
    `;
    return { items: rows.map((row) => ({ count: toNumber(row.count), species: row.species })) };
  }

  async byStatus() {
    const [sightingRows, lostPetRows, matchRows, rescueRows] = await Promise.all([
      this.prisma.$queryRaw<{ status: string; count: bigint | number }[]>`
        SELECT "lifecycle_status"::text AS "status", COUNT(*) AS "count"
        FROM "animal_sightings"
        GROUP BY "lifecycle_status"
        ORDER BY "lifecycle_status" ASC
      `,
      this.prisma.$queryRaw<{ status: string; count: bigint | number }[]>`
        SELECT "status"::text AS "status", COUNT(*) AS "count"
        FROM "lost_pets"
        GROUP BY "status"
        ORDER BY "status" ASC
      `,
      this.prisma.$queryRaw<{ status: string; count: bigint | number }[]>`
        SELECT "review_status"::text AS "status", COUNT(*) AS "count"
        FROM "match_results"
        GROUP BY "review_status"
        ORDER BY "review_status" ASC
      `,
      this.prisma.$queryRaw<{ status: string; count: bigint | number }[]>`
        SELECT "status"::text AS "status", COUNT(*) AS "count"
        FROM "rescue_cases"
        GROUP BY "status"
        ORDER BY "status" ASC
      `,
    ]);
    return {
      lostPets: groupRows(lostPetRows),
      matches: groupRows(matchRows),
      rescueCases: groupRows(rescueRows),
      sightings: groupRows(sightingRows),
    };
  }

  async hotspots() {
    const rows = await this.prisma.$queryRaw<{
      latitude: number;
      longitude: number;
      count: bigint | number;
      weight: number;
    }[]>(Prisma.sql`
      SELECT
        ROUND(ST_Y("public_location"::geometry)::numeric, 2)::float8 AS "latitude",
        ROUND(ST_X("public_location"::geometry)::numeric, 2)::float8 AS "longitude",
        COUNT(*) AS "count",
        SUM(
          CASE "urgency"
            WHEN CAST(${'EMERGENCY'} AS "UrgencyLevel") THEN 4
            WHEN CAST(${'HIGH'} AS "UrgencyLevel") THEN 3
            WHEN CAST(${'MEDIUM'} AS "UrgencyLevel") THEN 2
            ELSE 1
          END
        )::float8 AS "weight"
      FROM "animal_sightings"
      WHERE "verification_status" NOT IN (
        CAST(${'REJECTED'} AS "VerificationStatus"),
        CAST(${'DUPLICATE'} AS "VerificationStatus")
      )
      GROUP BY 1, 2
      ORDER BY "weight" DESC, "count" DESC
      LIMIT 100
    `);
    return {
      items: rows.map((row) => ({
        count: toNumber(row.count),
        latitude: row.latitude,
        longitude: row.longitude,
        weight: row.weight,
      })),
    };
  }
}

function numberRecord(record: Record<string, bigint | number>): Record<string, number> {
  return Object.fromEntries(Object.entries(record).map(([key, value]) => [key, toNumber(value)]));
}

function toNumber(value: bigint | number): number {
  return typeof value === 'bigint' ? Number(value) : value;
}

function groupRows(rows: { status: string; count: bigint | number }[]) {
  return rows.map((row) => ({ count: toNumber(row.count), status: row.status }));
}
