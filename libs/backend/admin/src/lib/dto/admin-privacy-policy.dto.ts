import { IsInt, Max, Min } from 'class-validator';

import {
  maximumPublicRadiusMeters,
  minimumPublicRadiusMeters,
} from '@petradar/backend/shared';

export class UpdateAdminPrivacyPolicyDto {
  @IsInt()
  @Min(minimumPublicRadiusMeters)
  @Max(maximumPublicRadiusMeters)
  defaultRadiusMeters!: number;
}
