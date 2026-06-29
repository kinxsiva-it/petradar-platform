import { inject } from '@angular/core';
import type { CanActivateFn, RouterStateSnapshot } from '@angular/router';
import { Router } from '@angular/router';

import { AuthStateService } from './auth-state.service.js';
import type { UserRole } from './auth.models.js';

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

  await auth.initializeSession();

  if (!auth.isAuthenticated()) {
    return true;
  }

  const returnUrl = safeReturnUrl(queryParam(state.url, 'returnUrl'));
  return router.parseUrl(returnUrl ?? '/my/reports');
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

  const roles = route.data['roles'] as UserRole[] | undefined;
  if (!roles || roles.length === 0 || roles.some((role) => auth.roles().includes(role))) {
    return true;
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
