import { BadRequestException } from '@nestjs/common';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export class OffsetPaginationQueryDto {
  @ApiPropertyOptional({ default: DEFAULT_PAGE, minimum: 1 })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => Number(value))
  @IsInt()
  @Min(1)
  page?: number;

  /** Canonical page-size query parameter. */
  @ApiPropertyOptional({ default: DEFAULT_PAGE_SIZE, maximum: MAX_PAGE_SIZE, minimum: 1 })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(MAX_PAGE_SIZE)
  limit?: number;

  /** Backward-compatible alias used by existing PetRadar clients. */
  @ApiPropertyOptional({
    deprecated: true,
    description: 'Backward-compatible alias for limit.',
    maximum: MAX_PAGE_SIZE,
    minimum: 1,
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(MAX_PAGE_SIZE)
  pageSize?: number;
}

export class CursorPaginationQueryDto {
  @ApiPropertyOptional({ default: DEFAULT_PAGE_SIZE, maximum: MAX_PAGE_SIZE, minimum: 1 })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(MAX_PAGE_SIZE)
  limit?: number;

  @ApiPropertyOptional({ description: 'Opaque cursor returned by the preceding page.' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  cursor?: string;
}

export interface OffsetPaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface CursorPaginationMeta {
  limit: number;
  nextCursor: string | null;
  hasNextPage: boolean;
}

export interface CursorPosition {
  createdAt: Date;
  id: string;
}

export function resolveOffsetPagination(query: OffsetPaginationQueryDto): {
  page: number;
  limit: number;
  skip: number;
} {
  const page = query.page ?? DEFAULT_PAGE;
  const limit = query.limit ?? query.pageSize ?? DEFAULT_PAGE_SIZE;
  return { limit, page, skip: (page - 1) * limit };
}

export function offsetPaginationMeta(
  page: number,
  limit: number,
  total: number,
): OffsetPaginationMeta {
  const totalPages = Math.ceil(total / limit);
  return {
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
    limit,
    page,
    total,
    totalPages,
  };
}

export function cursorPaginationMeta(
  limit: number,
  nextCursor: string | null,
): CursorPaginationMeta {
  return { hasNextPage: nextCursor !== null, limit, nextCursor };
}

export function encodeCursor(position: CursorPosition): string {
  return Buffer.from(
    JSON.stringify({ createdAt: position.createdAt.toISOString(), id: position.id }),
    'utf8',
  ).toString('base64url');
}

export function decodeCursor(cursor: string): CursorPosition {
  try {
    const parsed: unknown = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8'));
    if (!isCursorPayload(parsed)) {
      throw new Error('Invalid cursor payload.');
    }
    const createdAt = new Date(parsed.createdAt);
    if (Number.isNaN(createdAt.getTime())) {
      throw new Error('Invalid cursor timestamp.');
    }
    return { createdAt, id: parsed.id };
  } catch {
    throw new BadRequestException('Invalid pagination cursor.');
  }
}

function isCursorPayload(value: unknown): value is { createdAt: string; id: string } {
  if (
    typeof value !== 'object' ||
    value === null ||
    !('createdAt' in value) ||
    !('id' in value)
  ) {
    return false;
  }
  const { createdAt, id } = value;
  return (
    typeof createdAt === 'string' &&
    typeof id === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(id)
  );
}
