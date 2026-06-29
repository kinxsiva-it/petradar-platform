import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';

import { API_BASE_PATH } from './api-base-path.js';
import type { AuthResponse, AuthUser, LoginRequest, RegisterRequest } from './auth.models.js';

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private readonly http = inject(HttpClient);
  private readonly apiBasePath = inject(API_BASE_PATH);
  private readonly authBasePath = `${this.apiBasePath}/auth`;

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.authBasePath}/login`, request, {
      withCredentials: true,
    });
  }

  register(request: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.authBasePath}/register`, request, {
      withCredentials: true,
    });
  }

  refresh(): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(
      `${this.authBasePath}/refresh`,
      {},
      { withCredentials: true },
    );
  }

  logout(): Observable<{ success: true }> {
    return this.http.post<{ success: true }>(
      `${this.authBasePath}/logout`,
      {},
      { withCredentials: true },
    );
  }

  me(): Observable<AuthUser> {
    return this.http.get<AuthUser>(`${this.authBasePath}/me`);
  }
}
