import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { NotificationType, Prisma, UserRole } from '@prisma/client';

import { AuditService } from '@petradar/backend/audit';
import type { AuthenticatedUser } from '@petradar/backend/auth';
import { NotificationsService } from '@petradar/backend/notifications';
import { PrismaService } from '@petradar/backend/shared';

import { ListMatchesQueryDto } from './dto/matches.dto.js';

interface LostPetForMatch {
  id: string;
  ownerId: string;
  name: string;
  species: string;
  color: string | null;
  pattern: string | null;
  collarDescription: string | null;
  description: string | null;
  lastSeenAt: Date;
}

interface CandidateSighting {
  id: string;
  species: string;
  color: string | null;
  pattern: string | null;
  collarStatus: string | null;
  condition: string;
  description: string | null;
  seenAt: Date;
  publicLatitude: number;
  publicLongitude: number;
  publicRadiusMeters: number;
  distanceMeters: number;
}

interface MatchRow {
  id: string;
  lostPetId: string;
  lostPetOwnerId: string;
  lostPetName: string;
  sightingId: string;
  score: number;
  level: string;
  reviewStatus: string;
  reasons: unknown;
  distanceMeters: number | null;
  matchedAt: Date;
  reviewedAt: Date | null;
  rejectionReason: string | null;
  species: string;
  sightingCondition: string;
  sightingSeenAt: Date;
  sightingLatitude: number;
  sightingLongitude: number;
  sightingRadiusMeters: number;
}

@Injectable()
export class MatchingService {
  constructor(
    private readonly audit: AuditService,
    private readonly notifications: NotificationsService,
    private readonly prisma: PrismaService,
  ) {}

  async runForLostPet(user: AuthenticatedUser, lostPetId: string, requestId?: string | null) {
    const lostPet = await this.loadLostPetForAccess(user, lostPetId);
    const candidates = await this.candidateSightings(lostPetId);
    const scored = candidates
      .map((candidate) => scoreCandidate(lostPet, candidate))
      .filter((match) => match.score > 0);

    await this.prisma.$transaction(async (tx) => {
      for (const match of scored) {
        await tx.$executeRaw`
          INSERT INTO "match_results" (
            "lost_pet_id",
            "sighting_id",
            "score",
            "level",
            "reasons",
            "distance_meters",
            "matched_at",
            "updated_at"
          )
          VALUES (
            CAST(${lostPetId} AS uuid),
            CAST(${match.sightingId} AS uuid),
            ${match.score},
            CAST(${match.level} AS "MatchLevel"),
            CAST(${JSON.stringify(match.reasons)} AS jsonb),
            ${match.distanceMeters},
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
          )
          ON CONFLICT ("lost_pet_id", "sighting_id")
          DO UPDATE SET
            "score" = EXCLUDED."score",
            "level" = EXCLUDED."level",
            "reasons" = EXCLUDED."reasons",
            "distance_meters" = EXCLUDED."distance_meters",
            "matched_at" = CURRENT_TIMESTAMP,
            "updated_at" = CURRENT_TIMESTAMP
        `;
      }

      if (scored.some((match) => match.score >= 40)) {
        await tx.$executeRaw`
          UPDATE "lost_pets"
          SET "status" = CAST(${'POSSIBLE_MATCH'} AS "LostPetStatus"), "updated_at" = CURRENT_TIMESTAMP
          WHERE "id" = CAST(${lostPetId} AS uuid) AND "status" = CAST(${'LOST'} AS "LostPetStatus")
        `;
      }

      await this.audit.createWithClient(tx, {
        action: 'LOST_PET_MATCHING_RUN',
        actorId: user.id,
        entityId: lostPetId,
        entityType: 'LostPet',
        metadata: { actorId: user.id, candidateCount: candidates.length, matchCount: scored.length, lostPetId },
        requestId,
      });
    });

    if (scored.length > 0) {
      await this.notifications.createNotificationIfNotExists({
        actionUrl: '/matches',
        message: 'PetRadar found a possible match for your lost pet.',
        resourceId: lostPet.id,
        resourceType: 'lost_pet',
        title: 'Possible match found',
        type: NotificationType.MATCH_FOUND,
        userId: lostPet.ownerId,
      });
    }

    return this.listForLostPet(user, lostPetId);
  }

