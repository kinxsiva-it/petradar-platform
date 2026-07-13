import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import {
  AnimalCondition,
  AnimalSpecies,
  NotificationType,
  Prisma,
  SightingLifecycleStatus,
  UrgencyLevel,
  VerificationStatus,
} from '@prisma/client';

import { AuditService } from '@petradar/backend/audit';
import { AuthorizationPolicyService, type AuthenticatedUser } from '@petradar/backend/auth';
import { NotificationsService } from '@petradar/backend/notifications';
import { PrismaService } from '@petradar/backend/shared';
import {
  canModerateSighting,
  SightingsRepository,
  toSightingPhotoResponse,
  type SightingPhotoResponse,
} from '@petradar/backend/sightings';

import { AdminSightingsQueryDto, AdminSightingsSort } from './dto/admin-sightings-query.dto.js';

interface RequestContext {
  requestId?: string | null;
}

interface AdminSightingRow {
  id: string;
  reporterId: string | null;
  reporterEmail: string | null;
  reporterDisplayName: string | null;
  reporterPhone: string | null;
  species: AnimalSpecies;
  animalCount: number;
  color: string | null;
  pattern: string | null;
  collarStatus: string;
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
}

interface CountRow {
  total: bigint | number;
}

interface ModerationUpdateRow {
  id: string;
  previousVerificationStatus: VerificationStatus;
  verificationStatus: VerificationStatus;
}

export interface AdminModerationHistoryItem {
  id: string;
  action: string;
  actorId: string | null;
  actorDisplayName: string | null;
  createdAt: string;
  previousVerificationStatus?: VerificationStatus;
  newVerificationStatus?: VerificationStatus;
  rejectionReason?: string;
}

export interface AdminModerationQueueItem {
  id: string;
  reference: string;
  species: AnimalSpecies;
  condition: AnimalCondition;
  urgency: UrgencyLevel;
  seenAt: string;
  createdAt: string;
  waitingSeconds: number;
  verificationStatus: VerificationStatus;
  lifecycleStatus: SightingLifecycleStatus;
  thumbnailPhoto: SightingPhotoResponse | null;
  reporter: {
    id: string | null;
    displayName: string;
  };
}

