import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@prisma/client';

export const requiredRolesMetadataKey = 'petradar:required_roles';

export const Roles = (...roles: UserRole[]): ReturnType<typeof SetMetadata> =>
  SetMetadata(requiredRolesMetadataKey, roles);
