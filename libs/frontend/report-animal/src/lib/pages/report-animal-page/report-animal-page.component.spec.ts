import { Injector, runInInjectionContext } from '@angular/core';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { SightingsApiService, type CreateSightingRequest } from '@petradar/frontend/sightings';

import { ReportAnimalPageComponent } from './report-animal-page.component.js';

describe('ReportAnimalPageComponent API submission', () => {
  it('submits the existing form as a safe create sighting request and navigates to My Reports', async () => {
    const create = vi.fn().mockReturnValue(
      of({
        animalCount: 1,
        collarStatus: 'NO_COLLAR',
        color: 'White',
        condition: 'NORMAL_STRAY',
        createdAt: '2026-06-30T00:00:00.000Z',
        editable: true,
        id: 'sighting-id',
        lifecycleStatus: 'SIGHTING',
        pattern: 'Solid white',
        publicLocation: { latitude: 13.751, longitude: 100.502, radiusMeters: 300 },
        seenAt: '2026-06-30T01:00:00.000Z',
        species: 'DOG',
        updatedAt: '2026-06-30T02:00:00.000Z',
        urgency: 'MEDIUM',
        verificationStatus: 'PENDING',
      }),
    );
    const navigateByUrl = vi.fn().mockResolvedValue(true);
    const component = createComponent(create, navigateByUrl);

    await component.submit();

    expect(create).toHaveBeenCalledTimes(1);
    const request = createRequest(create);
    expect(request.count).toBe(component.animalCount);
    expect(typeof request.latitude).toBe('number');
    expect(typeof request.longitude).toBe('number');
    expect(request.species).toBe('DOG');
    expect(request).not.toHaveProperty('reporterId');
    expect(request).not.toHaveProperty('publicLocation');
    expect(request).not.toHaveProperty('verificationStatus');
    expect(request).not.toHaveProperty('lifecycleStatus');
    expect(navigateByUrl).toHaveBeenCalledWith('/my/reports');
  });

  it('preserves form values after a failed submission', async () => {
    const create = vi.fn().mockReturnValue(throwError(() => new Error('network')));
    const navigateByUrl = vi.fn();
    const component = createComponent(create, navigateByUrl);
    component.color = 'Black';
    component.description = 'Still visible after failure.';

    await component.submit();

    expect(component.color).toBe('Black');
    expect(component.description).toBe('Still visible after failure.');
    expect(component.submitError()).toContain('could not be submitted');
    expect(navigateByUrl).not.toHaveBeenCalled();
  });
});

function createComponent(
  create: ReturnType<typeof vi.fn>,
  navigateByUrl: ReturnType<typeof vi.fn>,
): ReportAnimalPageComponent {
  const injector = Injector.create({
    providers: [
      ReportAnimalPageComponent,
      {
        provide: SightingsApiService,
        useValue: { create },
      },
      {
        provide: Router,
        useValue: { navigateByUrl },
      },
    ],
  });

  return runInInjectionContext(injector, () => injector.get(ReportAnimalPageComponent));
}

function createRequest(create: ReturnType<typeof vi.fn>): CreateSightingRequest {
  const calls = create.mock.calls as [CreateSightingRequest][];
  const request = calls[0]?.[0];
  if (!request) {
    throw new Error('Expected a create sighting request.');
  }

  return request;
}
