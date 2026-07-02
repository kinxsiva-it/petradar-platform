import {
  AnimalCondition,
  AnimalSpecies,
  SightingLifecycleStatus,
  VerificationStatus,
} from '@prisma/client';
import { IsDateString, IsEnum, IsInt, IsNumber, IsOptional, Max, Min } from 'class-validator';

export class MapSightingsQueryDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number;

  @IsOptional()
  @IsEnum(AnimalSpecies)
  species?: AnimalSpecies;

  @IsOptional()
  @IsEnum(AnimalCondition)
  condition?: AnimalCondition;

  @IsOptional()
  @IsEnum(SightingLifecycleStatus)
  status?: SightingLifecycleStatus;

  @IsOptional()
  @IsEnum(VerificationStatus)
  verification?: VerificationStatus;

  @IsOptional()
  @IsDateString()
  seenFrom?: string;

  @IsOptional()
  @IsDateString()
  seenTo?: string;

  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  north?: number;

  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  south?: number;

  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  east?: number;

  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  west?: number;
}

export class HeatmapQueryDto extends MapSightingsQueryDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  minCount?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number;
}

export class NearbyQueryDto {
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat!: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  lng!: number;

  @IsNumber()
  @Min(1)
  @Max(10_000)
  radius!: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
