import type { Routes } from '@angular/router';

import { AuthenticatedLayoutComponent } from '@petradar/frontend/core';

export const MATCHING_ROUTES: Routes = [
  {
    path: '',
    component: AuthenticatedLayoutComponent,
    children: [
      {
        path: ':id',
        loadComponent: () =>
          import('./pages/match-detail-page/match-detail-page.component.js').then(
            (module) => module.MatchDetailPageComponent,
          ),
      },
    ],
  },
];
