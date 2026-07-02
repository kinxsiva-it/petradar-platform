import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';

import { API_BASE_PATH } from '@petradar/frontend/core';

import type {
  CreateLostPetRequest,
  LostPetApiResponse,
  LostPetListFilters,
  LostPetMatchesResponse,
  MatchApiResponse,
  MatchListFilters,
  PaginatedResponse,
  RejectMatchRequest,
  UpdateLostPetRequest,
} from './lost-pets-api.models.js';

@Injectable({ providedIn: 'root' })
export class LostPetsApiService {
  private readonly http = inject(HttpClient);
  private readonly apiBasePath = inject(API_BASE_PATH);
  private readonly lostPetsBasePath = `${this.apiBasePath}/lost-pets`;
  private readonly matchesBasePath = `${this.apiBasePath}/matches`;

  listLostPets(
    filters: LostPetListFilters = {},
  ): Observable<PaginatedResponse<LostPetApiResponse>> {
    return this.http.get<PaginatedResponse<LostPetApiResponse>>(this.lostPetsBasePath, {
      params: toHttpParams(filters),
    });
  }

  listMyLostPets(
    filters: LostPetListFilters = {},
  ): Observable<PaginatedResponse<LostPetApiResponse>> {
    return this.http.get<PaginatedResponse<LostPetApiResponse>>(
      `${this.lostPetsBasePath}/mine`,
      { params: toHttpParams(filters) },
    );
  }

  getLostPet(id: string): Observable<LostPetApiResponse> {
    return this.http.get<LostPetApiResponse>(`${this.lostPetsBasePath}/${encodeURIComponent(id)}`);
  }

  getMyLostPet(id: string): Observable<LostPetApiResponse> {
    return this.http.get<LostPetApiResponse>(
      `${this.lostPetsBasePath}/mine/${encodeURIComponent(id)}`,
    );
  }

  createLostPet(payload: CreateLostPetRequest): Observable<LostPetApiResponse> {
    return this.http.post<LostPetApiResponse>(this.lostPetsBasePath, payload);
  }

  updateLostPet(id: string, payload: UpdateLostPetRequest): Observable<LostPetApiResponse> {
    return this.http.patch<LostPetApiResponse>(
      `${this.lostPetsBasePath}/${encodeURIComponent(id)}`,
      payload,
    );
  }

  runMatching(lostPetId: string): Observable<LostPetMatchesResponse> {
    return this.http.post<LostPetMatchesResponse>(
      `${this.lostPetsBasePath}/${encodeURIComponent(lostPetId)}/run-matching`,
      {},
    );
  }

  getLostPetMatches(lostPetId: string): Observable<LostPetMatchesResponse> {
    return this.http.get<LostPetMatchesResponse>(
      `${this.lostPetsBasePath}/${encodeURIComponent(lostPetId)}/matches`,
    );
  }

  listMatches(filters: MatchListFilters = {}): Observable<PaginatedResponse<MatchApiResponse>> {
    return this.http.get<PaginatedResponse<MatchApiResponse>>(this.matchesBasePath, {
      params: toHttpParams(filters),
    });
  }

  getMatch(id: string): Observable<MatchApiResponse> {
    return this.http.get<MatchApiResponse>(`${this.matchesBasePath}/${encodeURIComponent(id)}`);
  }

  confirmMatch(id: string): Observable<MatchApiResponse> {
    return this.http.post<MatchApiResponse>(
      `${this.matchesBasePath}/${encodeURIComponent(id)}/confirm`,
      {},
    );
  }

  rejectMatch(id: string, reason?: string): Observable<MatchApiResponse> {
    const payload: RejectMatchRequest = reason?.trim() ? { reason: reason.trim() } : {};
    return this.http.post<MatchApiResponse>(
      `${this.matchesBasePath}/${encodeURIComponent(id)}/reject`,
      payload,
    );
  }
}

function toHttpParams(filters: LostPetListFilters | MatchListFilters): HttpParams {
  let params = new HttpParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined || value === null || value === '') {
      continue;
    }
    params = params.set(key, String(value));
  }
  return params;
}
