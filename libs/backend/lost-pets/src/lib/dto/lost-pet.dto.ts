import { AnimalSpecies } from '@prisma/client';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
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

export enum LostPetSexValue {
  FEMALE = 'FEMALE',
  MALE = 'MALE',
  UNKNOWN = 'UNKNOWN',
}

export enum LostPetStatusValue {
  CLOSED = 'CLOSED',
  LOST = 'LOST',
  POSSIBLE_MATCH = 'POSSIBLE_MATCH',
  REUNITED = 'REUNITED',
}

export class CreateLostPetDto {
  @IsString()
  @MaxLength(120)
  name!: string;

  @IsEnum(AnimalSpecies)
  species!: AnimalSpecies;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  breed?: string;

  @IsOptional()
  @IsEnum(LostPetSexValue)
  sex?: LostPetSexValue;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  age?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  color?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  pattern?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  collarDescription?: string;

  @IsOptional()
  @IsBoolean()
  microchipped?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5)
  @IsString({ each: true })
  @MaxLength(1000, { each: true })
  photoUrls?: string[];

  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude!: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude!: number;

  @IsDateString()
  lastSeenAt!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  contactMethod?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  rewardCents?: number;
}

export class UpdateLostPetDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsEnum(AnimalSpecies)
  species?: AnimalSpecies;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  breed?: string;

  @IsOptional()
  @IsEnum(LostPetSexValue)
  sex?: LostPetSexValue;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  age?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  color?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  pattern?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  collarDescription?: string;

  @IsOptional()
  @IsBoolean()
  microchipped?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5)
  @IsString({ each: true })
  @MaxLength(1000, { each: true })
  photoUrls?: string[];

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
  @IsDateString()
  lastSeenAt?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  contactMethod?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  rewardCents?: number;

  @IsOptional()
  @IsEnum(LostPetStatusValue)
  status?: LostPetStatusValue;
}

export class ListLostPetsQueryDto {
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
  @IsEnum(LostPetStatusValue)
  status?: LostPetStatusValue;

  @IsOptional()
  @IsDateString()
  lastSeenFrom?: string;

  @IsOptional()
  @IsDateString()
  lastSeenTo?: string;
}
