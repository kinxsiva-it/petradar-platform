export type UserRole = 'GUEST' | 'REPORTER' | 'PET_OWNER' | 'VOLUNTEER' | 'ADMIN';
export type AccountStatus = 'ACTIVE' | 'SUSPENDED' | 'PENDING_REVIEW';
export type VolunteerVerification = 'NOT_APPLICABLE' | 'PENDING' | 'VERIFIED' | 'REJECTED';
export type AuthStatus = 'initializing' | 'authenticated' | 'anonymous';

export interface AuthUser {
  createdAt: string;
  displayName: string;
  email: string;
  id: string;
  phone: string | null;
  roles: UserRole[];
  status: AccountStatus;
  updatedAt: string;
  volunteerVerification: VolunteerVerification;
}

export interface AuthSession {
  accessToken: string;
  expiresInSeconds: number;
  user: AuthUser;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest extends LoginRequest {
  displayName: string;
  phone?: string;
}

export type AuthenticatedRequest = <T>(
  path: string,
  options?: ApiRequestOptions,
) => Promise<T>;
import type { ApiRequestOptions } from '../../lib/api/http-client';
