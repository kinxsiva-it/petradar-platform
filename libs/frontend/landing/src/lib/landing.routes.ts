import type { Routes } from '@angular/router';

import { PublicLayoutComponent } from '@petradar/frontend/core';

export const LANDING_ROUTES: Routes = [
  {
    path: '',
    component: PublicLayoutComponent,
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/landing-page/landing-page.component.js').then(
            (module) => module.LandingPageComponent,
          ),
      },
    ],
  },
];

