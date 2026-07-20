import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { NotificationType, Prisma, UserRole, VolunteerVerificationState } from '@prisma/client';

import { AuditService } from '@petradar/backend/audit';
import type { AuthenticatedUser } from '@petradar/backend/auth';
import { NotificationsService } from '@petradar/backend/notifications';
import {
  cursorPaginationMeta,
  decodeCursor,
  encodeCursor,
  PrismaService,
} from '@petradar/backend/shared';

import {
  AssignVolunteerDto,
  CreateInternalNoteDto,
  CreateRescueCaseDto,
  ListRescueCasesQueryDto,
  RescueActivityQueryDto,
  RescueCaseStatusValue,
  UpdateRescueStatusDto,
} from './dto/rescue-cases.dto.js';

interface RescueCaseRow {
  id: string;
  caseNumber: string;
  sightingId: string;
  species: string;
  condition: string;
  publicLatitude: number;
  publicLongitude: number;
  publicRadiusMeters: number;
  severity: string;
  status: string;
  summary: string;
  assignedVolunteerId: string | null;
  assignedVolunteerName: string | null;
  createdById: string | null;
  closedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface TimelineRow {
  id: string;
  eventType: string;
  previousStatus: string | null;
  newStatus: string | null;
  actorId: string | null;
  actorDisplayName: string | null;
  note: string | null;
  createdAt: Date;
}

interface NoteRow {
  id: string;
  authorId: string | null;
  authorDisplayName: string | null;
  body: string;
  createdAt: Date;
}

@Injectable()
export class RescueCasesService {
  constructor(
    private readonly audit: AuditService,
    private readonly notifications: NotificationsService,
    private readonly prisma: PrismaService,
  ) {}

  async create(admin: AuthenticatedUser, dto: CreateRescueCaseDto) {
    this.assertAdmin(admin);
    if (dto.assignedVolunteerId) {
      await this.assertAssignableVolunteer(dto.assignedVolunteerId);
    }
    const status = dto.status ?? (dto.assignedVolunteerId ? 'ASSIGNED' : 'NEEDS_RESCUE');
    const row = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.$queryRaw<{ id: string }[]>`
        SELECT "id"::text AS "id"
        FROM "rescue_cases"
        WHERE "sighting_id" = CAST(${dto.sightingId} AS uuid)
          AND "status" NOT IN (
            CAST(${'RESOLVED'} AS "RescueCaseStatus"),
            CAST(${'CLOSED'} AS "RescueCaseStatus")
          )
        LIMIT 1
      `;
      if (existing.length > 0) {
        throw new ConflictException('An active rescue case already exists for this sighting.');
      }

      const sighting = await tx.$queryRaw<{ id: string }[]>`
        SELECT "id"::text AS "id"
        FROM "animal_sightings"
        WHERE "id" = CAST(${dto.sightingId} AS uuid)
        LIMIT 1
      `;
      if (sighting.length === 0) {
        throw new NotFoundException('Sighting not found.');
      }

      const rows = await tx.$queryRaw<RescueCaseRow[]>(Prisma.sql`
        INSERT INTO "rescue_cases" (
          "case_number",
          "sighting_id",
          "severity",
          "status",
          "summary",
          "assigned_volunteer_id",
          "created_by_id"
        )
        VALUES (
          ${caseNumberFor(dto.sightingId)},
          CAST(${dto.sightingId} AS uuid),
          CAST(${dto.severity} AS "RescueSeverity"),
          CAST(${status} AS "RescueCaseStatus"),
          ${dto.summary.trim()},
          ${dto.assignedVolunteerId ? Prisma.sql`CAST(${dto.assignedVolunteerId} AS uuid)` : Prisma.sql`NULL::uuid`},
          CAST(${admin.id} AS uuid)
        )
        RETURNING "id"::text AS "id",
          "case_number" AS "caseNumber",
          "sighting_id"::text AS "sightingId",
          NULL::text AS "species",
          NULL::text AS "condition",
          0::float8 AS "publicLatitude",
          0::float8 AS "publicLongitude",
          0 AS "publicRadiusMeters",
          "severity"::text AS "severity",
          "status"::text AS "status",
          "summary",
          "assigned_volunteer_id"::text AS "assignedVolunteerId",
          NULL::text AS "assignedVolunteerName",
          "created_by_id"::text AS "createdById",
          "closed_at" AS "closedAt",
          "created_at" AS "createdAt",
          "updated_at" AS "updatedAt"
      `);
      const created = rows[0];
      if (!created) {
        throw new Error('Rescue case could not be created.');
      }

      await tx.$executeRaw`
        UPDATE "animal_sightings"
        SET "lifecycle_status" = CAST(${'NEEDS_RESCUE'} AS "SightingLifecycleStatus"),
            "condition" = CAST(${'NEEDS_RESCUE'} AS "AnimalCondition"),
            "updated_at" = CURRENT_TIMESTAMP
        WHERE "id" = CAST(${dto.sightingId} AS uuid)
      `;
      await this.createTimelineWithClient(tx, created.id, 'CREATED', null, status, admin.id, 'Rescue case created.');
      if (dto.assignedVolunteerId) {
        await this.createTimelineWithClient(tx, created.id, 'VOLUNTEER_ASSIGNED', null, status, admin.id, 'Volunteer assigned.');
      }
      await this.audit.createWithClient(tx, {
        action: 'RESCUE_CASE_CREATED',
        actorId: admin.id,
        entityId: created.id,
        entityType: 'RescueCase',
        metadata: { actorId: admin.id, rescueCaseId: created.id, sightingId: dto.sightingId },
      });
      return created;
    });

