import type { Routes } from '@angular/router';
import { provideTanStackQuery, QueryClient } from '@tanstack/angular-query-experimental';

import { VolunteerLayoutComponent } from '@petradar/frontend/core';

export const VOLUNTEER_ROUTES: Routes = [
  {
    path: '',
    component: VolunteerLayoutComponent,
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/volunteer-dashboard-page/volunteer-dashboard-page.component.js').then(
            (module) => module.VolunteerDashboardPageComponent,
          ),
        pathMatch: 'full',
      },
      {
        path: 'rescue-cases',
        loadChildren: () =>
          import('@petradar/frontend/rescue-cases').then(
            (module) => module.RESCUE_CASE_ROUTES,
          ),
        providers: [provideTanStackQuery(new QueryClient())],
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./pages/volunteer-profile-page/volunteer-profile-page.component.js').then(
            (module) => module.VolunteerProfilePageComponent,
          ),
      },
    ],
  },
];
