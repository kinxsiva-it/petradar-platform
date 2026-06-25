import type { Routes } from '@angular/router';

export const appRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/public-home.page.js').then((module) => module.PublicHomePage),
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./pages/dashboard-placeholder.page.js').then(
        (module) => module.DashboardPlaceholderPage,
      ),
  },
  {
    path: 'showcase',
    loadComponent: () =>
      import('./pages/component-showcase.page.js').then((module) => module.ComponentShowcasePage),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
