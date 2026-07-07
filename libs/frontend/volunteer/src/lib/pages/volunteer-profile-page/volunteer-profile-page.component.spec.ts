import { Injector, runInInjectionContext, signal } from '@angular/core';
import { of, throwError } from 'rxjs';

import { AuthStateService, type AuthUser } from '@petradar/frontend/core';
import {
  RescueCasesApiService,
  type RescueCaseApiResponse,
} from '@petradar/frontend/rescue-cases';

import { VolunteerProfilePageComponent } from './volunteer-profile-page.component';

describe('VolunteerProfilePageComponent', () => {
  it('loads authenticated volunteer identity and assigned rescue case activity from real services', async () => {
    const list = vi
      .fn()
      .mockReturnValue(
        of({ items: [rescueCaseResponse()], page: 1, pageSize: 50, total: 1, totalPages: 1 }),
      );
    const component = createComponent({ list });
    await flushPromises();

    expect(component.user()?.displayName).toBe('Volunteer Nicha');
    expect(component.initials()).toBe('VN');
    expect(list).toHaveBeenCalledWith({ pageSize: 50 });
    expect(component.cases()).toHaveLength(1);
    expect(component.activeCases()).toHaveLength(1);
    expect(component.completedCases()).toHaveLength(0);
    expect(component.urgentCases()).toHaveLength(1);
    expect(component.uiState()).toBe('default');
  });

  it('shows an empty state when the backend has no assigned rescue cases', async () => {
    const list = vi
      .fn()
      .mockReturnValue(of({ items: [], page: 1, pageSize: 50, total: 0, totalPages: 0 }));
    const component = createComponent({ list });
    await flushPromises();

    expect(component.cases()).toHaveLength(0);
    expect(component.uiState()).toBe('empty');
  });

  it('does not expose mock-only local profile mutation methods', () => {
    const component = createComponent({});

    expect('save' in component).toBe(false);
    expect('edit' in component).toBe(false);
    expect('availabilityChanged' in component).toBe(false);
  });

  it('reports backend load failures without falling back to mock profile data', async () => {
    const list = vi.fn().mockReturnValue(throwError(() => new Error('network unavailable')));
    const component = createComponent({ list });
    await flushPromises();

    expect(component.cases()).toHaveLength(0);
    expect(component.uiState()).toBe('error');
    expect(component.errorMessage()).toBe('Volunteer profile activity could not be loaded.');
  });
});

function createComponent(overrides: {
  list?: ReturnType<typeof vi.fn>;
}): VolunteerProfilePageComponent {
  const injector = Injector.create({
    providers: [
      VolunteerProfilePageComponent,
      {
        provide: AuthStateService,
        useValue: {
          user: signal<AuthUser | null>(authUser()),
        },
      },
      {
        provide: RescueCasesApiService,
        useValue: {
          list:
            overrides.list ??
            vi
              .fn()
              .mockReturnValue(of({ items: [], page: 1, pageSize: 50, total: 0, totalPages: 0 })),
        },
      },
    ],
  });

  return runInInjectionContext(injector, () => injector.get(VolunteerProfilePageComponent));
}

async function flushPromises(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

function authUser(): AuthUser {
  return {
    createdAt: '2026-07-01T00:00:00.000Z',
    displayName: 'Volunteer Nicha',
    email: 'volunteer@example.test',
    id: 'user-id',
    phone: '+66 02 000 0000',
    roles: ['VOLUNTEER'],
    status: 'ACTIVE',
    updatedAt: '2026-07-02T00:00:00.000Z',
    volunteerVerification: 'VERIFIED',
  };
}

function rescueCaseResponse(): RescueCaseApiResponse {
  return {
    assignedVolunteer: { displayName: 'Volunteer Nicha', id: 'user-id' },
    caseNumber: 'RC-2026-0001',
    closedAt: null,
    createdAt: '2026-07-01T00:00:00.000Z',
    createdById: 'admin-id',
    id: 'case-id',
    severity: 'HIGH',
    sighting: {
      condition: 'INJURED',
      id: 'sighting-id',
      publicLocation: {
        latitude: 13.75,
        longitude: 100.5,
        radiusMeters: 500,
      },
      species: 'DOG',
    },
    status: 'ASSIGNED',
    summary: 'Injured dog needs volunteer transport coordination.',
    updatedAt: '2026-07-01T01:00:00.000Z',
  };
}
