import { IsEnum, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export enum MatchReviewStatusValue {
  CONFIRMED = 'CONFIRMED',
  PENDING = 'PENDING',
  REJECTED = 'REJECTED',
}

export class ListMatchesQueryDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  pageSize?: number;

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
