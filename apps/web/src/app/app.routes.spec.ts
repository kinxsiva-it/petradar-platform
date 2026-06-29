import { authGuard, roleGuard } from '@petradar/frontend/core';

import { appRoutes } from './app.routes.js';

describe('appRoutes', () => {
  it('keeps root routing feature-first without the old showcase route', () => {
    const paths = appRoutes.map((route) => route.path);

    expect(paths).toContain('');
    expect(paths).toContain('map');
    expect(paths).toContain('admin');
    expect(paths).toContain('volunteer');
    expect(paths).not.toContain('showcase');
    expect(paths.at(-1)).toBe('**');
  });

  it('protects authenticated, volunteer, and admin route groups', () => {
    const reportAnimal = appRoutes.find((route) => route.path === 'report-animal');
    const myReports = appRoutes.find((route) => route.path === 'my/reports');
    const volunteer = appRoutes.find((route) => route.path === 'volunteer');
    const admin = appRoutes.find((route) => route.path === 'admin');

    expect(reportAnimal?.canActivate).toContain(authGuard);
    expect(myReports?.canActivate).toContain(authGuard);
    expect(volunteer?.canActivate).toContain(roleGuard);
    expect(volunteer?.data?.['roles']).toEqual(['VOLUNTEER', 'ADMIN']);
    expect(admin?.canActivate).toContain(roleGuard);
    expect(admin?.data?.['roles']).toEqual(['ADMIN']);
  });
});
