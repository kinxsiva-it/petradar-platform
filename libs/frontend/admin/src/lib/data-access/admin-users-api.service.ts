import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';

import { API_BASE_PATH } from '@petradar/frontend/core';

import type {
  AdminUsersFilters,
  AdminUsersResponse,
  AdminUserSummary,
  UpdateAdminUserRolesRequest,
  UpdateAdminUserStatusRequest,
  UpdateAdminUserVolunteerVerificationRequest,
} from './admin-users-api.models.js';

@Injectable({ providedIn: 'root' })
export class AdminUsersApiService {
  private readonly http = inject(HttpClient);
  private readonly apiBasePath = inject(API_BASE_PATH);
  private readonly basePath = `${this.apiBasePath}/admin/users`;

  list(filters: AdminUsersFilters = {}): Observable<AdminUsersResponse> {
    return this.http.get<AdminUsersResponse>(this.basePath, { params: toHttpParams(filters) });
  }

  detail(id: string): Observable<AdminUserSummary> {
    return this.http.get<AdminUserSummary>(`${this.basePath}/${encodeURIComponent(id)}`);
  }

  updateRoles(id: string, request: UpdateAdminUserRolesRequest): Observable<AdminUserSummary> {
    return this.http.patch<AdminUserSummary>(`${this.basePath}/${encodeURIComponent(id)}/roles`, request);
  }

  updateStatus(id: string, request: UpdateAdminUserStatusRequest): Observable<AdminUserSummary> {
    return this.http.patch<AdminUserSummary>(`${this.basePath}/${encodeURIComponent(id)}/status`, request);
  }

  updateVolunteerVerification(
    id: string,
    request: UpdateAdminUserVolunteerVerificationRequest,
  ): Observable<AdminUserSummary> {
    return this.http.patch<AdminUserSummary>(
      `${this.basePath}/${encodeURIComponent(id)}/volunteer-verification`,
      request,
    );
  }
}

function toHttpParams(filters: AdminUsersFilters): HttpParams {
  let params = new HttpParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined || value === null || value === '') {
      continue;
    }
    params = params.set(key, String(value));
  }
  return params;
}
