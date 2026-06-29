import {
  HttpContextToken,
  HttpErrorResponse,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';

import { API_BASE_PATH } from './api-base-path.js';
import { AuthStateService } from './auth-state.service.js';

const retryAttempted = new HttpContextToken<boolean>(() => false);

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthStateService);
  const apiBasePath = inject(API_BASE_PATH);

  if (!isApiRequest(request, apiBasePath)) {
    return next(request);
  }

  const requestWithToken = shouldAttachAccessToken(request, apiBasePath)
    ? attachAccessToken(request, auth.accessToken())
    : request;

  return next(requestWithToken).pipe(
    catchError((error: unknown) => {
      if (!shouldRefresh(error, requestWithToken, apiBasePath)) {
        return throwError(() => error);
      }

      return auth.refreshSession().pipe(
        switchMap(() => next(attachAccessToken(markRetried(request), auth.accessToken()))),
        catchError((refreshError: unknown) => {
          auth.clearAfterAuthenticationFailure();
          return throwError(() => refreshError);
        }),
      );
    }),
  );
};

function isApiRequest(request: HttpRequest<unknown>, apiBasePath: string): boolean {
  return request.url.startsWith(apiBasePath);
}

function shouldAttachAccessToken(request: HttpRequest<unknown>, apiBasePath: string): boolean {
  return !isPublicAuthRequest(request, apiBasePath);
}

function isPublicAuthRequest(request: HttpRequest<unknown>, apiBasePath: string): boolean {
  return [
    `${apiBasePath}/auth/login`,
    `${apiBasePath}/auth/register`,
    `${apiBasePath}/auth/refresh`,
    `${apiBasePath}/auth/logout`,
  ].includes(request.url);
}

function shouldRefresh(
  error: unknown,
  request: HttpRequest<unknown>,
  apiBasePath: string,
): boolean {
  return (
    error instanceof HttpErrorResponse &&
    error.status === 401 &&
    !request.context.get(retryAttempted) &&
    !request.url.startsWith(`${apiBasePath}/auth/refresh`)
  );
}

function attachAccessToken(request: HttpRequest<unknown>, token: string | null): HttpRequest<unknown> {
  if (!token) {
    return request;
  }

  return request.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`,
    },
  });
}

function markRetried(request: HttpRequest<unknown>): HttpRequest<unknown> {
  return request.clone({
    context: request.context.set(retryAttempted, true),
  });
}
