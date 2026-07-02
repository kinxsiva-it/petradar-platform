import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '@petradar/backend/shared';

import { AdminAuditLogsQueryDto } from './dto/admin-audit-logs-query.dto.js';

const defaultPage = 1;
const defaultPageSize = 25;

@Injectable()
export class AdminAuditLogsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: AdminAuditLogsQueryDto) {
    const page = Math.max(1, query.page ?? defaultPage);
    const pageSize = Math.min(Math.max(1, query.pageSize ?? defaultPageSize), 50);
    const where = whereForAuditLogs(query);
    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        include: { actor: { select: { displayName: true, email: true, id: true } } },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        where,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      items: logs.map((log) => ({
        action: log.action,
        actor: log.actor
          ? { displayName: log.actor.displayName, email: log.actor.email, id: log.actor.id }
          : null,
        createdAt: log.createdAt.toISOString(),
        entityId: log.entityId,
        entityType: log.entityType,
        id: log.id,
        requestId: log.requestId,
        summary: `${log.action} on ${log.entityType}`,
      })),
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    };
  }
}

function whereForAuditLogs(query: AdminAuditLogsQueryDto): Prisma.AuditLogWhereInput {
  const where: Prisma.AuditLogWhereInput = {};
  if (query.action?.trim()) {
    where.action = { contains: query.action.trim(), mode: 'insensitive' };
  }
  if (query.entityType?.trim()) {
    where.entityType = { contains: query.entityType.trim(), mode: 'insensitive' };
  }
  if (query.entityId?.trim()) {
    where.entityId = query.entityId.trim();
  }
  if (query.actorQuery?.trim()) {
    const search = query.actorQuery.trim();
    where.actor = {
      is: {
        OR: [
          { displayName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      },
    };
  }
  if (query.createdFrom || query.createdTo) {
    where.createdAt = {
      ...(query.createdFrom ? { gte: new Date(query.createdFrom) } : {}),
      ...(query.createdTo ? { lte: new Date(query.createdTo) } : {}),
    };
  }
  return where;
}
