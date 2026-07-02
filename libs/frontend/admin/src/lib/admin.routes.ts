import type { Routes } from '@angular/router';

import { roleGuard } from '@petradar/frontend/core';

import { AdminCmsShellComponent } from './layout/admin-cms-shell.component.js';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    canActivate: [roleGuard],
    component: AdminCmsShellComponent,
    data: { roles: ['ADMIN'] },
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/admin-cms-dashboard-page/admin-cms-dashboard-page.component.js').then(
            (module) => module.AdminCmsDashboardPageComponent,
          ),
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        redirectTo: '',
        pathMatch: 'full',
      },
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
        path: 'volunteers',
        data: {
          description:
            'Volunteer directory and verification management will be implemented in a focused CMS pass.',
          title: 'Volunteer Management',
        },
        loadComponent: () =>
          import('./pages/admin-cms-placeholder-page/admin-cms-placeholder-page.component.js').then(
            (module) => module.AdminCmsPlaceholderPageComponent,
          ),
      },
      {
        path: 'match-review',
        data: {
          description:
            'Lost pet match review will be connected to matching moderation APIs in a focused CMS pass.',
          title: 'Lost Pet Match Review',
        },
        loadComponent: () =>
          import('./pages/admin-cms-placeholder-page/admin-cms-placeholder-page.component.js').then(
            (module) => module.AdminCmsPlaceholderPageComponent,
          ),
      },
      {
        path: 'audit-logs',
        data: {
          description:
            'Audit log browsing will be implemented after the CMS shell and route structure are established.',
          title: 'Audit Logs',
        },
        loadComponent: () =>
          import('./pages/admin-cms-placeholder-page/admin-cms-placeholder-page.component.js').then(
            (module) => module.AdminCmsPlaceholderPageComponent,
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
