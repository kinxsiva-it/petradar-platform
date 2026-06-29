import type { Routes } from '@angular/router';

import { AuthenticatedLayoutComponent } from '@petradar/frontend/core';

export const REPORT_ANIMAL_ROUTES: Routes = [
  {
    path: '',
    component: AuthenticatedLayoutComponent,
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/report-animal-page/report-animal-page.component.js').then(
            (module) => module.ReportAnimalPageComponent,
          ),
      },
    ],
  },
];
