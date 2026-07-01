import {
  AnimalCondition,
  AnimalSpecies,
  SightingLifecycleStatus,
  UrgencyLevel,
  VerificationStatus,
} from '@prisma/client';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export enum AdminSightingsSort {
  HIGHEST_URGENCY = 'HIGHEST_URGENCY',
  MOST_RECENTLY_SEEN = 'MOST_RECENTLY_SEEN',
  NEWEST_WAITING_FIRST = 'NEWEST_WAITING_FIRST',
  OLDEST_WAITING_FIRST = 'OLDEST_WAITING_FIRST',
}

export class AdminSightingsQueryDto {
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
  @IsString()
  @MaxLength(120)
  query?: string;

  @IsOptional()
  @IsEnum(AnimalSpecies)
  species?: AnimalSpecies;

  @IsOptional()
  @IsEnum(AnimalCondition)
  condition?: AnimalCondition;

  @IsOptional()
  @IsEnum(VerificationStatus)
  verificationStatus?: VerificationStatus;

  @IsOptional()
  @IsEnum(SightingLifecycleStatus)
  lifecycleStatus?: SightingLifecycleStatus;

  @IsOptional()
  @IsEnum(UrgencyLevel)
  urgency?: UrgencyLevel;

  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  hasPhotos?: boolean;

  @IsOptional()
  @IsDateString()
  seenFrom?: string;

  @IsOptional()
  @IsDateString()
  seenTo?: string;

  @IsOptional()
  @IsDateString()
  createdFrom?: string;

  @IsOptional()
  @IsDateString()
  createdTo?: string;

  @IsOptional()
  @IsEnum(AdminSightingsSort)
  sort?: AdminSightingsSort;
}
