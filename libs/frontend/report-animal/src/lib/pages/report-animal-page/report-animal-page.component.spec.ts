import { Injector, runInInjectionContext } from '@angular/core';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import type { PrivateLocationSelection } from '@petradar/frontend/map';
import { SightingsApiService, type CreateSightingRequest } from '@petradar/frontend/sightings';

import { ReportAnimalPageComponent } from './report-animal-page.component.js';

describe('ReportAnimalPageComponent API submission', () => {
  it('uses the latitude and longitude fields as the preview and submission source of truth', () => {
    const component = createComponent(vi.fn(), vi.fn());

    component.exactLocation.latitude = 13.767484;
    component.exactLocation.longitude = 100.512869;

    expect(component.selectedLocationLabel()).toBe('13.767484, 100.512869');
  });

  it('moves the same private pin source of truth from a Google map picker result', () => {
    const component = createComponent(vi.fn(), vi.fn());
    const selection: PrivateLocationSelection = {
      label: 'Siam Paragon',
      latitude: 13.746562,
      longitude: 100.534799,
      source: 'google-place',
    };

    component.selectPrivateMapLocation(selection);

    expect(component.exactLocation).toEqual({
      latitude: 13.746562,
      longitude: 100.534799,
    });
    expect(component.selectedLocationLabel()).toBe('13.746562, 100.534799');
    expect(component.approximateLocationLabel).toBe('Siam Paragon');
  });

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
        photos: [],
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
    fillValidReport(component);
    component.moveSelectedLocation(0.012345, -0.023456);

    await component.submit();

    expect(create).toHaveBeenCalledTimes(1);
    const request = createRequest(create);
    expect(request.count).toBe(component.animalCount);
    expect(request.latitude).toBe(13.768645);
    expect(request.longitude).toBe(100.478344);
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
    fillValidReport(component);
    component.color = 'Black';
    component.description = 'Still visible after failure.';

    await component.submit();

    expect(component.color).toBe('Black');
    expect(component.description).toBe('Still visible after failure.');
    expect(component.submitError()).toContain('could not be submitted');
    expect(navigateByUrl).not.toHaveBeenCalled();
  });

  it('starts create mode empty and blocks invalid submission', async () => {
    const create = vi.fn();
    const navigateByUrl = vi.fn();
    const component = createComponent(create, navigateByUrl);

    expect(component.species).toBe('');
    expect(component.condition).toBe('');
    expect(component.color).toBe('');
    expect(component.description).toBe('');
    expect(component.seenDate).toBe('');
    expect(component.seenTime).toBe('');
    expect(component.locationSelected()).toBe(false);

    await component.submit();

    expect(create).not.toHaveBeenCalled();
    expect(navigateByUrl).not.toHaveBeenCalled();
    expect(component.submitError()).toContain('Choose the closest animal type');
  });

  it('creates a sighting before uploading selected photos with the created ID', async () => {
    const create = vi.fn().mockReturnValue(
      of({
        animalCount: 1,
        collarStatus: 'NO_COLLAR',
        color: 'White',
        condition: 'NORMAL_STRAY',
        createdAt: '2026-06-30T00:00:00.000Z',
        editable: true,
        id: 'created-sighting-id',
        lifecycleStatus: 'SIGHTING',
        pattern: 'Solid white',
        photos: [],
        publicLocation: { latitude: 13.751, longitude: 100.502, radiusMeters: 300 },
        seenAt: '2026-06-30T01:00:00.000Z',
        species: 'DOG',
        updatedAt: '2026-06-30T02:00:00.000Z',
        urgency: 'MEDIUM',
        verificationStatus: 'PENDING',
      }),
    );
    const uploadPhotos = vi.fn().mockReturnValue(of({ photos: [] }));
    const navigateByUrl = vi.fn().mockResolvedValue(true);
    const component = createComponent(create, navigateByUrl, uploadPhotos);
    fillValidReport(component);
    mockObjectUrls();

    component.addFiles(
      fileInputEvent([new File([jpegBytes()], 'dog.jpg', { type: 'image/jpeg' })]),
    );
    await component.submit();

    expect(create.mock.invocationCallOrder[0]).toBeLessThan(
      uploadPhotos.mock.invocationCallOrder[0] ?? 0,
    );
    expect(uploadPhotos).toHaveBeenCalledWith('created-sighting-id', [expect.any(File)]);
    expect(navigateByUrl).toHaveBeenCalledWith('/my/reports');
  });

  it('does not create a duplicate sighting when retrying failed photo upload', async () => {
    const create = vi.fn().mockReturnValue(
      of({
        animalCount: 1,
        collarStatus: 'NO_COLLAR',
        color: 'White',
        condition: 'NORMAL_STRAY',
        createdAt: '2026-06-30T00:00:00.000Z',
        editable: true,
        id: 'created-sighting-id',
        lifecycleStatus: 'SIGHTING',
        pattern: 'Solid white',
        photos: [],
        publicLocation: { latitude: 13.751, longitude: 100.502, radiusMeters: 300 },
        seenAt: '2026-06-30T01:00:00.000Z',
        species: 'DOG',
        updatedAt: '2026-06-30T02:00:00.000Z',
        urgency: 'MEDIUM',
        verificationStatus: 'PENDING',
      }),
    );
    const uploadPhotos = vi
      .fn()
      .mockReturnValueOnce(throwError(() => new Error('upload failed')))
      .mockReturnValueOnce(of({ photos: [] }));
    const navigateByUrl = vi.fn().mockResolvedValue(true);
    const component = createComponent(create, navigateByUrl, uploadPhotos);
    fillValidReport(component);
    mockObjectUrls();

    component.addFiles(
      fileInputEvent([new File([jpegBytes()], 'dog.jpg', { type: 'image/jpeg' })]),
    );
    await component.submit();
    expect(component.uploadError()).toContain('saved');
    await component.submit();

    expect(create).toHaveBeenCalledTimes(1);
    expect(uploadPhotos).toHaveBeenCalledTimes(2);
    expect(navigateByUrl).toHaveBeenCalledWith('/my/reports');
  });

  it('rejects unsupported, oversized, and excess selected photos before upload', () => {
    const create = vi.fn();
    const navigateByUrl = vi.fn();
    const component = createComponent(create, navigateByUrl);
    mockObjectUrls();

    component.addFiles(fileInputEvent([new File(['x'], 'bad.svg', { type: 'image/svg+xml' })]));
    expect(component.uploadError()).toContain('Only JPG');

    component.addFiles(
      fileInputEvent([
        new File([new Uint8Array(8 * 1024 * 1024 + 1)], 'big.jpg', { type: 'image/jpeg' }),
      ]),
    );
    expect(component.uploadError()).toContain('8 MB');

    component.addFiles(
      fileInputEvent(
        Array.from(
          { length: 6 },
          (_, index) =>
            new File([jpegBytes()], `photo-${String(index)}.jpg`, { type: 'image/jpeg' }),
        ),
      ),
    );
    expect(component.photoUrls).toHaveLength(5);
    expect(component.uploadError()).toContain('at most 5');
  });
});

