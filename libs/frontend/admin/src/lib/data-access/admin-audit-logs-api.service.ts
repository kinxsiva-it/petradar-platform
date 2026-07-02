import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';

import { API_BASE_PATH } from '@petradar/frontend/core';

import type { AdminAuditLogsFilters, AdminAuditLogsResponse } from './admin-audit-logs-api.models.js';

@Injectable({ providedIn: 'root' })
export class AdminAuditLogsApiService {
  private readonly http = inject(HttpClient);
  private readonly apiBasePath = inject(API_BASE_PATH);
  private readonly basePath = `${this.apiBasePath}/admin/audit-logs`;

  list(filters: AdminAuditLogsFilters = {}): Observable<AdminAuditLogsResponse> {
    return this.http.get<AdminAuditLogsResponse>(this.basePath, { params: toHttpParams(filters) });
  }
}

function toHttpParams(filters: AdminAuditLogsFilters): HttpParams {
  let params = new HttpParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined || value === null || value === '') {
      continue;
    }
    params = params.set(key, String(value));
  }
  return params;
}
