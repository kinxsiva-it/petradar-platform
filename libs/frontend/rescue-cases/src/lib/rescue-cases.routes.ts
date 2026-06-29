import type { Routes } from '@angular/router';

export const RESCUE_CASE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/rescue-case-list-page/rescue-case-list-page.component.js').then(
        (module) => module.RescueCaseListPageComponent,
      ),
    pathMatch: 'full',
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./pages/rescue-case-detail-page/rescue-case-detail-page.component.js').then(
        (module) => module.RescueCaseDetailPageComponent,
      ),
  },
];