    if (dto.assignedVolunteerId) {
      await this.notifyAssignment(row.id, dto.assignedVolunteerId);
    }

    return this.detail(admin, row.id);
  }

  async list(user: AuthenticatedUser, query: ListRescueCasesQueryDto) {
    this.assertRescueReader(user);
    const page = Math.max(query.page ?? 1, 1);
    const pageSize = Math.min(Math.max(query.pageSize ?? 25, 1), 50);
    const where = whereForList(query);
    if (!user.roles.includes(UserRole.ADMIN)) {
      where.push(Prisma.sql`rc."assigned_volunteer_id" = CAST(${user.id} AS uuid)`);
    }
    const rows = await this.prisma.$queryRaw<RescueCaseRow[]>(Prisma.sql`
      ${rescueSelectSql()}
      WHERE ${Prisma.join(where, ' AND ')}
      ORDER BY rc."created_at" DESC, rc."id" DESC
      LIMIT ${pageSize}
      OFFSET ${(page - 1) * pageSize}
    `);
    const countRows = await this.prisma.$queryRaw<{ total: bigint | number }[]>(Prisma.sql`
      SELECT COUNT(*) AS "total"
      FROM "rescue_cases" rc
      JOIN "animal_sightings" s ON s."id" = rc."sighting_id"
      WHERE ${Prisma.join(where, ' AND ')}
    `);
    const totalValue = countRows[0]?.total ?? 0;
    const total = typeof totalValue === 'bigint' ? Number(totalValue) : totalValue;
    return { items: rows.map(toRescueCaseResponse), page, pageSize, total, totalPages: Math.ceil(total / pageSize) };
  }

  async detail(user: AuthenticatedUser, id: string) {
    const row = await this.loadCase(id);
    this.assertCaseAccess(user, row);
    const [timeline, notes] = await Promise.all([this.timelineItems(id), this.notesForCase(id)]);
    return { ...toRescueCaseResponse(row), internalNotes: notes, timeline };
  }

  async updateStatus(user: AuthenticatedUser, id: string, dto: UpdateRescueStatusDto) {
    const current = await this.loadCase(id);
    this.assertCaseAccess(user, current);
    if (!canTransition(current.status, dto.status)) {
      throw new ConflictException(`Cannot move rescue case from ${current.status} to ${dto.status}.`);
    }
    await this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`
        UPDATE "rescue_cases"
        SET
          "status" = CAST(${dto.status} AS "RescueCaseStatus"),
          "closed_at" = CASE
            WHEN ${dto.status} IN ('RESOLVED', 'CLOSED') THEN CURRENT_TIMESTAMP
            ELSE "closed_at"
          END,
          "updated_at" = CURRENT_TIMESTAMP
        WHERE "id" = CAST(${id} AS uuid)
      `;
      await this.createTimelineWithClient(tx, id, 'STATUS_CHANGED', current.status, dto.status, user.id, dto.note ?? null);
      await this.audit.createWithClient(tx, {
        action: 'RESCUE_CASE_STATUS_CHANGED',
        actorId: user.id,
        entityId: id,
        entityType: 'RescueCase',
        metadata: { actorId: user.id, newStatus: dto.status, previousStatus: current.status, rescueCaseId: id },
      });
    });
    if (current.assignedVolunteerId) {
      await this.notifications.createNotificationIfNotExists({
        actionUrl: `/volunteer/rescue-cases/${id}`,
        message: 'A rescue case assigned to you has been updated.',
        resourceId: id,
        resourceType: 'rescue_case',
        title: 'Rescue case updated',
        type: NotificationType.RESCUE_STATUS_UPDATED,
        userId: current.assignedVolunteerId,
      });
    }
    return this.detail(user, id);
  }

  async assignVolunteer(admin: AuthenticatedUser, id: string, dto: AssignVolunteerDto) {
    this.assertAdmin(admin);
    const current = await this.loadCase(id);
    if (isRescueCaseStatusValue(current.status) && isTerminal(current.status)) {
      throw new ConflictException('Closed rescue cases cannot be assigned.');
    }
    await this.assertAssignableVolunteer(dto.volunteerId);
    await this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`
        UPDATE "rescue_cases"
        SET
          "assigned_volunteer_id" = CAST(${dto.volunteerId} AS uuid),
          "status" = CAST(${'ASSIGNED'} AS "RescueCaseStatus"),
          "updated_at" = CURRENT_TIMESTAMP
        WHERE "id" = CAST(${id} AS uuid)
      `;
      await this.createTimelineWithClient(tx, id, 'VOLUNTEER_ASSIGNED', current.status, 'ASSIGNED', admin.id, 'Volunteer assigned.');
      await this.audit.createWithClient(tx, {
        action: 'RESCUE_CASE_VOLUNTEER_ASSIGNED',
        actorId: admin.id,
        entityId: id,
        entityType: 'RescueCase',
        metadata: { actorId: admin.id, rescueCaseId: id, volunteerId: dto.volunteerId },
      });
    });
    await this.notifyAssignment(id, dto.volunteerId);
    return this.detail(admin, id);
  }

  private async notifyAssignment(id: string, volunteerId: string): Promise<void> {
    await this.notifications.createNotificationIfNotExists({
      actionUrl: `/volunteer/rescue-cases/${id}`,
      message: 'You have been assigned to a rescue case.',
      resourceId: id,
      resourceType: 'rescue_case',
      title: 'New rescue assignment',
      type: NotificationType.RESCUE_ASSIGNED,
      userId: volunteerId,
    });
  }

  async addNote(user: AuthenticatedUser, id: string, dto: CreateInternalNoteDto) {
    const current = await this.loadCase(id);
    this.assertCaseAccess(user, current);
    await this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`
        INSERT INTO "rescue_internal_notes" ("rescue_case_id", "author_id", "body")
        VALUES (CAST(${id} AS uuid), CAST(${user.id} AS uuid), ${dto.body.trim()})
      `;
      await this.createTimelineWithClient(tx, id, 'NOTE_ADDED', current.status, current.status, user.id, 'Internal note added.');
    });
    return this.detail(user, id);
  }

  async timeline(user: AuthenticatedUser, id: string, query: RescueActivityQueryDto = {}) {
    const current = await this.loadCase(id);
    this.assertCaseAccess(user, current);
    const limit = query.limit ?? 20;
    const cursor = query.cursor ? decodeCursor(query.cursor) : null;
    const rows = await this.prisma.$queryRaw<TimelineRow[]>(Prisma.sql`
      SELECT
        e."id"::text AS "id",
        e."event_type"::text AS "eventType",
        e."previous_status"::text AS "previousStatus",
        e."new_status"::text AS "newStatus",
        e."actor_id"::text AS "actorId",
        u."displayName" AS "actorDisplayName",
        e."note",
        e."created_at" AS "createdAt"
      FROM "rescue_case_timeline_events" e
      LEFT JOIN "users" u ON u."id" = e."actor_id"
      WHERE e."rescue_case_id" = CAST(${id} AS uuid)
        ${cursor ? Prisma.sql`AND (e."created_at", e."id") > (${cursor.createdAt}, CAST(${cursor.id} AS uuid))` : Prisma.empty}
      ORDER BY e."created_at" ASC, e."id" ASC
      LIMIT ${limit + 1}
    `);
    const hasNextPage = rows.length > limit;
    const pageRows = hasNextPage ? rows.slice(0, limit) : rows;
    const last = pageRows.at(-1);
    return {
      items: pageRows.map(toTimelineResponse),
      pagination: cursorPaginationMeta(
        limit,
        hasNextPage && last ? encodeCursor({ createdAt: last.createdAt, id: last.id }) : null,
      ),
    };
  }

  async notes(user: AuthenticatedUser, id: string, query: RescueActivityQueryDto = {}) {
    const current = await this.loadCase(id);
    this.assertCaseAccess(user, current);
    const limit = query.limit ?? 20;
    const cursor = query.cursor ? decodeCursor(query.cursor) : null;
    const rows = await this.prisma.$queryRaw<NoteRow[]>(Prisma.sql`
      SELECT
        n."id"::text AS "id",
        n."author_id"::text AS "authorId",
        u."displayName" AS "authorDisplayName",
        n."body",
        n."created_at" AS "createdAt"
      FROM "rescue_internal_notes" n
      LEFT JOIN "users" u ON u."id" = n."author_id"
      WHERE n."rescue_case_id" = CAST(${id} AS uuid)
        ${cursor ? Prisma.sql`AND (n."created_at", n."id") > (${cursor.createdAt}, CAST(${cursor.id} AS uuid))` : Prisma.empty}
      ORDER BY n."created_at" ASC, n."id" ASC
      LIMIT ${limit + 1}
    `);
    const hasNextPage = rows.length > limit;
    const pageRows = hasNextPage ? rows.slice(0, limit) : rows;
    const last = pageRows.at(-1);
    return {
      items: pageRows.map(toNoteResponse),
      pagination: cursorPaginationMeta(
        limit,
        hasNextPage && last ? encodeCursor({ createdAt: last.createdAt, id: last.id }) : null,
      ),
    };
  }

  private async timelineItems(id: string) {
    const rows = await this.prisma.$queryRaw<TimelineRow[]>`
      SELECT
        e."id"::text AS "id",
        e."event_type"::text AS "eventType",
        e."previous_status"::text AS "previousStatus",
        e."new_status"::text AS "newStatus",
        e."actor_id"::text AS "actorId",
        u."displayName" AS "actorDisplayName",
        e."note",
        e."created_at" AS "createdAt"
      FROM "rescue_case_timeline_events" e
      LEFT JOIN "users" u ON u."id" = e."actor_id"
      WHERE e."rescue_case_id" = CAST(${id} AS uuid)
      ORDER BY e."created_at" ASC, e."id" ASC
    `;
    return rows.map(toTimelineResponse);
  }

  private async loadCase(id: string): Promise<RescueCaseRow> {
    const rows = await this.prisma.$queryRaw<RescueCaseRow[]>(Prisma.sql`
      ${rescueSelectSql()}
      WHERE rc."id" = CAST(${id} AS uuid)
      LIMIT 1
    `);
    const row = rows[0];
    if (!row) {
      throw new NotFoundException('Rescue case not found.');
    }
    return row;
  }

  private async notesForCase(id: string) {
    const rows = await this.prisma.$queryRaw<NoteRow[]>`
      SELECT
        n."id"::text AS "id",
        n."author_id"::text AS "authorId",
        u."displayName" AS "authorDisplayName",
        n."body",
        n."created_at" AS "createdAt"
      FROM "rescue_internal_notes" n
      LEFT JOIN "users" u ON u."id" = n."author_id"
      WHERE n."rescue_case_id" = CAST(${id} AS uuid)
      ORDER BY n."created_at" ASC, n."id" ASC
    `;
    return rows.map(toNoteResponse);
  }

  private async assertAssignableVolunteer(userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || (!user.roles.includes(UserRole.VOLUNTEER) && !user.roles.includes(UserRole.ADMIN))) {
      throw new NotFoundException('Volunteer not found.');
    }
    if (
      user.roles.includes(UserRole.VOLUNTEER) &&
      user.volunteerVerification !== VolunteerVerificationState.VERIFIED
    ) {
      throw new ForbiddenException('Volunteer is not verified.');
    }
  }

  private async createTimelineWithClient(
    client: Prisma.TransactionClient,
    rescueCaseId: string,
    eventType: string,
    previousStatus: string | null,
    newStatus: string | null,
    actorId: string,
    note: string | null,
  ): Promise<void> {
    await client.$executeRaw`
      INSERT INTO "rescue_case_timeline_events" (
        "rescue_case_id",
        "event_type",
        "previous_status",
        "new_status",
        "actor_id",
        "note"
      )
      VALUES (
        CAST(${rescueCaseId} AS uuid),
        CAST(${eventType} AS "RescueTimelineEventType"),
        ${previousStatus ? Prisma.sql`CAST(${previousStatus} AS "RescueCaseStatus")` : Prisma.sql`NULL::"RescueCaseStatus"`},
        ${newStatus ? Prisma.sql`CAST(${newStatus} AS "RescueCaseStatus")` : Prisma.sql`NULL::"RescueCaseStatus"`},
        CAST(${actorId} AS uuid),
        ${note}
      )
    `;
  }

  private assertAdmin(user: AuthenticatedUser): void {
    if (!user.roles.includes(UserRole.ADMIN)) {
      throw new ForbiddenException('Admin access required.');
    }
  }

  private assertRescueReader(user: AuthenticatedUser): void {
    if (!user.roles.includes(UserRole.ADMIN) && !user.roles.includes(UserRole.VOLUNTEER)) {
      throw new ForbiddenException('Rescue access denied.');
    }
  }

  private assertCaseAccess(user: AuthenticatedUser, row: RescueCaseRow): void {
    if (user.roles.includes(UserRole.ADMIN)) {
      return;
    }
    if (user.roles.includes(UserRole.VOLUNTEER) && row.assignedVolunteerId === user.id) {
      return;
    }
    throw new ForbiddenException('Rescue case access denied.');
  }
}

