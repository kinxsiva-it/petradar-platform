import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

import { OffsetPaginationQueryDto } from '@petradar/backend/shared';

export enum MatchReviewStatusValue {
  CONFIRMED = 'CONFIRMED',
  PENDING = 'PENDING',
  REJECTED = 'REJECTED',
}

export class ListMatchesQueryDto extends OffsetPaginationQueryDto {
  @IsOptional()
  @IsEnum(MatchReviewStatusValue)
  status?: MatchReviewStatusValue;
}

export class RejectMatchDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
