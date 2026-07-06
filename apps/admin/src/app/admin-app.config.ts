import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, inject, provideAppInitializer, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding, withInMemoryScrolling } from '@angular/router';
import { provideTanStackQuery, QueryClient } from '@tanstack/angular-query-experimental';

import { AUTH_DEFAULT_REDIRECT_URL, AuthStateService, authInterceptor } from '@petradar/frontend/core';

import { adminAppRoutes } from './admin-app.routes.js';

export const adminAppConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    { provide: AUTH_DEFAULT_REDIRECT_URL, useValue: '/dashboard' },
    provideHttpClient(withInterceptors([authInterceptor])),
    provideTanStackQuery(new QueryClient()),
    provideAppInitializer(() => inject(AuthStateService).initializeSession()),
    provideRouter(
      adminAppRoutes,
      withComponentInputBinding(),
      withInMemoryScrolling({ scrollPositionRestoration: 'enabled' }),
    ),
  ],
};