  async listForLostPet(user: AuthenticatedUser, lostPetId: string) {
    await this.loadLostPetForAccess(user, lostPetId);
    const rows = await this.matchRows(Prisma.sql`m."lost_pet_id" = CAST(${lostPetId} AS uuid)`);
    return { items: rows.map(toMatchResponse) };
  }

  async list(user: AuthenticatedUser, query: ListMatchesQueryDto) {
    const page = Math.max(query.page ?? 1, 1);
    const pageSize = Math.min(Math.max(query.pageSize ?? 25, 1), 50);
    const where: Prisma.Sql[] = [];
    if (!user.roles.includes(UserRole.ADMIN)) {
      where.push(Prisma.sql`lp."owner_id" = CAST(${user.id} AS uuid)`);
    }
    if (query.status) {
      where.push(Prisma.sql`m."review_status" = CAST(${query.status} AS "MatchReviewStatus")`);
    }
    const whereSql = where.length > 0 ? Prisma.join(where, ' AND ') : Prisma.sql`TRUE`;
    const rows = await this.matchRows(whereSql, pageSize, (page - 1) * pageSize);
    const countRows = await this.prisma.$queryRaw<{ total: bigint | number }[]>(Prisma.sql`
      SELECT COUNT(*) AS "total"
      FROM "match_results" m
      JOIN "lost_pets" lp ON lp."id" = m."lost_pet_id"
      WHERE ${whereSql}
    `);
    const totalValue = countRows[0]?.total ?? 0;
    const total = typeof totalValue === 'bigint' ? Number(totalValue) : totalValue;
    return { items: rows.map(toMatchResponse), page, pageSize, total, totalPages: Math.ceil(total / pageSize) };
  }

  async detail(user: AuthenticatedUser, id: string) {
    const rows = await this.matchRows(Prisma.sql`m."id" = CAST(${id} AS uuid)`);
    const row = rows[0];
    if (!row) {
      throw new NotFoundException('Match not found.');
    }
    this.assertMatchAccess(user, row);
    return toMatchResponse(row);
  }

  async confirm(admin: AuthenticatedUser, id: string) {
    this.assertAdmin(admin);
    return this.review(admin, id, 'CONFIRMED', null);
  }

  async reject(admin: AuthenticatedUser, id: string, reason?: string | null) {
    this.assertAdmin(admin);
    const trimmedReason = reason?.trim();
    const reviewReason = trimmedReason === undefined || trimmedReason.length === 0 ? null : trimmedReason;
    return this.review(admin, id, 'REJECTED', reviewReason);
  }

  private async review(
    admin: AuthenticatedUser,
    id: string,
    nextStatus: 'CONFIRMED' | 'REJECTED',
    reason: string | null,
  ) {
    const updated = await this.prisma.$transaction(async (tx) => {
      const rows = await tx.$queryRaw<{ id: string; sightingId: string }[]>(Prisma.sql`
        UPDATE "match_results"
        SET
          "review_status" = CAST(${nextStatus} AS "MatchReviewStatus"),
          "reviewer_id" = CAST(${admin.id} AS uuid),
          "reviewed_at" = CURRENT_TIMESTAMP,
          "rejection_reason" = ${reason},
          "updated_at" = CURRENT_TIMESTAMP
        WHERE "id" = CAST(${id} AS uuid)
          AND "review_status" = CAST(${'PENDING'} AS "MatchReviewStatus")
        RETURNING "id"::text AS "id", "sighting_id"::text AS "sightingId"
      `);
      const row = rows[0];
      if (!row) {
        return null;
      }

      if (nextStatus === 'CONFIRMED') {
        await tx.$executeRaw`
          UPDATE "animal_sightings"
          SET "lifecycle_status" = CAST(${'POSSIBLE_MATCH'} AS "SightingLifecycleStatus"), "updated_at" = CURRENT_TIMESTAMP
          WHERE "id" = CAST(${row.sightingId} AS uuid)
        `;
      }

      await this.audit.createWithClient(tx, {
        action: nextStatus === 'CONFIRMED' ? 'MATCH_CONFIRMED' : 'MATCH_REJECTED',
        actorId: admin.id,
        entityId: id,
        entityType: 'MatchResult',
        metadata: { actorId: admin.id, matchId: id, newStatus: nextStatus, ...(reason ? { reason } : {}) },
      });

      return row;
    });

    if (!updated) {
      throw new ConflictException('This match has already been reviewed.');
    }

    const detail = await this.detail(admin, id);
    const owner = await this.prisma.matchResult.findUnique({
      select: { lostPet: { select: { ownerId: true } } },
      where: { id },
    });
    if (owner) {
      const confirmed = nextStatus === 'CONFIRMED';
      await this.notifications.createNotificationIfNotExists({
        actionUrl: `/matches/${id}`,
        message: confirmed
          ? 'A possible match for your lost pet has been confirmed.'
          : 'A possible match for your lost pet was reviewed and rejected.',
        resourceId: id,
        resourceType: 'match_result',
        title: confirmed ? 'Match confirmed' : 'Match rejected',
        type: confirmed ? NotificationType.MATCH_CONFIRMED : NotificationType.MATCH_REJECTED,
        userId: owner.lostPet.ownerId,
      });
    }
    return detail;
  }

