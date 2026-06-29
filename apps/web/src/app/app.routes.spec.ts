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
});
