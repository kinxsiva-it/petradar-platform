import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { NotificationType, Prisma } from '@prisma/client';

import {
  cursorPaginationMeta,
  decodeCursor,
  encodeCursor,
  PrismaService,
} from '@petradar/backend/shared';

import type { NotificationsQueryDto } from './dto/notifications-query.dto.js';

export interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  actionUrl?: string | null;
  resourceType: string;
  resourceId: string;
  metadata?: Prisma.InputJsonValue;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createNotificationIfNotExists(input: CreateNotificationInput): Promise<void> {
    try {
      await this.prisma.notification.upsert({
        create: input,
        update: {
          actionUrl: input.actionUrl,
          createdAt: new Date(),
          message: input.message,
          metadata: input.metadata,
          readAt: null,
          title: input.title,
        },
        where: {
          userId_type_resourceType_resourceId: {
            resourceId: input.resourceId,
            resourceType: input.resourceType,
            type: input.type,
            userId: input.userId,
          },
        },
      });
    } catch {
      this.logger.error(`Notification creation failed for ${input.type}/${input.resourceType}.`);
    }
  }

  async listForUser(userId: string, query: NotificationsQueryDto) {
    const limit = query.limit ?? 20;
    const cursor = query.cursor ? decodeCursor(query.cursor) : null;
    const items = await this.prisma.notification.findMany({
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      select: notificationSelect,
      take: limit + 1,
      where: {
        userId,
        ...(query.status === 'unread' ? { readAt: null } : {}),
        ...(cursor
          ? {
              OR: [
                { createdAt: { lt: cursor.createdAt } },
                { createdAt: cursor.createdAt, id: { lt: cursor.id } },
              ],
            }
          : {}),
      },
    });
    const hasNextPage = items.length > limit;
    const pageItems = hasNextPage ? items.slice(0, limit) : items;
    const last = pageItems.at(-1);
    const nextCursor =
      hasNextPage && last ? encodeCursor({ createdAt: last.createdAt, id: last.id }) : null;
    return {
      items: pageItems.map(toResponse),
      pagination: cursorPaginationMeta(limit, nextCursor),
    };
  }

  async getUnreadCount(userId: string) {
    return { unreadCount: await this.prisma.notification.count({ where: { readAt: null, userId } }) };
  }

  async markAsRead(userId: string, id: string) {
    const result = await this.prisma.notification.updateMany({
      data: { readAt: new Date() },
      where: { id, userId },
    });
    if (result.count === 0) throw new NotFoundException('Notification not found.');
    const notification = await this.prisma.notification.findFirstOrThrow({
      select: notificationSelect,
      where: { id, userId },
    });
    return toResponse(notification);
  }

  async markAllAsRead(userId: string) {
    const result = await this.prisma.notification.updateMany({
      data: { readAt: new Date() },
      where: { readAt: null, userId },
    });
    return { updatedCount: result.count };
  }
}

const notificationSelect = {
  actionUrl: true,
  createdAt: true,
  id: true,
  message: true,
  readAt: true,
  title: true,
  type: true,
} satisfies Prisma.NotificationSelect;

type NotificationRow = Prisma.NotificationGetPayload<{ select: typeof notificationSelect }>;

function toResponse(row: NotificationRow) {
  return {
    actionUrl: row.actionUrl,
    createdAt: row.createdAt.toISOString(),
    id: row.id,
    message: row.message,
    readAt: row.readAt?.toISOString() ?? null,
    title: row.title,
    type: row.type,
  };
}