  private async loadLostPetForAccess(
    user: AuthenticatedUser,
    lostPetId: string,
  ): Promise<LostPetForMatch> {
    const rows = await this.prisma.$queryRaw<LostPetForMatch[]>(Prisma.sql`
      SELECT
        "id"::text AS "id",
        "owner_id"::text AS "ownerId",
        "name",
        "species"::text AS "species",
        "color",
        "pattern",
        "collar_description" AS "collarDescription",
        "description",
        "last_seen_at" AS "lastSeenAt"
      FROM "lost_pets"
      WHERE "id" = CAST(${lostPetId} AS uuid)
      LIMIT 1
    `);
    const row = rows[0];
    if (!row) {
      throw new NotFoundException('Lost pet not found.');
    }
    if (row.ownerId !== user.id && !user.roles.includes(UserRole.ADMIN)) {
      throw new ForbiddenException('Lost pet access denied.');
    }
    return row;
  }

  private async candidateSightings(lostPetId: string): Promise<CandidateSighting[]> {
    return this.prisma.$queryRaw<CandidateSighting[]>(Prisma.sql`
      SELECT
        s."id"::text AS "id",
        s."species"::text AS "species",
        s."color",
        s."pattern",
        s."collar_status"::text AS "collarStatus",
        s."condition"::text AS "condition",
        s."description",
        s."seen_at" AS "seenAt",
        ST_Y(s."public_location"::geometry)::float8 AS "publicLatitude",
        ST_X(s."public_location"::geometry)::float8 AS "publicLongitude",
        s."public_radius_meters" AS "publicRadiusMeters",
        ST_Distance(lp."exact_last_seen_location", s."public_location")::float8 AS "distanceMeters"
      FROM "lost_pets" lp
      JOIN "animal_sightings" s ON s."species" = lp."species"
      WHERE lp."id" = CAST(${lostPetId} AS uuid)
        AND s."verification_status" NOT IN (
          CAST(${'REJECTED'} AS "VerificationStatus"),
          CAST(${'DUPLICATE'} AS "VerificationStatus")
        )
        AND ABS(EXTRACT(EPOCH FROM (s."seen_at" - lp."last_seen_at"))) <= ${14 * 24 * 60 * 60}
        AND ST_DWithin(lp."exact_last_seen_location", s."public_location", ${50_000})
      ORDER BY "distanceMeters" ASC, s."seen_at" DESC
      LIMIT 100
    `);
  }

