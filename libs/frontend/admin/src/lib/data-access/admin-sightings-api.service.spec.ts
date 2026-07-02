import { HttpClient, HttpParams } from '@angular/common/http';
import { Injector, runInInjectionContext } from '@angular/core';
import { of } from 'rxjs';

import { API_BASE_PATH } from '@petradar/frontend/core';

import { AdminSightingsApiService } from './admin-sightings-api.service.js';

interface HttpOptionsWithParams {
  params: HttpParams;
}

let http: {
  get: ReturnType<typeof vi.fn>;
  patch: ReturnType<typeof vi.fn>;
};

describe('AdminSightingsApiService', () => {
  let service: AdminSightingsApiService;

  beforeEach(() => {
    http = {
      get: vi.fn().mockReturnValue(of({ items: [], page: 1, pageSize: 25, total: 0, totalPages: 0 })),
      patch: vi.fn().mockReturnValue(of({ id: 'sighting-id' })),
    };
    const injector = Injector.create({
      providers: [
        AdminSightingsApiService,
        { provide: HttpClient, useValue: http },
        { provide: API_BASE_PATH, useValue: '/api/v1' },
      ],
    });

    service = runInInjectionContext(injector, () => injector.get(AdminSightingsApiService));
  });

  it('loads the moderation queue with typed filter query parameters', () => {
    service
      .getModerationQueue({
        hasPhotos: true,
        page: 2,
        pageSize: 10,
        query: 'white dog',
        species: 'DOG',
        sort: 'HIGHEST_URGENCY',
        verificationStatus: 'PENDING',
      })
      .subscribe();

    const options = getOptions();
    expect(http.get).toHaveBeenCalledWith('/api/v1/admin/verification-queue', options);
    expect(options.params.get('hasPhotos')).toBe('true');
    expect(options.params.get('page')).toBe('2');
    expect(options.params.get('pageSize')).toBe('10');
    expect(options.params.get('query')).toBe('white dog');
    expect(options.params.get('species')).toBe('DOG');
    expect(options.params.get('sort')).toBe('HIGHEST_URGENCY');
    expect(options.params.get('verificationStatus')).toBe('PENDING');
  });

  it('loads Admin detail without adding exact location to public contracts', () => {
    service.getModerationDetail('sighting-id').subscribe();

    expect(http.get).toHaveBeenCalledWith('/api/v1/admin/sightings/sighting-id');
  });

  it('sends verify requests without a body-controlled status', () => {
    service.verifySighting('sighting-id').subscribe();

    expect(http.patch).toHaveBeenCalledWith('/api/v1/admin/sightings/sighting-id/verify', {});
  });

  it('sends reject requests with only the reason', () => {
    service.rejectSighting('sighting-id', 'Photo is too unclear.').subscribe();

    expect(http.patch).toHaveBeenCalledWith('/api/v1/admin/sightings/sighting-id/reject', {
      reason: 'Photo is too unclear.',
    });
  });
});

function getOptions(index = 0): HttpOptionsWithParams {
  const options = (http.get.mock.calls as [string, HttpOptionsWithParams][])[index]?.[1];
  if (!options) {
    throw new Error('Expected GET request options.');
  }
  return options;
}
