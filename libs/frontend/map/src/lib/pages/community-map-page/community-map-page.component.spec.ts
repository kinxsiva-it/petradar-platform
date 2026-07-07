import { Injector, runInInjectionContext } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

import { SightingsApiService } from '@petradar/frontend/sightings';

import { CommunityMapPageComponent } from './community-map-page.component.js';

describe('CommunityMapPageComponent nearby loading', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('uses browser geolocation as public nearby API filters without exposing exact markers', async () => {
    const listPublic = vi.fn().mockReturnValue(
      of({
        items: [],
        page: 1,
        pageSize: 50,
        total: 0,
        totalPages: 0,
      }),
    );
    const component = createComponent(listPublic);
    await flushPromises();

    const getCurrentPosition = vi.fn<Geolocation['getCurrentPosition']>((success) => {
      success({
        coords: {
          accuracy: 10,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          latitude: 13.7563456,
          longitude: 100.5018765,
          speed: null,
        },
        timestamp: Date.now(),
      });
    });
    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: { getCurrentPosition },
    });

    component.runNearMe();
    await flushPromises();

    expect(component.nearMeState()).toBe('ready');
    expect(listPublic).toHaveBeenLastCalledWith(
      expect.objectContaining({
        latitude: 13.756346,
        longitude: 100.501876,
        radiusMeters: 5000,
      }),
    );
  });
});

function createComponent(listPublic: ReturnType<typeof vi.fn>): CommunityMapPageComponent {
  const injector = Injector.create({
    providers: [
      CommunityMapPageComponent,
      {
        provide: SightingsApiService,
        useValue: { listPublic },
      },
      {
        provide: ActivatedRoute,
        useValue: {
          snapshot: {
            queryParamMap: {
              get: () => null,
            },
          },
        },
      },
    ],
  });

  return runInInjectionContext(injector, () => injector.get(CommunityMapPageComponent));
}

async function flushPromises(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}
