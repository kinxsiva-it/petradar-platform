import type { Routes } from '@angular/router';

import { AuthenticatedLayoutComponent } from '@petradar/frontend/core';

export const NOTIFICATIONS_ROUTES: Routes = [
  {
    path: '',
    component: AuthenticatedLayoutComponent,
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/notifications-page/notifications-page.component.js').then(
            (module) => module.NotificationsPageComponent,
          ),
      },
    ],
  },
];
