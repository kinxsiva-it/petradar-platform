import { AccountStatus, UserRole, VolunteerVerificationState } from '@prisma/client';
import { ArrayNotEmpty, ArrayUnique, IsArray, IsEnum } from 'class-validator';

export class UpdateAdminUserRolesDto {
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsEnum(UserRole, { each: true })
  roles!: UserRole[];
}

export class UpdateAdminUserStatusDto {
  @IsEnum(AccountStatus)
  status!: AccountStatus;
}

export class UpdateAdminUserVolunteerVerificationDto {
  @IsEnum(VolunteerVerificationState)
  volunteerVerification!: VolunteerVerificationState;
}
