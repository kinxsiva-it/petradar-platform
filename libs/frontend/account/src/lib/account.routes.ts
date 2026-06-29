import type { Routes } from '@angular/router';

import { AuthenticatedLayoutComponent, PublicLayoutComponent } from '@petradar/frontend/core';

export const PROFILE_ROUTES: Routes = [
  {
    path: '',
    component: AuthenticatedLayoutComponent,
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/profile-page/profile-page.component.js').then(
            (module) => module.ProfilePageComponent,
          ),
      },
    ],
  },
];

export const SETTINGS_ROUTES: Routes = [
  {
    path: '',
    component: AuthenticatedLayoutComponent,
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/settings-page/settings-page.component.js').then(
            (module) => module.SettingsPageComponent,
          ),
      },
    ],
  },
];

export const COMMUNITY_GUIDELINES_ROUTES: Routes = [
  {
    path: '',
    component: PublicLayoutComponent,
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/community-guidelines-page/community-guidelines-page.component.js').then(
            (module) => module.CommunityGuidelinesPageComponent,
          ),
      },
    ],
  },
];
