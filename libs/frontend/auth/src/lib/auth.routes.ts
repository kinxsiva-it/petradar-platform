import type { Routes } from '@angular/router';

import { PublicLayoutComponent } from '@petradar/frontend/core';

export const AUTH_ROUTES: Routes = [
  {
    path: '',
    component: PublicLayoutComponent,
    children: [
      {
        path: 'login',
        loadComponent: () =>
          import('./pages/login-page/login-page.component.js').then(
            (module) => module.LoginPageComponent,
          ),
      },
      {
        path: 'register',
        loadComponent: () =>
          import('./pages/register-page/register-page.component.js').then(
            (module) => module.RegisterPageComponent,
          ),
      },
    ],
  },
];

