import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';

import { API_BASE_PATH } from '@petradar/frontend/core';

import type {
  CreateSightingRequest,
  OwnerSightingApiResponse,
  PaginatedSightingsApiResponse,
  PublicSightingApiResponse,
  SightingListFilters,
  UpdateSightingRequest,
} from './sightings-api.models.js';

@Injectable({ providedIn: 'root' })
export class SightingsApiService {
  private readonly http = inject(HttpClient);
  private readonly apiBasePath = inject(API_BASE_PATH);
  private readonly sightingsBasePath = `${this.apiBasePath}/sightings`;

  create(request: CreateSightingRequest): Observable<OwnerSightingApiResponse> {
    return this.http.post<OwnerSightingApiResponse>(this.sightingsBasePath, request);
  }

  listPublic(
    filters: SightingListFilters = {},
  ): Observable<PaginatedSightingsApiResponse<PublicSightingApiResponse>> {
    return this.http.get<PaginatedSightingsApiResponse<PublicSightingApiResponse>>(
      this.sightingsBasePath,
      { params: toHttpParams(filters) },
    );
  }

  publicDetail(id: string): Observable<PublicSightingApiResponse> {
    return this.http.get<PublicSightingApiResponse>(`${this.sightingsBasePath}/${id}`);
  }

  mySightings(
    filters: SightingListFilters = {},
  ): Observable<PaginatedSightingsApiResponse<OwnerSightingApiResponse>> {
    return this.http.get<PaginatedSightingsApiResponse<OwnerSightingApiResponse>>(
      `${this.sightingsBasePath}/mine`,
      { params: toHttpParams(filters) },
    );
  }

  mySightingDetail(id: string): Observable<OwnerSightingApiResponse> {
    return this.http.get<OwnerSightingApiResponse>(`${this.sightingsBasePath}/mine/${id}`);
  }

  update(id: string, request: UpdateSightingRequest): Observable<OwnerSightingApiResponse> {
    return this.http.patch<OwnerSightingApiResponse>(`${this.sightingsBasePath}/${id}`, request);
  }
}

function toHttpParams(filters: SightingListFilters): HttpParams {
  let params = new HttpParams();

  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined || value === null || value === '') {
      continue;
    }
    params = params.set(key, String(value));
  }

  return params;
}
