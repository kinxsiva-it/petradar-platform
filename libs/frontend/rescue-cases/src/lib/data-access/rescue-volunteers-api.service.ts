import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, type Observable } from 'rxjs';

import { API_BASE_PATH } from '@petradar/frontend/core';

export interface RescueVolunteerOption {
  displayName: string;
  email: string;
  id: string;
}

interface AdminVolunteerResponse {
  items: {
    displayName: string;
    email: string;
    id: string;
  }[];
}

@Injectable({ providedIn: 'root' })
export class RescueVolunteersApiService {
  private readonly http = inject(HttpClient);
  private readonly apiBasePath = inject(API_BASE_PATH);

  search(query: string): Observable<RescueVolunteerOption[]> {
    const params = new HttpParams()
      .set('page', '1')
      .set('pageSize', '10')
      .set('role', 'VOLUNTEER')
      .set('status', 'ACTIVE')
      .set('volunteerVerification', 'VERIFIED')
      .set('query', query.trim());
    return this.http
      .get<AdminVolunteerResponse>(`${this.apiBasePath}/admin/users`, { params })
      .pipe(map((response) => response.items));
  }
}
