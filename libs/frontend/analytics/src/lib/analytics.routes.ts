import type { Routes } from '@angular/router';

export const ANALYTICS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/analytics-dashboard-page/analytics-dashboard-page.component.js').then(
        (module) => module.AnalyticsDashboardPageComponent,
      ),
  },
];

export const HEATMAP_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/community-heatmap-page/community-heatmap-page.component.js').then(
        (module) => module.CommunityHeatmapPageComponent,
      ),
  },
];

export const EXECUTIVE_REPORT_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/executive-reports-page/executive-reports-page.component.js').then(
        (module) => module.ExecutiveReportsPageComponent,
      ),
  },
];
