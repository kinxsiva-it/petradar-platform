import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';

import { API_BASE_PATH } from '@petradar/frontend/core';

import type {
  AssignVolunteerRequest,
  CreateInternalNoteRequest,
  CreateRescueCaseRequest,
  ListRescueCasesFilters,
  PaginatedRescueCasesApiResponse,
  RescueCaseApiResponse,
  RescueTimelineEventApiResponse,
  UpdateRescueStatusRequest,
} from './rescue-cases-api.models.js';

@Injectable({ providedIn: 'root' })
export class RescueCasesApiService {
  private readonly http = inject(HttpClient);
  private readonly apiBasePath = inject(API_BASE_PATH);
  private readonly rescueCasesBasePath = `${this.apiBasePath}/rescue-cases`;

  create(request: CreateRescueCaseRequest): Observable<RescueCaseApiResponse> {
    return this.http.post<RescueCaseApiResponse>(this.rescueCasesBasePath, request);
  }

  list(filters: ListRescueCasesFilters = {}): Observable<PaginatedRescueCasesApiResponse> {
    return this.http.get<PaginatedRescueCasesApiResponse>(this.rescueCasesBasePath, {
      params: toHttpParams(filters),
    });
  }

  detail(id: string): Observable<RescueCaseApiResponse> {
    return this.http.get<RescueCaseApiResponse>(
      `${this.rescueCasesBasePath}/${encodeURIComponent(id)}`,
    );
  }

  updateStatus(
    id: string,
    request: UpdateRescueStatusRequest,
  ): Observable<RescueCaseApiResponse> {
    return this.http.patch<RescueCaseApiResponse>(
      `${this.rescueCasesBasePath}/${encodeURIComponent(id)}/status`,
      request,
    );
  }

  assignVolunteer(
    id: string,
    request: AssignVolunteerRequest,
  ): Observable<RescueCaseApiResponse> {
    return this.http.post<RescueCaseApiResponse>(
      `${this.rescueCasesBasePath}/${encodeURIComponent(id)}/assign-volunteer`,
      request,
    );
  }

  addInternalNote(
    id: string,
    request: CreateInternalNoteRequest,
  ): Observable<RescueCaseApiResponse> {
    return this.http.post<RescueCaseApiResponse>(
      `${this.rescueCasesBasePath}/${encodeURIComponent(id)}/notes`,
      request,
    );
  }

  timeline(id: string): Observable<{ items: RescueTimelineEventApiResponse[] }> {
    return this.http.get<{ items: RescueTimelineEventApiResponse[] }>(
      `${this.rescueCasesBasePath}/${encodeURIComponent(id)}/timeline`,
    );
  }
}

function toHttpParams(filters: ListRescueCasesFilters): HttpParams {
  let params = new HttpParams();

  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined || value === null || value === '') {
      continue;
    }
    params = params.set(key, String(value));
  }

  return params;
}