export interface AdminModerationQueueResponse {
  items: AdminModerationQueueItem[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface AdminModerationDetailResponse extends Omit<AdminModerationQueueItem, 'thumbnailPhoto' | 'waitingSeconds'> {
  animalCount: number;
  color: string | null;
  pattern: string | null;
  collarStatus: string;
  description: string | null;
  updatedAt: string;
  photos: SightingPhotoResponse[];
  publicLocation: {
    latitude: number;
    longitude: number;
    radiusMeters: number;
  };
  exactLocation: {
    latitude: number;
    longitude: number;
  };
  reporter: {
    id: string | null;
    email: string | null;
    displayName: string;
    phone: string | null;
  };
  moderationHistory: AdminModerationHistoryItem[];
  rejectionReason: string | null;
  canVerify: boolean;
  canReject: boolean;
}

const defaultPage = 1;
const defaultPageSize = 25;

@Injectable()
export class AdminSightingsService {
  constructor(
    private readonly audit: AuditService,
    private readonly authorization: AuthorizationPolicyService,
    private readonly notifications: NotificationsService,
    private readonly prisma: PrismaService,
    private readonly sightings: SightingsRepository,
  ) {}

  async listQueue(
    admin: AuthenticatedUser,
    query: AdminSightingsQueryDto,
    context: RequestContext = {},
  ): Promise<AdminModerationQueueResponse> {
    const page = Math.max(1, query.page ?? defaultPage);
    const pageSize = Math.min(Math.max(1, query.pageSize ?? defaultPageSize), 50);
    const offset = (page - 1) * pageSize;
    const where = whereForQuery(query);
    const order = orderForSort(query.sort);

    const [rows, countRows] = await Promise.all([
      this.prisma.$queryRaw<AdminSightingRow[]>(Prisma.sql`
        ${selectAdminSightingSql(false)}
        FROM "animal_sightings" s
        LEFT JOIN "users" u ON u."id" = s."reporter_id"
        WHERE ${Prisma.join(where, ' AND ')}
        ORDER BY ${order}
        LIMIT ${pageSize}
        OFFSET ${offset}
      `),
      this.prisma.$queryRaw<CountRow[]>(Prisma.sql`
        SELECT COUNT(*) AS "total"
        FROM "animal_sightings" s
        LEFT JOIN "users" u ON u."id" = s."reporter_id"
        WHERE ${Prisma.join(where, ' AND ')}
      `),
    ]);

    await this.audit.create({
      action: 'ADMIN_SIGHTING_QUEUE_VIEWED',
      actorId: admin.id,
      entityId: 'animal_sightings',
      entityType: 'AdminModerationQueue',
      metadata: {
        actorId: admin.id,
        filterKeys: Object.keys(query).filter((key) => query[key as keyof AdminSightingsQueryDto] !== undefined),
        page,
        pageSize,
      },
      requestId: context.requestId,
    });

    const photosBySighting = await this.firstPhotosFor(rows.map((row) => row.id));
    const totalValue = countRows[0]?.total ?? 0;
    const total = typeof totalValue === 'bigint' ? Number(totalValue) : totalValue;

    return {
      items: rows.map((row) => toQueueItem(row, photosBySighting.get(row.id) ?? null)),
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async detail(
    admin: AuthenticatedUser,
    id: string,
    context: RequestContext = {},
  ): Promise<AdminModerationDetailResponse> {
    const row = await this.loadAdminRow(id, true);
    if (!row) {
      throw new NotFoundException('Sighting not found.');
    }

    if (
      !this.authorization.canAccessExactLocation({
        allowOwner: false,
        user: admin,
      })
    ) {
      await this.audit.create({
        action: 'ADMIN_SIGHTING_EXACT_LOCATION_DENIED',
        actorId: admin.id,
        entityId: id,
        entityType: 'AnimalSighting',
        metadata: { actorId: admin.id, reason: 'policy_denied', sightingId: id },
        requestId: context.requestId,
      });
      throw new ForbiddenException('Exact location access denied.');
    }

    await this.audit.create({
      action: 'ADMIN_SIGHTING_DETAIL_VIEWED',
      actorId: admin.id,
      entityId: id,
      entityType: 'AnimalSighting',
      metadata: { actorId: admin.id, sightingId: id },
      requestId: context.requestId,
    });
    await this.audit.create({
      action: 'SIGHTING_EXACT_LOCATION_ACCESSED',
      actorId: admin.id,
      entityId: id,
      entityType: 'AnimalSighting',
      metadata: { actorId: admin.id, accessScope: 'admin_moderation', sightingId: id },
      requestId: context.requestId,
    });

    return this.toDetailResponse(row);
  }

  async verify(
    admin: AuthenticatedUser,
    id: string,
    context: RequestContext = {},
  ): Promise<AdminModerationDetailResponse> {
    await this.transition(admin, id, VerificationStatus.VERIFIED, null, context);
    return this.detail(admin, id, context);
  }

  async reject(
    admin: AuthenticatedUser,
    id: string,
    reason: string,
    context: RequestContext = {},
  ): Promise<AdminModerationDetailResponse> {
    await this.transition(admin, id, VerificationStatus.REJECTED, cleanReason(reason), context);
    return this.detail(admin, id, context);
  }

  async merge(
    admin: AuthenticatedUser,
    sourceId: string,
    targetId: string,
    context: RequestContext = {},
  ): Promise<{ success: true; sourceSightingId: string; targetSightingId: string }> {
    if (sourceId === targetId) {
      throw new ConflictException('Source and target sightings must be different.');
    }

    const [source, target] = await Promise.all([
      this.sightings.findById(sourceId, { includeExactLocation: false }),
      this.sightings.findById(targetId, { includeExactLocation: false }),
    ]);
    if (!source || !target) {
      throw new NotFoundException('Sighting not found.');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`
        UPDATE "animal_sightings"
        SET
          "verification_status" = CAST(${VerificationStatus.DUPLICATE} AS "VerificationStatus"),
          "duplicate_of_sighting_id" = CAST(${targetId} AS uuid),
          "updated_at" = CURRENT_TIMESTAMP
        WHERE "id" = CAST(${sourceId} AS uuid)
      `;

      await this.audit.createWithClient(tx, {
        action: 'SIGHTING_MERGED',
        actorId: admin.id,
        entityId: sourceId,
        entityType: 'AnimalSighting',
        metadata: {
          actorId: admin.id,
          sourceSightingId: sourceId,
          targetSightingId: targetId,
        },
        requestId: context.requestId,
      });
    });

    return {
      sourceSightingId: sourceId,
      success: true,
      targetSightingId: targetId,
    };
  }

  private async transition(
    admin: AuthenticatedUser,
    id: string,
    nextStatus: VerificationStatus,
    rejectionReason: string | null,
    context: RequestContext,
  ): Promise<void> {
    const current = await this.sightings.findById(id, { includeExactLocation: false });
    if (!current) {
      throw new NotFoundException('Sighting not found.');
    }

    const action = nextStatus === VerificationStatus.VERIFIED ? 'verify' : 'reject';
    const policy = canModerateSighting(current, action);
    if (!policy.allowed) {
      await this.audit.create({
        action: 'ADMIN_SIGHTING_MODERATION_DENIED',
        actorId: admin.id,
        entityId: id,
        entityType: 'AnimalSighting',
        metadata: {
          actorId: admin.id,
          attemptedAction: action,
          currentLifecycleStatus: current.lifecycleStatus,
          currentVerificationStatus: current.verificationStatus,
          reason: policy.reason,
          sightingId: id,
        },
        requestId: context.requestId,
      });
      throw new ConflictException(policy.reason ?? 'Sighting cannot be moderated.');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const rows = await tx.$queryRaw<ModerationUpdateRow[]>(Prisma.sql`
        UPDATE "animal_sightings"
        SET
          "verification_status" = CAST(${nextStatus} AS "VerificationStatus"),
          "updated_at" = CURRENT_TIMESTAMP
        WHERE
          "id" = CAST(${id} AS uuid)
          AND "verification_status" IN (
            CAST(${VerificationStatus.PENDING} AS "VerificationStatus"),
            CAST(${VerificationStatus.NEEDS_REVIEW} AS "VerificationStatus")
          )
          AND "lifecycle_status" = CAST(${SightingLifecycleStatus.SIGHTING} AS "SightingLifecycleStatus")
        RETURNING
          "id"::text AS "id",
          CAST(${current.verificationStatus} AS "VerificationStatus") AS "previousVerificationStatus",
          "verification_status" AS "verificationStatus"
      `);

      const row = rows[0];
      if (!row) {
        return null;
      }

      await this.audit.createWithClient(tx, {
        action:
          nextStatus === VerificationStatus.VERIFIED ? 'SIGHTING_VERIFIED' : 'SIGHTING_REJECTED',
        actorId: admin.id,
        entityId: id,
        entityType: 'AnimalSighting',
        metadata: {
          actorId: admin.id,
          newVerificationStatus: nextStatus,
          previousVerificationStatus: current.verificationStatus,
          ...(rejectionReason ? { rejectionReason } : {}),
          sightingId: id,
        },
        requestId: context.requestId,
      });

      return row;
    });

    if (!updated) {
      await this.audit.create({
        action: 'ADMIN_SIGHTING_MODERATION_CONFLICT',
        actorId: admin.id,
        entityId: id,
        entityType: 'AnimalSighting',
        metadata: {
          actorId: admin.id,
          attemptedAction: action,
          expectedVerificationStatuses: [VerificationStatus.PENDING, VerificationStatus.NEEDS_REVIEW],
          sightingId: id,
        },
        requestId: context.requestId,
      });
      throw new ConflictException('This sighting was already moderated.');
    }

    if (current.reporterId) {
      const verified = nextStatus === VerificationStatus.VERIFIED;
      await this.notifications.createNotificationIfNotExists({
        actionUrl: `/sightings/${id}`,
        message: verified
          ? 'Your animal sighting report has been verified.'
          : 'Your animal sighting report was reviewed and rejected.',
        resourceId: id,
        resourceType: 'animal_sighting',
        title: verified ? 'Report verified' : 'Report rejected',
        type: verified ? NotificationType.SIGHTING_VERIFIED : NotificationType.SIGHTING_REJECTED,
        userId: current.reporterId,
      });
    }
  }

  private async loadAdminRow(
    id: string,
    includeExactLocation: boolean,
  ): Promise<AdminSightingRow | null> {
    const rows = await this.prisma.$queryRaw<AdminSightingRow[]>(Prisma.sql`
      ${selectAdminSightingSql(includeExactLocation)}
      FROM "animal_sightings" s
      LEFT JOIN "users" u ON u."id" = s."reporter_id"
      WHERE s."id" = CAST(${id} AS uuid)
      LIMIT 1
    `);

    return rows[0] ?? null;
  }

  private async toDetailResponse(row: AdminSightingRow): Promise<AdminModerationDetailResponse> {
    if (row.exactLatitude === null || row.exactLongitude === null) {
      throw new ForbiddenException('Exact location access denied.');
    }

    const [photos, history] = await Promise.all([
      this.sightings.findPhotosForSighting(row.id),
      this.moderationHistory(row.id),
    ]);
    const rejectionReason = history.find((item) => item.rejectionReason)?.rejectionReason ?? null;
    const policy = canModerateSighting(row, 'verify');
    const queueItem = toQueueItem(row, null);

    return {
      ...queueItem,
      animalCount: row.animalCount,
      canReject: policy.allowed,
      canVerify: policy.allowed,
      collarStatus: row.collarStatus,
      color: row.color,
      description: row.description,
      exactLocation: {
        latitude: row.exactLatitude,
        longitude: row.exactLongitude,
      },
      moderationHistory: history,
      pattern: row.pattern,
      photos: photos.map(toSightingPhotoResponse),
      publicLocation: {
        latitude: row.publicLatitude,
        longitude: row.publicLongitude,
        radiusMeters: row.publicRadiusMeters,
      },
      rejectionReason,
      reporter: {
        displayName: row.reporterDisplayName ?? 'Deleted reporter',
        email: row.reporterEmail,
        id: row.reporterId,
        phone: row.reporterPhone,
      },
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private async firstPhotosFor(sightingIds: readonly string[]) {
    const photosBySighting = new Map<string, SightingPhotoResponse>();
    if (sightingIds.length === 0) {
      return photosBySighting;
    }

    const photos = await this.prisma.sightingPhoto.findMany({
      orderBy: [{ sightingId: 'asc' }, { sortOrder: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }],
      where: { sightingId: { in: [...sightingIds] } },
    });

    for (const photo of photos) {
      if (!photosBySighting.has(photo.sightingId)) {
        photosBySighting.set(photosBySightingKey(photo.sightingId), toSightingPhotoResponse(photo));
      }
    }

    return photosBySighting;
  }

  private async moderationHistory(id: string): Promise<AdminModerationHistoryItem[]> {
    const logs = await this.prisma.auditLog.findMany({
      include: { actor: { select: { displayName: true } } },
      orderBy: { createdAt: 'desc' },
      take: 25,
      where: {
        action: {
          in: [
            'ADMIN_SIGHTING_DETAIL_VIEWED',
            'SIGHTING_EXACT_LOCATION_ACCESSED',
            'SIGHTING_VERIFIED',
            'SIGHTING_REJECTED',
            'ADMIN_SIGHTING_MODERATION_DENIED',
            'ADMIN_SIGHTING_MODERATION_CONFLICT',
          ],
        },
        entityId: id,
        entityType: 'AnimalSighting',
      },
    });

    return logs.map((log) => {
      const metadata = log.metadata;
      const metadataRecord =
        metadata && typeof metadata === 'object' && !Array.isArray(metadata)
          ? (metadata as Record<string, Prisma.JsonValue>)
          : {};
      const previousVerificationStatus = enumValue(
        metadataRecord['previousVerificationStatus'],
        VerificationStatus,
      );
      const newVerificationStatus = enumValue(metadataRecord['newVerificationStatus'], VerificationStatus);
      const rejectionReason =
        typeof metadataRecord['rejectionReason'] === 'string'
          ? metadataRecord['rejectionReason'].trim()
          : undefined;

      return {
        action: log.action,
        actorDisplayName: log.actor?.displayName ?? null,
        actorId: log.actorId,
        createdAt: log.createdAt.toISOString(),
        id: log.id,
        ...(newVerificationStatus ? { newVerificationStatus } : {}),
        ...(previousVerificationStatus ? { previousVerificationStatus } : {}),
        ...(rejectionReason ? { rejectionReason } : {}),
      };
    });
  }
}

function whereForQuery(query: AdminSightingsQueryDto): Prisma.Sql[] {
  const where: Prisma.Sql[] = [];

  if (query.verificationStatus) {
    where.push(
      Prisma.sql`s."verification_status" = CAST(${query.verificationStatus} AS "VerificationStatus")`,
    );
  } else {
    where.push(Prisma.sql`s."verification_status" IN (
      CAST(${VerificationStatus.PENDING} AS "VerificationStatus"),
      CAST(${VerificationStatus.NEEDS_REVIEW} AS "VerificationStatus")
    )`);
  }

  if (query.lifecycleStatus) {
    where.push(
      Prisma.sql`s."lifecycle_status" = CAST(${query.lifecycleStatus} AS "SightingLifecycleStatus")`,
    );
  }

  if (query.species) {
    where.push(Prisma.sql`s."species" = CAST(${query.species} AS "AnimalSpecies")`);
  }

  if (query.condition) {
    where.push(Prisma.sql`s."condition" = CAST(${query.condition} AS "AnimalCondition")`);
  }

  if (query.urgency) {
    where.push(Prisma.sql`s."urgency" = CAST(${query.urgency} AS "UrgencyLevel")`);
  }

  if (query.query?.trim()) {
    const value = `%${query.query.trim()}%`;
    where.push(Prisma.sql`
      (
        s."id"::text ILIKE ${value}
        OR s."color" ILIKE ${value}
        OR s."pattern" ILIKE ${value}
        OR s."description" ILIKE ${value}
        OR u."displayName" ILIKE ${value}
        OR u."email" ILIKE ${value}
      )
    `);
  }

  if (query.hasPhotos !== undefined) {
    where.push(
      query.hasPhotos
        ? Prisma.sql`EXISTS (SELECT 1 FROM "sighting_photos" p WHERE p."sighting_id" = s."id")`
        : Prisma.sql`NOT EXISTS (SELECT 1 FROM "sighting_photos" p WHERE p."sighting_id" = s."id")`,
    );
  }

  if (query.seenFrom) where.push(Prisma.sql`s."seen_at" >= ${new Date(query.seenFrom)}`);
  if (query.seenTo) where.push(Prisma.sql`s."seen_at" <= ${new Date(query.seenTo)}`);
  if (query.createdFrom) where.push(Prisma.sql`s."created_at" >= ${new Date(query.createdFrom)}`);
  if (query.createdTo) where.push(Prisma.sql`s."created_at" <= ${new Date(query.createdTo)}`);

  return where.length > 0 ? where : [Prisma.sql`TRUE`];
}

function orderForSort(sort: AdminSightingsSort | undefined): Prisma.Sql {
  if (sort === AdminSightingsSort.NEWEST_WAITING_FIRST) {
    return Prisma.sql`s."created_at" DESC, s."id" DESC`;
  }
  if (sort === AdminSightingsSort.HIGHEST_URGENCY) {
    return Prisma.sql`
      CASE s."urgency"
        WHEN CAST(${UrgencyLevel.EMERGENCY} AS "UrgencyLevel") THEN 4
        WHEN CAST(${UrgencyLevel.HIGH} AS "UrgencyLevel") THEN 3
        WHEN CAST(${UrgencyLevel.MEDIUM} AS "UrgencyLevel") THEN 2
        ELSE 1
      END DESC,
      s."created_at" ASC,
      s."id" ASC
    `;
  }
  if (sort === AdminSightingsSort.MOST_RECENTLY_SEEN) {
    return Prisma.sql`s."seen_at" DESC, s."created_at" DESC, s."id" DESC`;
  }

  return Prisma.sql`s."created_at" ASC, s."id" ASC`;
}

function selectAdminSightingSql(includeExactLocation: boolean): Prisma.Sql {
  return Prisma.sql`
    SELECT
      s."id"::text AS "id",
      s."reporter_id"::text AS "reporterId",
      u."email" AS "reporterEmail",
      u."displayName" AS "reporterDisplayName",
      u."phone" AS "reporterPhone",
      s."species" AS "species",
      s."animal_count" AS "animalCount",
      s."color" AS "color",
      s."pattern" AS "pattern",
      s."collar_status" AS "collarStatus",
      s."condition" AS "condition",
      s."description" AS "description",
      s."seen_at" AS "seenAt",
      s."urgency" AS "urgency",
      s."lifecycle_status" AS "lifecycleStatus",
      s."verification_status" AS "verificationStatus",
      ST_Y(s."public_location"::geometry)::float8 AS "publicLatitude",
      ST_X(s."public_location"::geometry)::float8 AS "publicLongitude",
      s."public_radius_meters" AS "publicRadiusMeters",
      ${
        includeExactLocation
          ? Prisma.sql`ST_Y(s."exact_location"::geometry)::float8`
          : Prisma.sql`NULL::float8`
      } AS "exactLatitude",
      ${
        includeExactLocation
          ? Prisma.sql`ST_X(s."exact_location"::geometry)::float8`
          : Prisma.sql`NULL::float8`
      } AS "exactLongitude",
      s."created_at" AS "createdAt",
      s."updated_at" AS "updatedAt"
  `;
}

function toQueueItem(
  row: AdminSightingRow,
  thumbnailPhoto: SightingPhotoResponse | null,
): AdminModerationQueueItem {
  return {
    condition: row.condition,
    createdAt: row.createdAt.toISOString(),
    id: row.id,
    lifecycleStatus: row.lifecycleStatus,
    reference: referenceFor(row),
    reporter: {
      displayName: row.reporterDisplayName ?? 'Deleted reporter',
      id: row.reporterId,
    },
    seenAt: row.seenAt.toISOString(),
    species: row.species,
    thumbnailPhoto,
    urgency: row.urgency,
    verificationStatus: row.verificationStatus,
    waitingSeconds: Math.max(0, Math.floor((Date.now() - row.createdAt.getTime()) / 1000)),
  };
}

function referenceFor(row: Pick<AdminSightingRow, 'id' | 'species'>): string {
  return `${row.species.slice(0, 3)}-${row.id.slice(0, 8).toUpperCase()}`;
}

function cleanReason(reason: string): string {
  return reason.trim().replace(/\s+/g, ' ');
}

function enumValue<TEnum extends Record<string, string>>(
  value: Prisma.JsonValue | undefined,
  enumObject: TEnum,
): TEnum[keyof TEnum] | null {
  if (typeof value !== 'string') {
    return null;
  }

  return Object.values(enumObject).includes(value) ? (value as TEnum[keyof TEnum]) : null;
}

function photosBySightingKey(sightingId: string): string {
  return sightingId;
}
