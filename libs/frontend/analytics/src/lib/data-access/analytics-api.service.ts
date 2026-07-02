import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';

import { API_BASE_PATH } from '@petradar/frontend/core';

import type {
  AnalyticsBySpeciesResponse,
  AnalyticsByStatusResponse,
  AnalyticsHotspotsResponse,
  AnalyticsSummaryResponse,
} from './analytics-api.models.js';

@Injectable({ providedIn: 'root' })
export class AnalyticsApiService {
  private readonly http = inject(HttpClient);
  private readonly apiBasePath = inject(API_BASE_PATH);
  private readonly basePath = `${this.apiBasePath}/analytics`;

  summary(): Observable<AnalyticsSummaryResponse> {
    return this.http.get<AnalyticsSummaryResponse>(`${this.basePath}/summary`);
  }

  bySpecies(): Observable<AnalyticsBySpeciesResponse> {
    return this.http.get<AnalyticsBySpeciesResponse>(`${this.basePath}/by-species`);
  }

  byStatus(): Observable<AnalyticsByStatusResponse> {
    return this.http.get<AnalyticsByStatusResponse>(`${this.basePath}/by-status`);
  }

  hotspots(): Observable<AnalyticsHotspotsResponse> {
    return this.http.get<AnalyticsHotspotsResponse>(`${this.basePath}/hotspots`);
  }
}
