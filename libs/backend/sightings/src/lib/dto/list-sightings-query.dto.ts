import {
  AnimalCondition,
  AnimalSpecies,
  SightingLifecycleStatus,
  UrgencyLevel,
  VerificationStatus,
} from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class ListSightingsQueryDto {
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
  @IsEnum(SightingLifecycleStatus)
  lifecycleStatus?: SightingLifecycleStatus;

  @IsOptional()
  @IsEnum(VerificationStatus)
  verificationStatus?: VerificationStatus;

  @IsOptional()
  @IsEnum(UrgencyLevel)
  urgency?: UrgencyLevel;

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
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10_000)
  radiusMeters?: number;
}
