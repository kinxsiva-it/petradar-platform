import type { Routes } from '@angular/router';

import { AdminLayoutComponent } from './layout/admin-layout.component.js';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    component: AdminLayoutComponent,
    children: [
      { path: '', redirectTo: 'verification', pathMatch: 'full' },
      {
        path: 'verification',
        loadComponent: () =>
          import('./pages/verification-queue-page/verification-queue-page.component.js').then(
            (module) => module.VerificationQueuePageComponent,
          ),
      },
      {
        path: 'verification/:id',
        loadComponent: () =>
          import('./pages/verification-detail-page/verification-detail-page.component.js').then(
            (module) => module.VerificationDetailPageComponent,
          ),
      },
      {
        path: 'duplicates/:id',
        loadComponent: () =>
          import('./pages/duplicate-review-page/duplicate-review-page.component.js').then(
            (module) => module.DuplicateReviewPageComponent,
          ),
      },
      {
        path: 'rescue-cases',
        loadComponent: () =>
          import('@petradar/frontend/rescue-cases').then(
            (module) => module.RescueCaseListPageComponent,
          ),
      },
      {
        path: 'rescue-cases/:id',
        loadComponent: () =>
          import('@petradar/frontend/rescue-cases').then(
            (module) => module.RescueCaseDetailPageComponent,
          ),
      },
      {
        path: 'privacy',
        loadComponent: () =>
          import('./pages/privacy-control-page/privacy-control-page.component.js').then(
            (module) => module.PrivacyControlPageComponent,
          ),
      },
      {
        path: 'analytics',
        loadChildren: () =>
          import('@petradar/frontend/analytics').then((module) => module.ANALYTICS_ROUTES),
      },
      {
        path: 'heatmap',
        loadChildren: () =>
          import('@petradar/frontend/analytics').then((module) => module.HEATMAP_ROUTES),
      },
      {
        path: 'reports',
        loadChildren: () =>
          import('@petradar/frontend/analytics').then((module) => module.EXECUTIVE_REPORT_ROUTES),
      },
      {
        path: 'users',
        loadComponent: () =>
          import('./pages/admin-users-page/admin-users-page.component.js').then(
            (module) => module.AdminUsersPageComponent,
          ),
      },
      {
        path: 'users/:id',
        loadComponent: () =>
          import('./pages/admin-user-detail-page/admin-user-detail-page.component.js').then(
            (module) => module.AdminUserDetailPageComponent,
          ),
      },
    ],
  },
];
