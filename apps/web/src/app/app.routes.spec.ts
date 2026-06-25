import { appRoutes } from './app.routes.js';

describe('appRoutes', () => {
  it('defines public, dashboard, showcase, and fallback routes', () => {
    expect(appRoutes.map((route) => route.path)).toEqual(['', 'dashboard', 'showcase', '**']);
  });
});
