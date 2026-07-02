import type { Routes } from '@angular/router';

export const adminAppRoutes: Routes = [
  {
    path: '',
    loadChildren: () => import('@petradar/frontend/auth').then((module) => module.AUTH_ROUTES),
  },
  {
    path: '',
    loadChildren: () => import('@petradar/frontend/admin').then((module) => module.ADMIN_ROUTES),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
