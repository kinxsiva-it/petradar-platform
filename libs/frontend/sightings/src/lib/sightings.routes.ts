import type { Routes } from '@angular/router';

import { AuthenticatedLayoutComponent, PublicLayoutComponent } from '@petradar/frontend/core';

export const SIGHTINGS_ROUTES: Routes = [
  {
    path: '',
    component: PublicLayoutComponent,
    children: [
      {
        path: '',
        redirectTo: '/map',
        pathMatch: 'full',
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./pages/sighting-detail-page/sighting-detail-page.component.js').then(
            (module) => module.SightingDetailPageComponent,
          ),
      },
    ],
  },
];

export const MY_REPORTS_ROUTES: Routes = [
  {
    path: '',
    component: AuthenticatedLayoutComponent,
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/my-reports-page/my-reports-page.component.js').then(
            (module) => module.MyReportsPageComponent,
          ),
      },
    ],
  },
];
