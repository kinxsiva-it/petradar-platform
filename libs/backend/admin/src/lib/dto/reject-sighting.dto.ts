import { Transform } from 'class-transformer';
import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class RejectSightingDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : value,
  )
  @IsString()
  @MinLength(8)
  @MaxLength(600)
  @Matches(/^[^<>]*$/, { message: 'reason must not contain HTML.' })
  reason!: string;
}
