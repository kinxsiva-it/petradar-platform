import { InjectionToken } from '@angular/core';

export const API_BASE_PATH = new InjectionToken<string>('PetRadar API base path', {
  factory: () => '/api/v1',
  providedIn: 'root',
});
