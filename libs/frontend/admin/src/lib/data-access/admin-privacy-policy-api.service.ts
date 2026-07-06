import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';

import { API_BASE_PATH } from '@petradar/frontend/core';

import type {
  AdminPrivacyCenterResponse,
  UpdateAdminPrivacyPolicyRequest,
} from './admin-privacy-policy-api.models.js';

@Injectable({ providedIn: 'root' })
export class AdminPrivacyPolicyApiService {
  private readonly http = inject(HttpClient);
  private readonly apiBasePath = inject(API_BASE_PATH);
  private readonly basePath = `${this.apiBasePath}/admin/privacy-policy`;

  detail(): Observable<AdminPrivacyCenterResponse> {
    return this.http.get<AdminPrivacyCenterResponse>(this.basePath);
  }

  updatePublicLocationPolicy(
    request: UpdateAdminPrivacyPolicyRequest,
  ): Observable<AdminPrivacyCenterResponse> {
    return this.http.patch<AdminPrivacyCenterResponse>(`${this.basePath}/public-location`, request);
  }
}
