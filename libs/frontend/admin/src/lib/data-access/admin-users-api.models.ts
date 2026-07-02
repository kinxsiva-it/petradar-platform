import type { UserRole } from '@petradar/frontend/core';

export type AdminAccountStatus = 'ACTIVE' | 'SUSPENDED' | 'PENDING_REVIEW';
export type VolunteerVerificationState = 'NOT_APPLICABLE' | 'PENDING' | 'VERIFIED' | 'REJECTED';

export interface AdminUserSummary {
  accountStatus: AdminAccountStatus;
  assignedRescueCaseCount: number;
  avatarUrl: string | null;
  createdAt: string;
  displayName: string;
  email: string;
  id: string;
  lostPetCount: number;
  reportCount: number;
  rescueParticipationCount: number;
  roles: UserRole[];
  updatedAt: string;
  volunteerVerification: VolunteerVerificationState;
}

export interface AdminUsersFilters {
  page?: number;
  pageSize?: number;
  query?: string;
  role?: UserRole;
  status?: AdminAccountStatus;
  volunteerVerification?: VolunteerVerificationState;
}

export interface AdminUsersResponse {
  items: AdminUserSummary[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}
