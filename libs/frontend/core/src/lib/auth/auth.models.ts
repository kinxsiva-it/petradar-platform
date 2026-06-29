export type UserRole = 'GUEST' | 'REPORTER' | 'PET_OWNER' | 'VOLUNTEER' | 'ADMIN';

export type AccountStatus = 'ACTIVE' | 'SUSPENDED' | 'PENDING_REVIEW';

export type VolunteerVerificationState = 'NOT_APPLICABLE' | 'PENDING' | 'VERIFIED' | 'REJECTED';

export type AuthenticationStatus = 'initializing' | 'authenticated' | 'anonymous';

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  phone: string | null;
  roles: UserRole[];
  status: AccountStatus;
  volunteerVerification: VolunteerVerificationState;
  createdAt: string;
  updatedAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  displayName: string;
  email: string;
  password: string;
  phone?: string | null;
}

export interface AuthResponse {
  accessToken: string;
  expiresInSeconds: number;
  user: AuthUser;
}

export interface ApiErrorResponse {
  error: string;
  message: string | string[];
  path: string;
  requestId: string | null;
  statusCode: number;
  timestamp: string;
}
