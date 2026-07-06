import { inject } from '@angular/core';
import type { CanActivateFn, RouterStateSnapshot } from '@angular/router';
import { Router } from '@angular/router';

import { AUTH_DEFAULT_REDIRECT_URL, DEFAULT_AUTH_REDIRECT_URL } from './auth-redirect-url.js';
import { AuthStateService } from './auth-state.service.js';
import type { UserRole } from './auth.models.js';

const userRoleValues: readonly UserRole[] = ['GUEST', 'REPORTER', 'PET_OWNER', 'VOLUNTEER', 'ADMIN'];

export const authGuard: CanActivateFn = async (_route, state) => {
  const auth = inject(AuthStateService);
  const router = inject(Router);

  await auth.initializeSession();

  if (auth.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/login'], {
    queryParams: { returnUrl: safeReturnUrl(state.url) },
  });
};

export const anonymousOnlyGuard: CanActivateFn = async (_route, state) => {
  const auth = inject(AuthStateService);
  const router = inject(Router);
  const defaultRedirectUrl =
    inject(AUTH_DEFAULT_REDIRECT_URL, { optional: true }) ?? DEFAULT_AUTH_REDIRECT_URL;

  await auth.initializeSession();

  if (!auth.isAuthenticated()) {
    return true;
  }

  const returnUrl = safeReturnUrl(queryParam(state.url, 'returnUrl'));
  return router.parseUrl(returnUrl ?? defaultRedirectUrl);
};

export const roleGuard: CanActivateFn = async (route, state) => {
  const auth = inject(AuthStateService);
  const router = inject(Router);

  await auth.initializeSession();

  if (!auth.isAuthenticated()) {
    return router.createUrlTree(['/login'], {
      queryParams: { returnUrl: safeReturnUrl(state.url) },
    });
  }

  const roles = userRolesRouteData(route.data);
  if (!roles || roles.length === 0 || roles.some((role) => auth.roles().includes(role))) {
    return true;
  }

  if (booleanRouteData(route.data, 'logoutOnForbidden')) {
    await auth.logout();
  }

  const forbiddenRedirectUrl = stringRouteData(route.data, 'forbiddenRedirectUrl');
  if (forbiddenRedirectUrl) {
    return router.parseUrl(safeReturnUrl(forbiddenRedirectUrl) ?? '/');
  }

  return router.createUrlTree(['/']);
};

export function safeReturnUrl(url: string | null | undefined): string | null {
  if (!url || !url.startsWith('/') || url.startsWith('//') || url.includes('://')) {
    return null;
  }

  return url;
}

function queryParam(url: RouterStateSnapshot['url'], key: string): string | null {
  const query = url.split('?')[1];
  if (!query) {
    return null;
  }

  return new URLSearchParams(query).get(key);
}

function booleanRouteData(data: Record<string, unknown>, key: string): boolean {
  return data[key] === true;
}

function stringRouteData(data: Record<string, unknown>, key: string): string | null {
  const value = data[key];
  return typeof value === 'string' ? value : null;
}

function userRolesRouteData(data: Record<string, unknown>): UserRole[] | undefined {
  const value = data['roles'];
  if (!Array.isArray(value) || !value.every(isUserRole)) {
    return undefined;
  }
  return value;
}

function isUserRole(value: unknown): value is UserRole {
  return typeof value === 'string' && userRoleValues.some((role) => role === value);
}
