import type { Routes } from '@angular/router';

import { roleGuard } from '@petradar/frontend/core';

import { AdminCmsShellComponent } from './layout/admin-cms-shell.component.js';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    canActivate: [roleGuard],
    component: AdminCmsShellComponent,
    data: {
      forbiddenRedirectUrl: '/login?access=denied',
      logoutOnForbidden: true,
      roles: ['ADMIN'],
    },
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./pages/admin-cms-dashboard-page/admin-cms-dashboard-page.component.js').then(
            (module) => module.AdminCmsDashboardPageComponent,
          ),
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
        loadComponent: () =>
          import('./pages/admin-volunteers-page/admin-volunteers-page.component.js').then(
            (module) => module.AdminVolunteersPageComponent,
          ),
      },
      {
        path: 'match-review',
        loadComponent: () =>
          import('./pages/admin-match-review-page/admin-match-review-page.component.js').then(
            (module) => module.AdminMatchReviewPageComponent,
          ),
      },
      {
        path: 'match-review/:id',
        loadComponent: () =>
          import('./pages/admin-match-detail-page/admin-match-detail-page.component.js').then(
            (module) => module.AdminMatchDetailPageComponent,
          ),
      },
      {
        path: 'audit-logs',
        loadComponent: () =>
          import('./pages/admin-audit-logs-page/admin-audit-logs-page.component.js').then(
            (module) => module.AdminAuditLogsPageComponent,
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
