import { apiRequest } from '../../lib/api/http-client';
import type { AuthSession, AuthUser, LoginRequest, RegisterRequest } from './auth-types';

let refreshRequest: Promise<AuthSession> | null = null;

export function login(request: LoginRequest): Promise<AuthSession> {
  return apiRequest<AuthSession>('auth/login', { json: request, method: 'POST' });
}

export function register(request: RegisterRequest): Promise<AuthSession> {
  return apiRequest<AuthSession>('auth/register', { json: request, method: 'POST' });
}

export function refreshSessionOnce(): Promise<AuthSession> {
  refreshRequest ??= apiRequest<AuthSession>('auth/refresh', {
    json: {},
    method: 'POST',
  }).finally(() => {
    refreshRequest = null;
  });

  return refreshRequest;
}

export function getCurrentUser(accessToken: string): Promise<AuthUser> {
  return apiRequest<AuthUser>('auth/me', { accessToken });
}

export function logout(): Promise<{ success: true }> {
  return apiRequest<{ success: true }>('auth/logout', { json: {}, method: 'POST' });
}
