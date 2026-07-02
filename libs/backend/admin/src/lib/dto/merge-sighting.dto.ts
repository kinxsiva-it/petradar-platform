import { IsUUID } from 'class-validator';

export class MergeSightingDto {
  @IsUUID()
  targetSightingId!: string;
}
