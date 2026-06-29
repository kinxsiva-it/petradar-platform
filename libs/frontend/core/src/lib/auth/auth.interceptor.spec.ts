import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandlerFn,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import { Injector, runInInjectionContext } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';

import { API_BASE_PATH } from './api-base-path.js';
import { authInterceptor } from './auth.interceptor.js';
import { AuthStateService } from './auth-state.service.js';

interface InterceptorRun {
  handledRequests: HttpRequest<unknown>[];
  result$: Observable<HttpEvent<unknown>>;
}

function runInterceptor(
  auth: Partial<AuthStateService>,
  request: HttpRequest<unknown>,
  responses: Observable<HttpEvent<unknown>>[],
): InterceptorRun {
  const injector = Injector.create({
    providers: [
      { provide: API_BASE_PATH, useValue: '/api/v1' },
      { provide: AuthStateService, useValue: auth },
    ],
  });
  const handledRequests: HttpRequest<unknown>[] = [];
  const next: HttpHandlerFn = (handledRequest) => {
    handledRequests.push(handledRequest);
    return responses.shift() ?? of(new HttpResponse({ status: 200 }));
  };
  const result$ = runInInjectionContext(injector, () => authInterceptor(request, next));

  return { handledRequests, result$ };
}

describe('authInterceptor', () => {
  it('attaches the access token to protected API requests', () => {
    const run = runInterceptor(
      { accessToken: () => 'access-token' } as Partial<AuthStateService>,
      new HttpRequest('GET', '/api/v1/auth/me'),
      [of(new HttpResponse({ status: 200 }))],
    );

    run.result$.subscribe();

    expect(run.handledRequests[0]?.headers.get('Authorization')).toBe('Bearer access-token');
  });

  it('does not attach bearer tokens to login, register, or refresh', () => {
    const auth = { accessToken: () => 'access-token' } as Partial<AuthStateService>;
    const loginRun = runInterceptor(auth, new HttpRequest('POST', '/api/v1/auth/login'), []);
    const registerRun = runInterceptor(auth, new HttpRequest('POST', '/api/v1/auth/register'), []);
    const refreshRun = runInterceptor(auth, new HttpRequest('POST', '/api/v1/auth/refresh'), []);

    loginRun.result$.subscribe();
    registerRun.result$.subscribe();
    refreshRun.result$.subscribe();

    expect(
      [...loginRun.handledRequests, ...registerRun.handledRequests, ...refreshRun.handledRequests].every(
        (request) => !request.headers.has('Authorization'),
      ),
    ).toBe(true);
  });

  it('refreshes and retries a protected request once after a 401', () => {
    const refreshSession = vi.fn().mockReturnValue(of({ accessToken: 'new-token' }));
    const auth = {
      accessToken: vi.fn().mockReturnValueOnce('old-token').mockReturnValue('new-token'),
      clearAfterAuthenticationFailure: vi.fn(),
      refreshSession,
    } as unknown as AuthStateService;
    const run = runInterceptor(auth, new HttpRequest('GET', '/api/v1/auth/me'), [
      throwError(() => new HttpErrorResponse({ status: 401, statusText: 'Unauthorized' })),
      of(new HttpResponse({ status: 200 })),
    ]);

    run.result$.subscribe();

    expect(refreshSession).toHaveBeenCalledTimes(1);
    expect(run.handledRequests).toHaveLength(2);
    expect(run.handledRequests[1]?.headers.get('Authorization')).toBe('Bearer new-token');
  });

  it('does not retry refresh requests and avoids infinite refresh loops', () => {
    const refreshSession = vi.fn();
    const auth = {
      accessToken: () => null,
      clearAfterAuthenticationFailure: vi.fn(),
      refreshSession,
    } as unknown as AuthStateService;
    const run = runInterceptor(auth, new HttpRequest('POST', '/api/v1/auth/refresh'), [
      throwError(() => new HttpErrorResponse({ status: 401, statusText: 'Unauthorized' })),
    ]);

    run.result$.subscribe({ error: () => undefined });

    expect(refreshSession).not.toHaveBeenCalled();
    expect(run.handledRequests).toHaveLength(1);
  });

  it('clears auth state when refresh fails', () => {
    const clearAfterAuthenticationFailure = vi.fn();
    const auth = {
      accessToken: () => 'expired-token',
      clearAfterAuthenticationFailure,
      refreshSession: vi
        .fn()
        .mockReturnValue(
          throwError(() => new HttpErrorResponse({ status: 401, statusText: 'Unauthorized' })),
        ),
    } as unknown as AuthStateService;
    const run = runInterceptor(auth, new HttpRequest('GET', '/api/v1/auth/me'), [
      throwError(() => new HttpErrorResponse({ status: 401, statusText: 'Unauthorized' })),
    ]);

    run.result$.subscribe({ error: () => undefined });

    expect(clearAfterAuthenticationFailure).toHaveBeenCalledTimes(1);
  });
});
