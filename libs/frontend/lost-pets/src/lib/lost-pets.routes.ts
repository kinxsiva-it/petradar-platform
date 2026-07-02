import type { Routes } from '@angular/router';

import { authGuard, AuthenticatedLayoutComponent, PublicLayoutComponent } from '@petradar/frontend/core';

export const LOST_PET_ROUTES: Routes = [
  {
    path: 'new',
    canActivate: [authGuard],
    component: AuthenticatedLayoutComponent,
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/create-lost-pet-page/create-lost-pet-page.component.js').then(
            (module) => module.CreateLostPetPageComponent,
          ),
      },
    ],
  },
  {
    path: ':id/edit',
    canActivate: [authGuard],
    component: AuthenticatedLayoutComponent,
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/create-lost-pet-page/create-lost-pet-page.component.js').then(
            (module) => module.CreateLostPetPageComponent,
          ),
      },
    ],
  },
  {
    path: '',
    component: PublicLayoutComponent,
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/lost-pet-list-page/lost-pet-list-page.component.js').then(
            (module) => module.LostPetListPageComponent,
          ),
        pathMatch: 'full',
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./pages/lost-pet-detail-page/lost-pet-detail-page.component.js').then(
            (module) => module.LostPetDetailPageComponent,
          ),
      },
    ],
  },
];

export const MY_LOST_PET_ROUTES: Routes = [
  {
    path: '',
    component: AuthenticatedLayoutComponent,
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/my-lost-pets-page/my-lost-pets-page.component.js').then(
            (module) => module.MyLostPetsPageComponent,
          ),
      },
      {
        path: ':id/matches',
        loadComponent: () =>
          import('./pages/possible-matches-page/possible-matches-page.component.js').then(
            (module) => module.PossibleMatchesPageComponent,
          ),
      },
    ],
  },
];
