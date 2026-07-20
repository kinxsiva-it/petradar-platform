import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { NotificationType, UserRole, VolunteerVerificationState } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import type { AuthenticatedUser } from '@petradar/backend/auth';
import { ListMatchesQueryDto, MatchingService } from '@petradar/backend/matching';
import { NotificationsQueryDto, NotificationsService } from '@petradar/backend/notifications';
import { RescueActivityQueryDto, RescueCasesService } from '@petradar/backend/rescue-cases';
import {
  decodeCursor,
  encodeCursor,
  offsetPaginationMeta,
  resolveOffsetPagination,
} from '@petradar/backend/shared';

const owner: AuthenticatedUser = {
  displayName: 'Pagination Owner',
  email: 'pagination-owner@example.test',
  id: '11111111-1111-4111-8111-111111111111',
  roles: [UserRole.PET_OWNER],
  volunteerVerification: VolunteerVerificationState.NOT_APPLICABLE,
};

const admin: AuthenticatedUser = { ...owner, id: '12111111-1111-4111-8111-111111111111', roles: [UserRole.ADMIN] };

describe('backend pagination contracts', () => {
  describe('shared offset and cursor helpers', () => {
    it('uses page 1 and limit 20 by default and calculates navigation metadata', () => {
      expect(resolveOffsetPagination({})).toEqual({ limit: 20, page: 1, skip: 0 });
      expect(resolveOffsetPagination({ limit: 15, page: 3 })).toEqual({
        limit: 15,
        page: 3,
        skip: 30,
      });
      expect(offsetPaginationMeta(2, 20, 41)).toEqual({
        hasNextPage: true,
        hasPreviousPage: true,
        limit: 20,
        page: 2,
        total: 41,
        totalPages: 3,
      });
    });

    it('round-trips opaque cursors and rejects malformed cursors', () => {
      const position = {
        createdAt: new Date('2026-07-20T08:00:00.000Z'),
        id: '22222222-2222-4222-8222-222222222222',
      };
      const cursor = encodeCursor(position);

      expect(cursor).not.toContain(position.id);
      expect(decodeCursor(cursor)).toEqual(position);
      expect(() => decodeCursor('not-a-valid-cursor')).toThrow(BadRequestException);
      const invalidIdCursor = Buffer.from(
        JSON.stringify({ createdAt: position.createdAt.toISOString(), id: 'not-a-uuid' }),
      ).toString('base64url');
      expect(() => decodeCursor(invalidIdCursor)).toThrow(BadRequestException);
    });

    it('rejects limits above the safe maximum', async () => {
      const notifications = Object.assign(new NotificationsQueryDto(), { limit: 101 });
      const matches = plainToInstance(ListMatchesQueryDto, { limit: '101', page: '0' });
      const rescueActivity = plainToInstance(RescueActivityQueryDto, { limit: '101' });

      expect(await validate(notifications)).not.toHaveLength(0);
      expect(await validate(matches)).toHaveLength(2);
      expect(await validate(rescueActivity)).not.toHaveLength(0);
    });
  });

  describe('notification keyset pagination', () => {
    it('fetches one look-ahead row and returns an opaque next cursor', async () => {
      const createdAt = new Date('2026-07-20T08:00:00.000Z');
      const rows = [notificationRow('30000000-0000-4000-8000-000000000003', createdAt), notificationRow('20000000-0000-4000-8000-000000000002', createdAt)];
      const findMany = jest.fn().mockResolvedValue(rows);
      const service = new NotificationsService({ notification: { findMany } } as never);

      const response = await service.listForUser(owner.id, { limit: 1, status: 'unread' });

      expect(findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
          take: 2,
          where: { readAt: null, userId: owner.id },
        }),
      );
      expect(response.items.map((item) => item.id)).toEqual([rows[0]?.id]);
      expect(typeof response.pagination.nextCursor).toBe('string');
      expect(response.pagination).toEqual({
        hasNextPage: true,
        limit: 1,
        nextCursor: response.pagination.nextCursor,
      });
    });

    it('uses createdAt and id for the next page without weakening user isolation', async () => {
      const createdAt = new Date('2026-07-20T08:00:00.000Z');
      const cursor = encodeCursor({
        createdAt,
        id: '30000000-0000-4000-8000-000000000003',
      });
      const findMany = jest.fn().mockResolvedValue([
        notificationRow('20000000-0000-4000-8000-000000000002', createdAt),
      ]);
      const service = new NotificationsService({ notification: { findMany } } as never);

      const response = await service.listForUser(owner.id, { cursor, limit: 20, status: 'all' });

      expect(findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { createdAt: { lt: createdAt } },
              {
                createdAt,
                id: { lt: '30000000-0000-4000-8000-000000000003' },
              },
            ],
            userId: owner.id,
          },
        }),
      );
      expect(response.pagination).toEqual({
        hasNextPage: false,
        limit: 20,
        nextCursor: null,
      });
    });
  });

  describe('per-pet match pagination', () => {
    it('returns stable offset metadata and a filtered total', async () => {
      const queryRaw = jest
        .fn()
        .mockResolvedValueOnce([lostPetAccessRow(owner.id)])
        .mockResolvedValueOnce([matchRow()])
        .mockResolvedValueOnce([{ total: 3n }]);
      const service = new MatchingService({} as never, {} as never, {
        $queryRaw: queryRaw,
      } as never);

      const response = await service.listForLostPet(owner, 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', {
        limit: 1,
        page: 2,
      });

      expect(response.items).toHaveLength(1);
      expect(response.pageSize).toBe(1);
      expect(response.pagination).toEqual({
        hasNextPage: true,
        hasPreviousPage: true,
        limit: 1,
        page: 2,
        total: 3,
        totalPages: 3,
      });
    });

    it('checks pet ownership before executing paginated match queries', async () => {
      const queryRaw = jest
        .fn()
        .mockResolvedValueOnce([lostPetAccessRow('99999999-9999-4999-8999-999999999999')]);
      const service = new MatchingService({} as never, {} as never, {
        $queryRaw: queryRaw,
      } as never);

      await expect(
        service.listForLostPet(owner, 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', {}),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(queryRaw).toHaveBeenCalledTimes(1);
    });
  });

  describe('protected rescue activity pagination', () => {
    it('returns a cursor page only after case access succeeds', async () => {
      const createdAt = new Date('2026-07-20T08:00:00.000Z');
      const queryRaw = jest
        .fn()
        .mockResolvedValueOnce([{ assignedVolunteerId: null }])
        .mockResolvedValueOnce([
          timelineRow('40000000-0000-4000-8000-000000000004', createdAt),
          timelineRow('50000000-0000-4000-8000-000000000005', createdAt),
        ]);
      const service = new RescueCasesService({} as never, {} as never, {
        $queryRaw: queryRaw,
      } as never);

      const response = await service.timeline(
        admin,
        'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
        { limit: 1 },
      );

      expect(response.items).toHaveLength(1);
      expect(typeof response.pagination.nextCursor).toBe('string');
      expect(response.pagination).toEqual({
        hasNextPage: true,
        limit: 1,
        nextCursor: response.pagination.nextCursor,
      });
    });

    it('does not query notes when the requester cannot access the case', async () => {
      const queryRaw = jest.fn().mockResolvedValueOnce([{ assignedVolunteerId: null }]);
      const service = new RescueCasesService({} as never, {} as never, {
        $queryRaw: queryRaw,
      } as never);

      await expect(
        service.notes(owner, 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', {}),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(queryRaw).toHaveBeenCalledTimes(1);
    });
  });
});

function notificationRow(id: string, createdAt: Date) {
  return {
    actionUrl: '/notifications',
    createdAt,
    id,
    message: 'A pagination test notification.',
    readAt: null,
    title: 'Pagination test',
    type: NotificationType.MATCH_FOUND,
  };
}

function lostPetAccessRow(ownerId: string) {
  return {
    collarDescription: null,
    color: 'orange',
    description: null,
    id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    lastSeenAt: new Date('2026-07-18T08:00:00.000Z'),
    name: 'Momo',
    ownerId,
    pattern: null,
    species: 'CAT',
  };
}

function matchRow() {
  return {
    distanceMeters: 1200,
    id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    level: 'HIGH',
    lostPetId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    lostPetName: 'Momo',
    lostPetOwnerId: owner.id,
    matchedAt: new Date('2026-07-20T08:00:00.000Z'),
    reasons: ['Species match'],
    rejectionReason: null,
    reviewStatus: 'PENDING',
    reviewedAt: null,
    score: 90,
    sightingCondition: 'HEALTHY',
    sightingId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    sightingLatitude: 13.75,
    sightingLongitude: 100.5,
    sightingRadiusMeters: 300,
    sightingSeenAt: new Date('2026-07-19T08:00:00.000Z'),
    species: 'CAT',
  };
}

function timelineRow(id: string, createdAt: Date) {
  return {
    actorDisplayName: admin.displayName,
    actorId: admin.id,
    createdAt,
    eventType: 'STATUS_CHANGED',
    id,
    newStatus: 'IN_PROGRESS',
    note: null,
    previousStatus: 'ASSIGNED',
  };
}
