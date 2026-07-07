import { MATCHING_ROUTES } from './matching.routes';
import { MatchDetailPageComponent } from './pages/match-detail-page/match-detail-page.component';
import { MatchOverviewPageComponent } from './pages/match-overview-page/match-overview-page.component';

describe('MATCHING_ROUTES', () => {
  it('renders an overview page for the empty matches route', async () => {
    const matchingRoute = MATCHING_ROUTES[0];
    const emptyChild = matchingRoute?.children?.find((route) => route.path === '');

    expect(emptyChild?.pathMatch).toBe('full');
    expect(typeof emptyChild?.loadComponent).toBe('function');
    if (!emptyChild?.loadComponent) {
      throw new Error('Expected /matches to lazy-load an overview component.');
    }

    await expect(Promise.resolve(emptyChild.loadComponent())).resolves.toBe(MatchOverviewPageComponent);
  });

  it('keeps match detail routes available', async () => {
    const matchingRoute = MATCHING_ROUTES[0];
    const detailChild = matchingRoute?.children?.find((route) => route.path === ':id');

    expect(typeof detailChild?.loadComponent).toBe('function');
    if (!detailChild?.loadComponent) {
      throw new Error('Expected /matches/:id to lazy-load a detail component.');
    }

    await expect(Promise.resolve(detailChild.loadComponent())).resolves.toBe(MatchDetailPageComponent);
  });
});
