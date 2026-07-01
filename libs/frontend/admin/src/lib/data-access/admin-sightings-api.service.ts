import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';

import { API_BASE_PATH } from '@petradar/frontend/core';

import type {
  AdminModerationDetail,
  AdminModerationFilters,
  AdminModerationQueueResponse,
  RejectSightingRequest,
} from './admin-sightings-api.models.js';

@Injectable({ providedIn: 'root' })
export class AdminSightingsApiService {
  private readonly http = inject(HttpClient);
  private readonly apiBasePath = inject(API_BASE_PATH);
  private readonly basePath = `${this.apiBasePath}/admin/sightings`;

  getModerationQueue(
    filters: AdminModerationFilters = {},
  ): Observable<AdminModerationQueueResponse> {
    return this.http.get<AdminModerationQueueResponse>(this.basePath, {
      params: toHttpParams(filters),
    });
  }

  getModerationDetail(id: string): Observable<AdminModerationDetail> {
    return this.http.get<AdminModerationDetail>(`${this.basePath}/${id}`);
  }

  verifySighting(id: string): Observable<AdminModerationDetail> {
    return this.http.patch<AdminModerationDetail>(`${this.basePath}/${id}/verify`, {});
  }

  rejectSighting(id: string, reason: string): Observable<AdminModerationDetail> {
    const request: RejectSightingRequest = { reason };
    return this.http.patch<AdminModerationDetail>(`${this.basePath}/${id}/reject`, request);
  }
}

function toHttpParams(filters: AdminModerationFilters): HttpParams {
  let params = new HttpParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined || value === null || value === '') {
      continue;
    }
    params = params.set(key, String(value));
  }
  return params;
}
