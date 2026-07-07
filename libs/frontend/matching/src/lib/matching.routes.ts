import type { Routes } from '@angular/router';

import { AuthenticatedLayoutComponent } from '@petradar/frontend/core';

import { MatchDetailPageComponent } from './pages/match-detail-page/match-detail-page.component';
import { MatchOverviewPageComponent } from './pages/match-overview-page/match-overview-page.component';

export const MATCHING_ROUTES: Routes = [
  {
    path: '',
    component: AuthenticatedLayoutComponent,
    children: [
      {
        path: '',
        loadComponent: () => MatchOverviewPageComponent,
        pathMatch: 'full',
      },
      {
        path: ':id',
        loadComponent: () => MatchDetailPageComponent,
      },
    ],
  },
];
