import { Injector, runInInjectionContext } from '@angular/core';
import { Router } from '@angular/router';

import { anonymousOnlyGuard, authGuard, roleGuard, safeReturnUrl } from './auth.guards.js';
import { AuthStateService } from './auth-state.service.js';

function routerState(url: string) {
  return { url };
}

function routeData(data: Record<string, unknown>) {
  return { data };
}

function setup(auth: Partial<AuthStateService>) {
  const router = {
    createUrlTree: vi.fn((commands: unknown[], options?: unknown) => ({ commands, options })),
    parseUrl: vi.fn((url: string) => ({ url })),
  };

  const injector = Injector.create({
    providers: [
      { provide: AuthStateService, useValue: auth },
      { provide: Router, useValue: router },
    ],
  });

  return { injector, router };
}

describe('auth route guards', () => {
  it('allows authenticated users through the auth guard', async () => {
    const { injector } = setup({
      initializeSession: vi.fn().mockResolvedValue(undefined),
      isAuthenticated: () => true,
    } as Partial<AuthStateService>);

    await expect(
      runInInjectionContext(injector, () =>
        authGuard(routeData({}) as never, routerState('/my/reports') as never),
      ),
    ).resolves.toBe(true);
  });

  it('redirects anonymous users to login with a safe return URL', async () => {
    const { injector, router } = setup({
      initializeSession: vi.fn().mockResolvedValue(undefined),
      isAuthenticated: () => false,
    } as Partial<AuthStateService>);

    await runInInjectionContext(injector, () =>
      authGuard(routeData({}) as never, routerState('/my/reports') as never),
    );

    expect(router.createUrlTree).toHaveBeenCalledWith(['/login'], {
      queryParams: { returnUrl: '/my/reports' },
    });
  });

  it('redirects authenticated users away from anonymous-only pages', async () => {
    const { injector, router } = setup({
      initializeSession: vi.fn().mockResolvedValue(undefined),
      isAuthenticated: () => true,
    } as Partial<AuthStateService>);

    await runInInjectionContext(injector, () =>
      anonymousOnlyGuard(routeData({}) as never, routerState('/login?returnUrl=/profile') as never),
    );

    expect(router.parseUrl).toHaveBeenCalledWith('/profile');
  });

  it('allows admins and volunteer-or-admin role combinations', async () => {
    const { injector } = setup({
      initializeSession: vi.fn().mockResolvedValue(undefined),
      isAuthenticated: () => true,
      roles: () => ['ADMIN'],
    } as Partial<AuthStateService>);

    await expect(
      runInInjectionContext(injector, () =>
        roleGuard(routeData({ roles: ['ADMIN'] }) as never, routerState('/admin') as never),
      ),
    ).resolves.toBe(true);
    await expect(
      runInInjectionContext(injector, () =>
        roleGuard(
          routeData({ roles: ['VOLUNTEER', 'ADMIN'] }) as never,
          routerState('/volunteer') as never,
        ),
      ),
    ).resolves.toBe(true);
  });

  it('redirects users missing required roles', async () => {
    const { injector, router } = setup({
      initializeSession: vi.fn().mockResolvedValue(undefined),
      isAuthenticated: () => true,
      roles: () => ['REPORTER'],
    } as Partial<AuthStateService>);

    await runInInjectionContext(injector, () =>
      roleGuard(routeData({ roles: ['ADMIN'] }) as never, routerState('/admin') as never),
    );

    expect(router.createUrlTree).toHaveBeenCalledWith(['/']);
  });

  it('can clear sessions and redirect to a safe URL when a role is forbidden', async () => {
    const logout = vi.fn().mockResolvedValue(undefined);
    const { injector, router } = setup({
      initializeSession: vi.fn().mockResolvedValue(undefined),
      isAuthenticated: () => true,
      logout,
      roles: () => ['REPORTER'],
    } as Partial<AuthStateService>);

    await runInInjectionContext(injector, () =>
      roleGuard(
        routeData({
          forbiddenRedirectUrl: '/login?access=denied',
          logoutOnForbidden: true,
          roles: ['ADMIN'],
        }) as never,
        routerState('/') as never,
      ),
    );

    expect(logout).toHaveBeenCalledTimes(1);
    expect(router.parseUrl).toHaveBeenCalledWith('/login?access=denied');
  });

  it('rejects unsafe return URLs', () => {
    expect(safeReturnUrl('/profile')).toBe('/profile');
    expect(safeReturnUrl('https://evil.example')).toBeNull();
    expect(safeReturnUrl('//evil.example')).toBeNull();
  });
});
