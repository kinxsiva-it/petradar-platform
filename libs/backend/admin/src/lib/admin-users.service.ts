import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AccountStatus, Prisma, UserRole, VolunteerVerificationState } from '@prisma/client';

import { AuditService } from '@petradar/backend/audit';
import type { AuthenticatedUser } from '@petradar/backend/auth';
import { PrismaService } from '@petradar/backend/shared';

import { AdminUsersQueryDto } from './dto/admin-users-query.dto.js';

const defaultPage = 1;
const defaultPageSize = 25;

interface RequestContext {
  requestId?: string | null;
}

@Injectable()
export class AdminUsersService {
  constructor(
    private readonly audit: AuditService,
    private readonly prisma: PrismaService,
  ) {}

  async list(query: AdminUsersQueryDto) {
    const page = Math.max(1, query.page ?? defaultPage);
    const pageSize = Math.min(Math.max(1, query.pageSize ?? defaultPageSize), 50);
    const where = whereForUsers(query);
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        select: userSelect,
        skip: (page - 1) * pageSize,
        take: pageSize,
        where,
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      items: users.map(toAdminUser),
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async detail(id: string) {
    const user = await this.prisma.user.findUnique({
      select: userSelect,
      where: { id },
    });
    if (!user) {
      throw new NotFoundException('User not found.');
    }
    return toAdminUser(user);
  }

  async updateRoles(
    admin: AuthenticatedUser,
    id: string,
    roles: UserRole[],
    context: RequestContext = {},
  ) {
    const nextRoles = normalizeRoles(roles);
    if (nextRoles.length === 0) {
      throw new BadRequestException('At least one role is required.');
    }

    return this.prisma.$transaction(async (tx) => {
      const current = await tx.user.findUnique({ select: userSelect, where: { id } });
      if (!current) {
        throw new NotFoundException('User not found.');
      }

      if (current.id === admin.id && !nextRoles.includes(UserRole.ADMIN)) {
        throw new ForbiddenException('Admins cannot remove their own admin role.');
      }

      if (removesActiveAdmin(current, nextRoles)) {
        await assertAnotherActiveAdmin(tx, current.id);
      }

      const nextVolunteerVerification = volunteerVerificationForRoles(
        nextRoles,
        current.volunteerVerification,
      );
      const changed =
        !sameRoles(current.roles, nextRoles) ||
        current.volunteerVerification !== nextVolunteerVerification;
      const updated = changed
        ? await tx.user.update({
            data: {
              roles: { set: nextRoles },
              volunteerVerification: nextVolunteerVerification,
            },
            select: userSelect,
            where: { id },
          })
        : current;

      if (changed) {
        await this.audit.createWithClient(tx, {
          action: 'ADMIN_USER_ROLES_UPDATED',
          actorId: admin.id,
          entityId: id,
          entityType: 'User',
          metadata: {
            actorId: admin.id,
            newRoles: nextRoles,
            newVolunteerVerification: nextVolunteerVerification,
            previousRoles: current.roles,
            previousVolunteerVerification: current.volunteerVerification,
            userId: id,
          },
          requestId: context.requestId,
        });
      }

      return toAdminUser(updated);
    });
  }

  async updateStatus(
    admin: AuthenticatedUser,
    id: string,
    status: AccountStatus,
    context: RequestContext = {},
  ) {
    return this.prisma.$transaction(async (tx) => {
      const current = await tx.user.findUnique({ select: userSelect, where: { id } });
      if (!current) {
        throw new NotFoundException('User not found.');
      }

      if (current.id === admin.id && status !== AccountStatus.ACTIVE) {
        throw new ForbiddenException('Admins cannot suspend or deactivate their own account.');
      }

      if (suspendsActiveAdmin(current, status)) {
        await assertAnotherActiveAdmin(tx, current.id);
      }

      const changed = current.status !== status;
      const updated = changed
        ? await tx.user.update({
            data: { status },
            select: userSelect,
            where: { id },
          })
        : current;

      if (changed) {
        await this.audit.createWithClient(tx, {
          action: 'ADMIN_USER_STATUS_UPDATED',
          actorId: admin.id,
          entityId: id,
          entityType: 'User',
          metadata: {
            actorId: admin.id,
            newStatus: status,
            previousStatus: current.status,
            userId: id,
          },
          requestId: context.requestId,
        });
      }

      return toAdminUser(updated);
    });
  }

  async updateVolunteerVerification(
    admin: AuthenticatedUser,
    id: string,
    volunteerVerification: VolunteerVerificationState,
    context: RequestContext = {},
  ) {
    return this.prisma.$transaction(async (tx) => {
      const current = await tx.user.findUnique({ select: userSelect, where: { id } });
      if (!current) {
        throw new NotFoundException('User not found.');
      }

      assertVolunteerVerificationAllowed(current, volunteerVerification);

      const changed = current.volunteerVerification !== volunteerVerification;
      const updated = changed
        ? await tx.user.update({
            data: { volunteerVerification },
            select: userSelect,
            where: { id },
          })
        : current;

      if (changed) {
        await this.audit.createWithClient(tx, {
          action: 'ADMIN_USER_VOLUNTEER_VERIFICATION_UPDATED',
          actorId: admin.id,
          entityId: id,
          entityType: 'User',
          metadata: {
            actorId: admin.id,
            newVolunteerVerification: volunteerVerification,
            previousVolunteerVerification: current.volunteerVerification,
            userId: id,
          },
          requestId: context.requestId,
        });
      }

      return toAdminUser(updated);
    });
  }
}

const userSelect = {
  _count: {
    select: {
      assignedRescueCases: true,
      lostPets: true,
      sightings: true,
    },
  },
  createdAt: true,
  displayName: true,
  email: true,
  id: true,
  roles: true,
  status: true,
  updatedAt: true,
  volunteerVerification: true,
} satisfies Prisma.UserSelect;

type SelectedUser = Prisma.UserGetPayload<{ select: typeof userSelect }>;

function whereForUsers(query: AdminUsersQueryDto): Prisma.UserWhereInput {
  const where: Prisma.UserWhereInput = {};
  if (query.role) {
    where.roles = { has: query.role };
  }
  if (query.status) {
    where.status = query.status;
  }
  if (query.volunteerVerification) {
    where.volunteerVerification = query.volunteerVerification;
  }
  const search = query.query?.trim();
  if (search) {
    const terms: Prisma.UserWhereInput[] = [
      { displayName: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
    if (isUuid(search)) {
      terms.push({ id: search });
    }
    where.OR = terms;
  }
  return where;
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function toAdminUser(user: SelectedUser) {
  return {
    accountStatus: user.status,
    assignedRescueCaseCount: user._count.assignedRescueCases,
    avatarUrl: null,
    createdAt: user.createdAt.toISOString(),
    displayName: user.displayName,
    email: user.email,
    id: user.id,
    lostPetCount: user._count.lostPets,
    reportCount: user._count.sightings,
    rescueParticipationCount: user.roles.includes(UserRole.VOLUNTEER)
      ? user._count.assignedRescueCases
      : 0,
    roles: user.roles,
    updatedAt: user.updatedAt.toISOString(),
    volunteerVerification: user.volunteerVerification,
  };
}

function normalizeRoles(roles: readonly UserRole[]): UserRole[] {
  return Array.from(new Set(roles));
}

function sameRoles(left: readonly UserRole[], right: readonly UserRole[]): boolean {
  if (left.length !== right.length) {
    return false;
  }
  return left.every((role) => right.includes(role));
}

function volunteerVerificationForRoles(
  roles: readonly UserRole[],
  current: VolunteerVerificationState,
): VolunteerVerificationState {
  if (!roles.includes(UserRole.VOLUNTEER)) {
    return VolunteerVerificationState.NOT_APPLICABLE;
  }
  return current === VolunteerVerificationState.NOT_APPLICABLE
    ? VolunteerVerificationState.PENDING
    : current;
}

function removesActiveAdmin(
  current: Pick<SelectedUser, 'id' | 'roles' | 'status'>,
  nextRoles: readonly UserRole[],
): boolean {
  return (
    current.status === AccountStatus.ACTIVE &&
    current.roles.includes(UserRole.ADMIN) &&
    !nextRoles.includes(UserRole.ADMIN)
  );
}

function suspendsActiveAdmin(
  current: Pick<SelectedUser, 'id' | 'roles' | 'status'>,
  nextStatus: AccountStatus,
): boolean {
  return (
    current.status === AccountStatus.ACTIVE &&
    nextStatus !== AccountStatus.ACTIVE &&
    current.roles.includes(UserRole.ADMIN)
  );
}

async function assertAnotherActiveAdmin(
  tx: Prisma.TransactionClient,
  userId: string,
): Promise<void> {
  const otherActiveAdmins = await tx.user.count({
    where: {
      id: { not: userId },
      roles: { has: UserRole.ADMIN },
      status: AccountStatus.ACTIVE,
    },
  });
  if (otherActiveAdmins === 0) {
    throw new ConflictException('At least one active admin account is required.');
  }
}

function assertVolunteerVerificationAllowed(
  current: Pick<SelectedUser, 'roles'>,
  next: VolunteerVerificationState,
): void {
  const isVolunteer = current.roles.includes(UserRole.VOLUNTEER);
  if (!isVolunteer && next !== VolunteerVerificationState.NOT_APPLICABLE) {
    throw new ConflictException('Only volunteer accounts can be verified or rejected.');
  }
  if (isVolunteer && next === VolunteerVerificationState.NOT_APPLICABLE) {
    throw new ConflictException('Volunteer accounts require a volunteer verification state.');
  }
}