  private async matchRows(whereSql: Prisma.Sql, limit = 50, offset = 0): Promise<MatchRow[]> {
    return this.prisma.$queryRaw<MatchRow[]>(Prisma.sql`
      SELECT
        m."id"::text AS "id",
        m."lost_pet_id"::text AS "lostPetId",
        lp."owner_id"::text AS "lostPetOwnerId",
        lp."name" AS "lostPetName",
        m."sighting_id"::text AS "sightingId",
        m."score",
        m."level"::text AS "level",
        m."review_status"::text AS "reviewStatus",
        m."reasons",
        m."distance_meters" AS "distanceMeters",
        m."matched_at" AS "matchedAt",
        m."reviewed_at" AS "reviewedAt",
        m."rejection_reason" AS "rejectionReason",
        s."species"::text AS "species",
        s."condition"::text AS "sightingCondition",
        s."seen_at" AS "sightingSeenAt",
        ST_Y(s."public_location"::geometry)::float8 AS "sightingLatitude",
        ST_X(s."public_location"::geometry)::float8 AS "sightingLongitude",
        s."public_radius_meters" AS "sightingRadiusMeters"
      FROM "match_results" m
      JOIN "lost_pets" lp ON lp."id" = m."lost_pet_id"
      JOIN "animal_sightings" s ON s."id" = m."sighting_id"
      WHERE ${whereSql}
      ORDER BY m."score" DESC, m."matched_at" DESC, m."id" DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `);
  }

  private assertMatchAccess(user: AuthenticatedUser, row: MatchRow): void {
    if (row.lostPetOwnerId !== user.id && !user.roles.includes(UserRole.ADMIN)) {
      throw new ForbiddenException('Match access denied.');
    }
  }

  private assertAdmin(user: AuthenticatedUser): void {
    if (!user.roles.includes(UserRole.ADMIN)) {
      throw new ForbiddenException('Admin access required.');
    }
  }
}

function scoreCandidate(lostPet: LostPetForMatch, sighting: CandidateSighting) {
  const reasons: string[] = ['Species match'];
  let score = 30;
  if (sharedTerm(lostPet.color, sighting.color)) {
    score += 20;
    reasons.push('Color match');
  }
  if (sharedTerm(lostPet.collarDescription, sighting.collarStatus)) {
    score += 15;
    reasons.push('Collar match');
  }
  if (sighting.distanceMeters <= 1_000) {
    score += 20;
    reasons.push('Within 1 kilometer');
  }
  if (Math.abs(sighting.seenAt.getTime() - lostPet.lastSeenAt.getTime()) <= 7 * 24 * 60 * 60 * 1000) {
    score += 15;
    reasons.push('Within 7 days');
  }
  if (
    sharedTerm(lostPet.pattern, sighting.pattern) ||
    sharedTerm(lostPet.description, sighting.description)
  ) {
    score += 10;
    reasons.push('Pattern or description match');
  }
  const capped = Math.min(score, 100);
  return {
    distanceMeters: sighting.distanceMeters,
    level: capped >= 70 ? 'HIGH' : capped >= 40 ? 'MEDIUM' : 'LOW',
    reasons,
    score: capped,
    sightingId: sighting.id,
  };
}

function sharedTerm(left: string | null, right: string | null): boolean {
  const leftTerms = terms(left);
  if (leftTerms.size === 0) return false;
  for (const term of terms(right)) {
    if (leftTerms.has(term)) return true;
  }
  return false;
}

function terms(value: string | null): Set<string> {
  return new Set(
    (value ?? '')
      .toLowerCase()
      .replace(/[^a-z0-9 ]/g, ' ')
      .split(/\s+/)
      .filter((term) => term.length >= 3),
  );
}

function toMatchResponse(row: MatchRow) {
  return {
    distanceMeters: row.distanceMeters,
    id: row.id,
    level: row.level,
    lostPet: {
      id: row.lostPetId,
      name: row.lostPetName,
    },
    matchedAt: row.matchedAt.toISOString(),
    reasons: Array.isArray(row.reasons) ? row.reasons : [],
    rejectionReason: row.rejectionReason,
    reviewStatus: row.reviewStatus,
    reviewedAt: row.reviewedAt?.toISOString() ?? null,
    score: row.score,
    sighting: {
      condition: row.sightingCondition,
      id: row.sightingId,
      publicLocation: {
        latitude: row.sightingLatitude,
        longitude: row.sightingLongitude,
        radiusMeters: row.sightingRadiusMeters,
      },
      seenAt: row.sightingSeenAt.toISOString(),
      species: row.species,
    },
  };
}
