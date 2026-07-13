import { authGuard, roleGuard } from '@petradar/frontend/core';

import { appRoutes } from './app.routes.js';

describe('appRoutes', () => {
  it('keeps root routing feature-first without the old showcase route', () => {
    const shell = appRoutes.find((route) => route.path === '');
    const paths = shell?.children?.map((route) => route.path) ?? [];

    expect(paths).toContain('');
    expect(paths).toContain('map');
    expect(paths).toContain('volunteer');
    expect(paths).not.toContain('admin');
    expect(paths).not.toContain('showcase');
    expect(paths.at(-1)).toBe('**');
  });

  it('protects authenticated and volunteer route groups inside the user app shell', () => {
    const shell = appRoutes.find((route) => route.path === '');
    const children = shell?.children ?? [];
    const reportAnimal = children.find((route) => route.path === 'report-animal');
    const myReports = children.find((route) => route.path === 'my/reports');
    const volunteer = children.find((route) => route.path === 'volunteer');

    expect(reportAnimal?.canActivate).toContain(authGuard);
    expect(myReports?.canActivate).toContain(authGuard);
    expect(volunteer?.canActivate).toContain(roleGuard);
    expect(volunteer?.data?.['roles']).toEqual(['VOLUNTEER']);
    expect(volunteer?.data?.['forbiddenRedirectUrl']).toBe('/map');
  });
});
