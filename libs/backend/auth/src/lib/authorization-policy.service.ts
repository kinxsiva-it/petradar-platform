import { Injectable } from '@nestjs/common';
import { UserRole, VolunteerVerificationState } from '@prisma/client';

import type { AuthenticatedUser } from './authenticated-user.js';

export interface ExactLocationAuthorizationInput {
  user?: AuthenticatedUser | null;
  ownerId?: string | null;
  allowOwner?: boolean;
  assignedVolunteerIds?: string[];
  allowAssignedVolunteer?: boolean;
}

@Injectable()
export class AuthorizationPolicyService {
  canAccessExactLocation(input: ExactLocationAuthorizationInput): boolean {
    const user = input.user;
    if (!user) {
      return false;
    }

    if (user.roles.includes(UserRole.ADMIN)) {
      return true;
    }

    if (input.allowOwner === true && input.ownerId === user.id) {
      return true;
    }

    if (
      input.allowAssignedVolunteer === true &&
      user.roles.includes(UserRole.VOLUNTEER) &&
      user.volunteerVerification === VolunteerVerificationState.VERIFIED &&
      (input.assignedVolunteerIds ?? []).includes(user.id)
    ) {
      return true;
    }

    return false;
  }
}