function toTimelineResponse(row: TimelineRow) {
  return {
    actor: row.actorId ? { displayName: row.actorDisplayName, id: row.actorId } : null,
    createdAt: row.createdAt.toISOString(),
    eventType: row.eventType,
    id: row.id,
    newStatus: row.newStatus,
    note: row.note,
    previousStatus: row.previousStatus,
  };
}

function toNoteResponse(row: NoteRow) {
  return {
    author: row.authorId ? { displayName: row.authorDisplayName, id: row.authorId } : null,
    body: row.body,
    createdAt: row.createdAt.toISOString(),
    id: row.id,
  };
}

function rescueSelectSql(): Prisma.Sql {
  return Prisma.sql`
    SELECT
      rc."id"::text AS "id",
      rc."case_number" AS "caseNumber",
      rc."sighting_id"::text AS "sightingId",
      s."species"::text AS "species",
      s."condition"::text AS "condition",
      ST_Y(s."public_location"::geometry)::float8 AS "publicLatitude",
      ST_X(s."public_location"::geometry)::float8 AS "publicLongitude",
      s."public_radius_meters" AS "publicRadiusMeters",
      rc."severity"::text AS "severity",
      rc."status"::text AS "status",
      rc."summary",
      rc."assigned_volunteer_id"::text AS "assignedVolunteerId",
      assigned."displayName" AS "assignedVolunteerName",
      rc."created_by_id"::text AS "createdById",
      rc."closed_at" AS "closedAt",
      rc."created_at" AS "createdAt",
      rc."updated_at" AS "updatedAt"
    FROM "rescue_cases" rc
    JOIN "animal_sightings" s ON s."id" = rc."sighting_id"
    LEFT JOIN "users" assigned ON assigned."id" = rc."assigned_volunteer_id"
  `;
}

