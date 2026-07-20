import type { Routes } from '@angular/router';

import { AppShellComponent, authGuard, roleGuard } from '@petradar/frontend/core';

export const appRoutes: Routes = [
  {
    path: '',
    component: AppShellComponent,
    children: [
      {
        path: '',
        loadChildren: () =>
          import('@petradar/frontend/landing').then((module) => module.LANDING_ROUTES),
        pathMatch: 'full',
      },
      {
        path: '',
        loadChildren: () => import('@petradar/frontend/auth').then((module) => module.AUTH_ROUTES),
      },
      {
        path: 'map',
        loadChildren: () => import('@petradar/frontend/map').then((module) => module.MAP_ROUTES),
      },
      {
        path: 'sightings',
        loadChildren: () =>
          import('@petradar/frontend/sightings').then((module) => module.SIGHTINGS_ROUTES),
      },
      {
        path: 'lost-pets',
        loadChildren: () =>
          import('@petradar/frontend/lost-pets').then((module) => module.LOST_PET_ROUTES),
      },
      {
        path: 'report-animal',
        canActivate: [authGuard],
        loadChildren: () =>
          import('@petradar/frontend/report-animal').then(
            (module) => module.REPORT_ANIMAL_ROUTES,
          ),
      },
      {
        path: 'my/reports',
        canActivate: [authGuard],
        loadChildren: () =>
          import('@petradar/frontend/sightings').then((module) => module.MY_REPORTS_ROUTES),
      },
      {
        path: 'my/lost-pets',
        canActivate: [authGuard],
        loadChildren: () =>
          import('@petradar/frontend/lost-pets').then((module) => module.MY_LOST_PET_ROUTES),
      },
      {
        path: 'matches',
        canActivate: [authGuard],
        loadChildren: () =>
          import('@petradar/frontend/matching').then((module) => module.MATCHING_ROUTES),
      },
      {
        path: 'notifications',
        canActivate: [authGuard],
        loadChildren: () =>
          import('@petradar/frontend/notifications').then((module) => module.NOTIFICATIONS_ROUTES),
      },
      {
        path: 'profile',
        canActivate: [authGuard],
        loadChildren: () =>
          import('@petradar/frontend/account').then((module) => module.PROFILE_ROUTES),
      },
      {
        path: 'settings',
        canActivate: [authGuard],
        loadChildren: () =>
          import('@petradar/frontend/account').then((module) => module.SETTINGS_ROUTES),
      },
      {
        path: 'community-guidelines',
        loadChildren: () =>
          import('@petradar/frontend/account').then(
            (module) => module.COMMUNITY_GUIDELINES_ROUTES,
          ),
      },
      {
        path: 'volunteer',
        canActivate: [roleGuard],
        data: { forbiddenRedirectUrl: '/map', roles: ['VOLUNTEER'] },
        loadChildren: () =>
          import('@petradar/frontend/volunteer').then((module) => module.VOLUNTEER_ROUTES),
      },
      {
        path: 'dashboard',
        redirectTo: '',
        pathMatch: 'full',
      },
      {
        path: '**',
        redirectTo: '',
      },
    ],
  },
];
