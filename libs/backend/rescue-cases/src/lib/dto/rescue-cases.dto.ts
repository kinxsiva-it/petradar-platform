import { AnimalSpecies } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export enum RescueCaseStatusValue {
  ASSIGNED = 'ASSIGNED',
  CLOSED = 'CLOSED',
  IN_PROGRESS = 'IN_PROGRESS',
  NEEDS_RESCUE = 'NEEDS_RESCUE',
  NEEDS_VERIFICATION = 'NEEDS_VERIFICATION',
  NEW_REPORT = 'NEW_REPORT',
  RESOLVED = 'RESOLVED',
}

export enum RescueSeverityValue {
  EMERGENCY = 'EMERGENCY',
  HIGH = 'HIGH',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
}

export class CreateRescueCaseDto {
  @IsUUID()
  sightingId!: string;

  @IsEnum(RescueSeverityValue)
  severity!: RescueSeverityValue;

  @IsOptional()
  @IsEnum(RescueCaseStatusValue)
  status?: RescueCaseStatusValue;

  @IsString()
  @MinLength(8)
  @MaxLength(1000)
  summary!: string;

  @IsOptional()
  @IsUUID()
  assignedVolunteerId?: string;
}

export class ListRescueCasesQueryDto {
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
  @IsEnum(RescueCaseStatusValue)
  status?: RescueCaseStatusValue;

  @IsOptional()
  @IsEnum(RescueSeverityValue)
  severity?: RescueSeverityValue;

  @IsOptional()
  @IsUUID()
  assignedVolunteerId?: string;

  @IsOptional()
  @IsEnum(AnimalSpecies)
  species?: AnimalSpecies;

  @IsOptional()
  @IsDateString()
  createdFrom?: string;

  @IsOptional()
  @IsDateString()
  createdTo?: string;
}

export class UpdateRescueStatusDto {
  @IsEnum(RescueCaseStatusValue)
  status!: RescueCaseStatusValue;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

export class AssignVolunteerDto {
  @IsUUID()
  volunteerId!: string;
}

export class CreateInternalNoteDto {
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  body!: string;
}
