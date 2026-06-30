import { Injector, runInInjectionContext } from '@angular/core';
import { of } from 'rxjs';

import { SightingsApiService } from '../../data-access/sightings-api.service.js';
import type { OwnerSightingApiResponse } from '../../data-access/sightings-api.models.js';
import { MyReportsPageComponent } from './my-reports-page.component.js';

describe('MyReportsPageComponent API integration', () => {
  it('loads authenticated owner reports from the sightings API', async () => {
    const mySightings = vi
      .fn()
      .mockReturnValue(
        of({ items: [ownerResponse()], page: 1, pageSize: 50, total: 1, totalPages: 1 }),
      );
    const component = createComponent({ mySightings });
    await Promise.resolve();

    expect(mySightings).toHaveBeenCalledWith({ pageSize: 50 });
    expect(component.reports()).toHaveLength(1);
    expect(component.reports()[0]?.editable).toBe(true);
    expect(component.uiState()).toBe('default');
  });

  it('updates editable reports through the API and refreshes the list', async () => {
    const mySightings = vi
      .fn()
      .mockReturnValue(
        of({ items: [ownerResponse()], page: 1, pageSize: 50, total: 1, totalPages: 1 }),
      );
    const update = vi.fn().mockReturnValue(of(ownerResponse({ color: 'Black' })));
    const component = createComponent({ mySightings, update });
    await Promise.resolve();
    component.editingReport.set(component.reports()[0] ?? null);

    await component.saveEdit({
      changes: { color: 'Black', description: 'Updated note', pattern: 'Solid' },
      id: ownerResponse().id,
    });

    expect(update).toHaveBeenCalledWith(ownerResponse().id, {
      color: 'Black',
      description: 'Updated note',
      pattern: 'Solid',
    });
    expect(mySightings).toHaveBeenCalledTimes(2);
    expect(component.editingReport()).toBeNull();
  });
});

function createComponent(overrides: {
  mySightings?: ReturnType<typeof vi.fn>;
  update?: ReturnType<typeof vi.fn>;
}): MyReportsPageComponent {
  const injector = Injector.create({
    providers: [
      MyReportsPageComponent,
      {
        provide: SightingsApiService,
        useValue: {
          mySightings:
            overrides.mySightings ??
            vi
              .fn()
              .mockReturnValue(of({ items: [], page: 1, pageSize: 50, total: 0, totalPages: 0 })),
          update: overrides.update ?? vi.fn().mockReturnValue(of(ownerResponse())),
        },
      },
    ],
  });

  return runInInjectionContext(injector, () => injector.get(MyReportsPageComponent));
}

function ownerResponse(
  overrides: Partial<OwnerSightingApiResponse> = {},
): OwnerSightingApiResponse {
  return {
    animalCount: 1,
    collarStatus: 'NO_COLLAR',
    color: 'White',
    condition: 'INJURED',
    createdAt: '2026-06-30T00:00:00.000Z',
    description: 'Limping near the roadside.',
    editable: true,
    exactLocation: { latitude: 13.7563, longitude: 100.5018 },
    id: '11111111-1111-4111-8111-111111111111',
    lifecycleStatus: 'SIGHTING',
    pattern: 'Solid',
    publicLocation: { latitude: 13.751, longitude: 100.502, radiusMeters: 300 },
    seenAt: '2026-06-30T01:00:00.000Z',
    species: 'DOG',
    updatedAt: '2026-06-30T02:00:00.000Z',
    urgency: 'HIGH',
    verificationStatus: 'PENDING',
    ...overrides,
  };
}
