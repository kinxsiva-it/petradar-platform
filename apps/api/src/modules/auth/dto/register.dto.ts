import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  displayName!: string;

  @IsString()
  @MinLength(12)
  @MaxLength(128)
  password!: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string;
}
