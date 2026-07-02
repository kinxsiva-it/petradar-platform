import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';

import { PrismaService } from '@petradar/backend/shared';

import { AdminUsersQueryDto } from './dto/admin-users-query.dto.js';

const defaultPage = 1;
const defaultPageSize = 25;

@Injectable()
export class AdminUsersService {
  constructor(private readonly prisma: PrismaService) {}

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