function createComponent(
  create: ReturnType<typeof vi.fn>,
  navigateByUrl: ReturnType<typeof vi.fn>,
  uploadPhotos: ReturnType<typeof vi.fn> = vi.fn().mockReturnValue(of({ photos: [] })),
): ReportAnimalPageComponent {
  const injector = Injector.create({
    providers: [
      ReportAnimalPageComponent,
      {
        provide: SightingsApiService,
        useValue: { create, uploadPhotos },
      },
      {
        provide: Router,
        useValue: { navigateByUrl },
      },
    ],
  });

  return runInInjectionContext(injector, () => injector.get(ReportAnimalPageComponent));
}

function fillValidReport(component: ReportAnimalPageComponent): void {
  component.species = 'Dog';
  component.animalCount = 1;
  component.condition = 'Normal stray';
  component.color = 'White';
  component.pattern = 'Solid white';
  component.collarStatus = 'No collar';
  component.description = 'White dog seen near the roadside.';
  component.seenDate = '2026-06-30';
  component.seenTime = '01:00';
  component.urgency = 'Medium';
  component.moveSelectedLocation(0, 0);
}

function mockObjectUrls(): void {
  vi.spyOn(URL, 'createObjectURL').mockReturnValue(`blob:test-${String(Math.random())}`);
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
}

function fileInputEvent(files: File[]): Event {
  return {
    target: {
      files,
      value: '',
    },
  } as unknown as Event;
}

function jpegBytes(): Uint8Array {
  return new Uint8Array([0xff, 0xd8, 0xff, 0xda, 0x00, 0x04, 0x11, 0x22, 0xff, 0xd9]);
}

function createRequest(create: ReturnType<typeof vi.fn>): CreateSightingRequest {
  const calls = create.mock.calls as [CreateSightingRequest][];
  const request = calls[0]?.[0];
  if (!request) {
    throw new Error('Expected a create sighting request.');
  }

  return request;
}
