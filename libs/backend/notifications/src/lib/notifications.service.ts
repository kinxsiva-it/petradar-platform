import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { NotificationType, Prisma } from '@prisma/client';

import { PrismaService } from '@petradar/backend/shared';

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
    } catch (error: unknown) {
      this.logger.error(`Notification creation failed for ${input.type}/${input.resourceType}.`);
    }
  }

  async listForUser(userId: string, query: NotificationsQueryDto) {
    const items = await this.prisma.notification.findMany({
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      select: notificationSelect,
      take: query.limit ?? 20,
      where: { userId, ...(query.status === 'unread' ? { readAt: null } : {}) },
    });
    return { items: items.map(toResponse) };
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
