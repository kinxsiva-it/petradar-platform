import { SIGHTINGS_ROUTES } from './sightings.routes';

describe('SIGHTINGS_ROUTES', () => {
  it('redirects the empty public sightings route to the community map', () => {
    const publicRoute = SIGHTINGS_ROUTES[0];
    const emptyChild = publicRoute?.children?.find((route) => route.path === '');

    expect(emptyChild).toMatchObject({
      redirectTo: '/map',
      pathMatch: 'full',
    });
  });

  it('keeps public sighting detail routes available', () => {
    const publicRoute = SIGHTINGS_ROUTES[0];
    const detailChild = publicRoute?.children?.find((route) => route.path === ':id');

    expect(typeof detailChild?.loadComponent).toBe('function');
  });
});
