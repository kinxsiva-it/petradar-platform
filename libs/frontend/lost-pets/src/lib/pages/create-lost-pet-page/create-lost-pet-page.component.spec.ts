import { Injector, runInInjectionContext } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import type { PrivateLocationSelection } from '@petradar/frontend/map';
import {
  type CreateLostPetRequest,
  type LostPetApiResponse,
  LostPetsApiService,
} from '../../data-access/index.js';
import { CreateLostPetPageComponent } from './create-lost-pet-page.component.js';

describe('CreateLostPetPageComponent location flow', () => {
  it('submits the selected private pin coordinates to the Lost Pet API', async () => {
    const createLostPet = vi.fn().mockReturnValue(of(lostPetResponse()));
    const navigateByUrl = vi.fn().mockResolvedValue(true);
    const component = createComponent({
      createLostPet,
      navigateByUrl,
    });

    fillValidLostPet(component);
    component.moveSelectedLocation(0.012345, -0.023456);
    await component.submit();

    expect(createLostPet).toHaveBeenCalledTimes(1);
    expect(createRequest(createLostPet)).toMatchObject({
      latitude: 13.768645,
      longitude: 100.478344,
    });
    expect(navigateByUrl).toHaveBeenCalledWith('/lost-pets/lost-pet-id');
  });

  it('uses the latitude and longitude fields as the picker source of truth', () => {
    const component = createComponent({});

    component.latitude = 13.767484;
    component.longitude = 100.512869;

    expect(component.selectedLocationLabel()).toBe('13.767484, 100.512869');
  });

  it('starts create mode without mock pet details and blocks invalid submission', async () => {
    const createLostPet = vi.fn();
    const navigateByUrl = vi.fn();
    const component = createComponent({ createLostPet, navigateByUrl });

    expect(component.petName).toBe('');
    expect(component.species).toBe('');
    expect(component.breed).toBe('');
    expect(component.color).toBe('');
    expect(component.description).toBe('');
    expect(component.lastSeenAt).toBe('');
    expect(component.contactDetail).toBe('');
    expect(component.locationSelected()).toBe(false);

    await component.submit();

    expect(createLostPet).not.toHaveBeenCalled();
    expect(navigateByUrl).not.toHaveBeenCalled();
    expect(component.submitError()).toContain('Enter the pet name');
  });

  it('shows API errors without navigating as if the lost pet was saved', async () => {
    const createLostPet = vi.fn().mockReturnValue(throwError(() => new Error('network')));
    const navigateByUrl = vi.fn();
    const component = createComponent({ createLostPet, navigateByUrl });
    fillValidLostPet(component);

    await component.submit();

    expect(component.petName).toBe('Milo');
    expect(component.submitError()).toContain('Lost-pet post could not be saved');
    expect(navigateByUrl).not.toHaveBeenCalled();
  });

  it('moves the same private pin source of truth from the shared picker selection', () => {
    const component = createComponent({});
    const selection: PrivateLocationSelection = {
      label: 'Siam Paragon',
      latitude: 13.746562,
      longitude: 100.534799,
      source: 'google-place',
    };

    component.selectPrivateLocation(selection);

    expect(component.latitude).toBe(13.746562);
    expect(component.longitude).toBe(100.534799);
    expect(component.selectedLocationLabel()).toBe('13.746562, 100.534799');
    expect(component.approximateLastSeenLabel).toBe('Siam Paragon');
  });

  it('loads exact owner coordinates back into the edit form instead of public approximate coordinates', async () => {
    const component = createComponent({
      editingId: 'lost-pet-id',
      getMyLostPet: vi.fn().mockReturnValue(
        of(
          lostPetResponse({
            exactLocation: { latitude: 12.345678, longitude: 98.765432 },
            publicLocation: { latitude: 12.3, longitude: 98.7, radiusMeters: 300 },
          }),
        ),
      ),
    });

    await flushPromises();

    expect(component.latitude).toBe(12.345678);
    expect(component.longitude).toBe(98.765432);
    expect(component.locationSelected()).toBe(true);
  });
});

function fillValidLostPet(component: CreateLostPetPageComponent): void {
  component.petName = 'Milo';
  component.species = 'CAT';
  component.color = 'Orange';
  component.pattern = 'Tabby';
  component.collarDescription = 'Red collar';
  component.description = 'Friendly but shy.';
  component.lastSeenAt = '2026-07-06T01:00';
  component.contactPreference = 'Email';
  component.contactDetail = 'owner@example.com';
  component.moveSelectedLocation(0, 0);
}

function createComponent(overrides: {
  createLostPet?: ReturnType<typeof vi.fn>;
  editingId?: string | null;
  getMyLostPet?: ReturnType<typeof vi.fn>;
  navigateByUrl?: ReturnType<typeof vi.fn>;
  updateLostPet?: ReturnType<typeof vi.fn>;
}): CreateLostPetPageComponent {
  const injector = Injector.create({
    providers: [
      CreateLostPetPageComponent,
      {
        provide: LostPetsApiService,
        useValue: {
          createLostPet: overrides.createLostPet ?? vi.fn().mockReturnValue(of(lostPetResponse())),
          getMyLostPet: overrides.getMyLostPet ?? vi.fn().mockReturnValue(of(lostPetResponse())),
          updateLostPet: overrides.updateLostPet ?? vi.fn().mockReturnValue(of(lostPetResponse())),
        },
      },
      {
        provide: Router,
        useValue: { navigateByUrl: overrides.navigateByUrl ?? vi.fn().mockResolvedValue(true) },
      },
      {
        provide: ActivatedRoute,
        useValue: {
          snapshot: {
            paramMap: {
              get: () => overrides.editingId ?? null,
            },
          },
        },
      },
    ],
  });

  return runInInjectionContext(injector, () => injector.get(CreateLostPetPageComponent));
}

function lostPetResponse(overrides: Partial<LostPetApiResponse> = {}): LostPetApiResponse {
  return {
    age: '2 years',
    breed: 'Domestic Shorthair',
    collarDescription: 'Red collar',
    color: 'Orange',
    contactMethod: 'Email: owner@example.com',
    createdAt: '2026-07-06T00:00:00.000Z',
    description: 'Friendly but shy.',
    id: 'lost-pet-id',
    lastSeenAt: '2026-07-06T01:00:00.000Z',
    microchipped: true,
    name: 'Milo',
    ownerId: 'owner-id',
    pattern: 'Tabby',
    photoUrls: [],
    publicLocation: { latitude: 13.751, longitude: 100.502, radiusMeters: 300 },
    rewardCents: null,
    sex: 'MALE',
    species: 'CAT',
    status: 'LOST',
    updatedAt: '2026-07-06T02:00:00.000Z',
    ...overrides,
  };
}

function createRequest(createLostPet: ReturnType<typeof vi.fn>): CreateLostPetRequest {
  const calls = createLostPet.mock.calls as [CreateLostPetRequest][];
  const request = calls[0]?.[0];
  if (!request) {
    throw new Error('Expected a create Lost Pet request.');
  }

  return request;
}

async function flushPromises(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}
