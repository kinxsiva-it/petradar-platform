import { UserRole, VolunteerVerificationState } from '@prisma/client';

export interface AuthenticatedUser {
  id: string;
  email: string;
  displayName: string;
  roles: UserRole[];
  volunteerVerification: VolunteerVerificationState;
}

export interface AccessTokenPayload {
  sub: string;
  roles: UserRole[];
  typ: 'access';
  iat: number;
  exp: number;
}

export interface AuthenticatedRequest {
  user?: AuthenticatedUser;
}
