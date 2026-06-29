import type { Routes } from '@angular/router';

export const MAP_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/community-map-page/community-map-page.component.js').then(
        (module) => module.CommunityMapPageComponent,
      ),
  },
];