function whereForList(query: ListRescueCasesQueryDto): Prisma.Sql[] {
  const where: Prisma.Sql[] = [Prisma.sql`TRUE`];
  if (query.status) where.push(Prisma.sql`rc."status" = CAST(${query.status} AS "RescueCaseStatus")`);
  if (query.severity) where.push(Prisma.sql`rc."severity" = CAST(${query.severity} AS "RescueSeverity")`);
  if (query.assignedVolunteerId) where.push(Prisma.sql`rc."assigned_volunteer_id" = CAST(${query.assignedVolunteerId} AS uuid)`);
  if (query.species) where.push(Prisma.sql`s."species" = CAST(${query.species} AS "AnimalSpecies")`);
  if (query.createdFrom) where.push(Prisma.sql`rc."created_at" >= ${new Date(query.createdFrom)}`);
  if (query.createdTo) where.push(Prisma.sql`rc."created_at" <= ${new Date(query.createdTo)}`);
  return where;
}

function toRescueCaseResponse(row: RescueCaseRow) {
  return {
    assignedVolunteer: row.assignedVolunteerId
      ? { displayName: row.assignedVolunteerName, id: row.assignedVolunteerId }
      : null,
    caseNumber: row.caseNumber,
    closedAt: row.closedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    createdById: row.createdById,
    id: row.id,
    severity: row.severity,
    sighting: {
      condition: row.condition,
      id: row.sightingId,
      publicLocation: {
        latitude: row.publicLatitude,
        longitude: row.publicLongitude,
        radiusMeters: row.publicRadiusMeters,
      },
      species: row.species,
    },
    status: row.status,
    summary: row.summary,
    updatedAt: row.updatedAt.toISOString(),
  };
}

