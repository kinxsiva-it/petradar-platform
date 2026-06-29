import { Injectable } from '@nestjs/common';
import { AuditLog, Prisma } from '@prisma/client';

import { PrismaService } from '@petradar/backend/shared';

export interface AuditLogInput {
  actorId?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Prisma.InputJsonValue | null;
  requestId?: string | null;
}

const sensitiveKeyPattern =
  /(password|token|secret|credential|database_url|connection_string|exact_?lat|exact_?lng|exact_?lon|exactlocation|exact_location)/i;

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  sanitizeMetadata(value: Prisma.InputJsonValue | null | undefined): Prisma.InputJsonValue | null {
    if (value === null || value === undefined) {
      return null;
    }

    if (Array.isArray(value)) {
      const items = value as Prisma.InputJsonValue[];
      return items.map((item) => this.sanitizeMetadata(item)).filter((item) => item !== null);
    }

    if (typeof value === 'object') {
      const record = value as Record<string, Prisma.InputJsonValue>;
      return Object.fromEntries(
        Object.entries(record)
          .filter(([key]) => !sensitiveKeyPattern.test(key))
          .map(([key, child]) => [key, this.sanitizeMetadata(child)]),
      );
    }

    return value;
  }

  create(input: AuditLogInput): Promise<AuditLog> {
    const metadata = this.sanitizeMetadata(input.metadata);

    return this.prisma.auditLog.create({
      data: {
        action: input.action,
        actorId: input.actorId,
        entityId: input.entityId,
        entityType: input.entityType,
        metadata: metadata ?? Prisma.DbNull,
        requestId: input.requestId,
      },
    });
  }
}
