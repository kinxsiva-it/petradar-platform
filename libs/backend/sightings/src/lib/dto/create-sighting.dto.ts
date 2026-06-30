import { AnimalCondition, AnimalSpecies, CollarStatus, UrgencyLevel } from '@prisma/client';
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

export class CreateSightingDto {
  @IsEnum(AnimalSpecies)
  species!: AnimalSpecies;

  @IsInt()
  @Min(1)
  @Max(20)
  count!: number;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  color?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  pattern?: string;

  @IsOptional()
  @IsEnum(CollarStatus)
  collarStatus?: CollarStatus;

  @IsOptional()
  @IsEnum(AnimalCondition)
  condition?: AnimalCondition;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsDateString()
  seenAt!: string;

  @IsOptional()
  @IsEnum(UrgencyLevel)
  urgency?: UrgencyLevel;

  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude!: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude!: number;
}
