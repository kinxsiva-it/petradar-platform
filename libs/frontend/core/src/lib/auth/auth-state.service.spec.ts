import { HttpErrorResponse } from '@angular/common/http';
import { Injector, runInInjectionContext } from '@angular/core';
import { of, Subject, throwError } from 'rxjs';

import { AuthApiService } from './auth-api.service.js';
import { AuthStateService } from './auth-state.service.js';
import type { AuthResponse, AuthUser } from './auth.models.js';

const user: AuthUser = {
  createdAt: '2026-06-29T00:00:00.000Z',
  displayName: 'Nicha',
  email: 'nicha@example.com',
  id: 'user-id',
  phone: null,
  roles: ['REPORTER'],
  status: 'ACTIVE',
  updatedAt: '2026-06-29T00:10:00.000Z',
  volunteerVerification: 'NOT_APPLICABLE',
};

const session: AuthResponse = {
  accessToken: 'access-token',
  expiresInSeconds: 900,
  user,
};

function setup(api: Partial<AuthApiService>): AuthStateService {
  const injector = Injector.create({
    providers: [
      AuthStateService,
      {
        provide: AuthApiService,
        useValue: api,
      },
    ],
  });

  return runInInjectionContext(injector, () => injector.get(AuthStateService));
}

describe('AuthStateService', () => {
  it('updates state after successful login', async () => {
    const login = vi.fn().mockReturnValue(of(session));
    const auth = setup({ login });

    await expect(auth.login({ email: 'nicha@example.com', password: 'password' })).resolves.toBe(true);

    expect(login).toHaveBeenCalledWith({ email: 'nicha@example.com', password: 'password' });
    expect(auth.isAuthenticated()).toBe(true);
    expect(auth.accessToken()).toBe('access-token');
    expect(auth.user()?.email).toBe('nicha@example.com');
  });

  it('sets a safe login error on failure', async () => {
    const login = vi.fn().mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 401, statusText: 'Unauthorized' })),
    );
    const auth = setup({ login });

    await expect(auth.login({ email: 'nicha@example.com', password: 'bad' })).resolves.toBe(false);

    expect(auth.isAuthenticated()).toBe(false);
    expect(auth.error()).toBe('Invalid email or password.');
  });

  it('does not send privileged roles in registration requests', async () => {
    const register = vi.fn().mockReturnValue(of(session));
    const auth = setup({ register });

    await auth.register({
      displayName: 'Nicha',
      email: 'nicha@example.com',
      password: 'long-safe-password',
    });

    expect(register).toHaveBeenCalledWith({
      displayName: 'Nicha',
      email: 'nicha@example.com',
      password: 'long-safe-password',
    });
    expect(JSON.stringify(register.mock.calls)).not.toContain('ADMIN');
    expect(JSON.stringify(register.mock.calls)).not.toContain('VOLUNTEER');
  });

  it('restores a session with refresh followed by current user loading', async () => {
    const refresh = vi.fn().mockReturnValue(of(session));
    const me = vi.fn().mockReturnValue(of({ ...user, displayName: 'Fresh Nicha' }));
    const auth = setup({ me, refresh });

    await auth.initializeSession();

    expect(refresh).toHaveBeenCalledTimes(1);
    expect(me).toHaveBeenCalledTimes(1);
    expect(auth.user()?.displayName).toBe('Fresh Nicha');
    expect(auth.isAuthenticated()).toBe(true);
  });

  it('becomes anonymous when no valid refresh session exists', async () => {
    const refresh = vi.fn().mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 401, statusText: 'Unauthorized' })),
    );
    const auth = setup({ refresh });

    await auth.initializeSession();

    expect(auth.status()).toBe('anonymous');
    expect(auth.error()).toBeNull();
  });

  it('shares concurrent refresh requests', () => {
    const refreshSubject = new Subject<AuthResponse>();
    const refresh = vi.fn().mockReturnValue(refreshSubject.asObservable());
    const auth = setup({ refresh });

    auth.refreshSession().subscribe();
    auth.refreshSession().subscribe();

    expect(refresh).toHaveBeenCalledTimes(1);
    refreshSubject.next(session);
    refreshSubject.complete();
  });

  it('clears local state on logout even if the network request fails', async () => {
    const login = vi.fn().mockReturnValue(of(session));
    const logout = vi.fn().mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 500, statusText: 'Server error' })),
    );
    const auth = setup({ login, logout });

    await auth.login({ email: 'nicha@example.com', password: 'password' });
    await auth.logout();

    expect(logout).toHaveBeenCalledTimes(1);
    expect(auth.status()).toBe('anonymous');
    expect(auth.accessToken()).toBeNull();
  });
});
