import { InjectionToken } from '@angular/core';

export const DEFAULT_AUTH_REDIRECT_URL = '/my/reports';

export const AUTH_DEFAULT_REDIRECT_URL = new InjectionToken<string>(
  'PetRadar authenticated default redirect URL',
  {
    factory: () => DEFAULT_AUTH_REDIRECT_URL,
    providedIn: 'root',
  },
);
