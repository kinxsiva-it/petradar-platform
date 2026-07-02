import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';

import { API_BASE_PATH } from '@petradar/frontend/core';

import type {
  AdminModerationDetail,
  AdminModerationFilters,
  AdminModerationQueueResponse,
  ConvertSightingToRescueResponse,
  MergeSightingResponse,
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
    return this.http.get<AdminModerationQueueResponse>(`${this.apiBasePath}/admin/verification-queue`, {
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

  mergeSighting(sourceId: string, targetSightingId: string): Observable<MergeSightingResponse> {
    return this.http.post<MergeSightingResponse>(
      `${this.apiBasePath}/admin/reports/${encodeURIComponent(sourceId)}/merge`,
      { targetSightingId },
    );
  }

  approveReport(id: string): Observable<AdminModerationDetail> {
    return this.http.post<AdminModerationDetail>(
      `${this.apiBasePath}/admin/reports/${encodeURIComponent(id)}/approve`,
      {},
    );
  }

  rejectReport(id: string, reason: string): Observable<AdminModerationDetail> {
    const request: RejectSightingRequest = { reason };
    return this.http.post<AdminModerationDetail>(
      `${this.apiBasePath}/admin/reports/${encodeURIComponent(id)}/reject`,
      request,
    );
  }

  convertToRescue(id: string): Observable<ConvertSightingToRescueResponse> {
    return this.http.post<ConvertSightingToRescueResponse>(
      `${this.apiBasePath}/sightings/${encodeURIComponent(id)}/convert-to-rescue`,
      {},
    );
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