function caseNumberFor(sightingId: string): string {
  return `RES-${sightingId.slice(0, 8).toUpperCase()}`;
}

const rescueCaseStatuses = new Set<string>(Object.values(RescueCaseStatusValue));

function canTransition(current: string, next: RescueCaseStatusValue): boolean {
  if (!isRescueCaseStatusValue(current)) {
    return false;
  }
  if (current === next) return true;
  if (isTerminal(current)) return false;
  const allowed: Partial<Record<RescueCaseStatusValue, RescueCaseStatusValue[]>> = {
    [RescueCaseStatusValue.ASSIGNED]: [
      RescueCaseStatusValue.IN_PROGRESS,
      RescueCaseStatusValue.RESOLVED,
      RescueCaseStatusValue.CLOSED,
    ],
    [RescueCaseStatusValue.IN_PROGRESS]: [RescueCaseStatusValue.RESOLVED, RescueCaseStatusValue.CLOSED],
    [RescueCaseStatusValue.NEEDS_RESCUE]: [
      RescueCaseStatusValue.ASSIGNED,
      RescueCaseStatusValue.IN_PROGRESS,
      RescueCaseStatusValue.RESOLVED,
      RescueCaseStatusValue.CLOSED,
    ],
    [RescueCaseStatusValue.NEEDS_VERIFICATION]: [
      RescueCaseStatusValue.NEEDS_RESCUE,
      RescueCaseStatusValue.CLOSED,
    ],
    [RescueCaseStatusValue.NEW_REPORT]: [
      RescueCaseStatusValue.NEEDS_VERIFICATION,
      RescueCaseStatusValue.NEEDS_RESCUE,
      RescueCaseStatusValue.ASSIGNED,
      RescueCaseStatusValue.CLOSED,
    ],
    [RescueCaseStatusValue.RESOLVED]: [RescueCaseStatusValue.CLOSED],
  };
  return allowed[current]?.includes(next) ?? false;
}

function isRescueCaseStatusValue(status: string): status is RescueCaseStatusValue {
  return rescueCaseStatuses.has(status);
}

function isTerminal(status: RescueCaseStatusValue): boolean {
  return status === RescueCaseStatusValue.CLOSED || status === RescueCaseStatusValue.RESOLVED;
}
