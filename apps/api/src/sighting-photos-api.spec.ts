import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  BadRequestException,
  ForbiddenException,
  PayloadTooLargeException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  AnimalCondition,
  AnimalSpecies,
  CollarStatus,
  PhotoStorageProvider,
  SightingLifecycleStatus,
  UrgencyLevel,
  UserRole,
  VerificationStatus,
  VolunteerVerificationState,
} from '@prisma/client';

import type { AuthenticatedUser } from '@petradar/backend/auth';
import {
  LocalSightingPhotoStorage,
  SightingPhotoValidationService,
  SightingsController,
  SightingsService,
  sightingPhotoStorageProvider,
  toPublicSightingResponse,
  type SightingPhotoRecord,
  type SightingRecord,
  type UploadedSightingPhotoFile,
} from '@petradar/backend/sightings';

const user: AuthenticatedUser = {
  displayName: 'Photo Owner',
  email: 'owner@example.com',
  id: '11111111-1111-4111-8111-111111111111',
  roles: [UserRole.REPORTER],
  volunteerVerification: VolunteerVerificationState.NOT_APPLICABLE,
};

const otherUser: AuthenticatedUser = {
  ...user,
  email: 'other@example.com',
  id: '22222222-2222-4222-8222-222222222222',
};

const sighting: SightingRecord = {
  animalCount: 1,
  collarStatus: CollarStatus.NO_COLLAR,
  color: 'White',
  condition: AnimalCondition.NORMAL_STRAY,
  createdAt: new Date('2026-06-30T00:00:00.000Z'),
  description: 'Calm animal.',
  id: '33333333-3333-4333-8333-333333333333',
  lifecycleStatus: SightingLifecycleStatus.SIGHTING,
  pattern: 'Solid',
  photos: [],
  publicLocation: { latitude: 13.75, longitude: 100.5 },
  publicRadiusMeters: 300,
  reporterId: user.id,
  seenAt: new Date('2026-06-30T01:00:00.000Z'),
  species: AnimalSpecies.DOG,
  updatedAt: new Date('2026-06-30T02:00:00.000Z'),
  urgency: UrgencyLevel.LOW,
  verificationStatus: VerificationStatus.PENDING,
};

const photo: SightingPhotoRecord = {
  createdAt: new Date('2026-06-30T03:00:00.000Z'),
  fileSizeBytes: 64,
  id: '44444444-4444-4444-8444-444444444444',
  mimeType: 'image/jpeg',
  sightingId: sighting.id,
  sortOrder: 0,
  storageKey: `${sighting.id}/44444444-4444-4444-8444-444444444444.jpg`,
  storageProvider: PhotoStorageProvider.LOCAL_PLACEHOLDER,
  url: '/api/v1/sightings/photos/44444444-4444-4444-8444-444444444444/file',
};

function jpegWithExif(): Buffer {
  return Buffer.from([
    0xff, 0xd8, 0xff, 0xe1, 0x00, 0x10, 0x45, 0x78, 0x69, 0x66, 0x00, 0x00, 0x47, 0x50, 0x53,
    0x00, 0x00, 0x00, 0xff, 0xda, 0x00, 0x04, 0x11, 0x22, 0xff, 0xd9,
  ]);
}

function pngWithExif(): Buffer {
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk('eXIf', Buffer.from('GPS')),
    pngChunk('IDAT', Buffer.from([1, 2, 3])),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

function webpWithExif(): Buffer {
  const exif = webpChunk('EXIF', Buffer.from('GPS'));
  const vp8 = webpChunk('VP8 ', Buffer.from([1, 2, 3, 4]));
  const header = Buffer.alloc(12);
  header.write('RIFF', 0, 'ascii');
  header.writeUInt32LE(4 + exif.length + vp8.length, 4);
  header.write('WEBP', 8, 'ascii');
  return Buffer.concat([header, exif, vp8]);
}

function pngChunk(type: string, data: Buffer): Buffer {
  const chunk = Buffer.alloc(12 + data.length);
  chunk.writeUInt32BE(data.length, 0);
  chunk.write(type, 4, 'ascii');
  data.copy(chunk, 8);
  return chunk;
}

function webpChunk(type: string, data: Buffer): Buffer {
  const padding = data.length % 2 === 0 ? 0 : 1;
  const chunk = Buffer.alloc(8 + data.length + padding);
  chunk.write(type, 0, 'ascii');
  chunk.writeUInt32LE(data.length, 4);
  data.copy(chunk, 8);
  return chunk;
}

function file(
  buffer: Buffer,
  mimetype: string,
  overrides: Partial<UploadedSightingPhotoFile> = {},
): UploadedSightingPhotoFile {
  return {
    buffer,
    mimetype,
    originalname: 'photo',
    size: buffer.length,
    ...overrides,
  };
}

function createService(
  overrides: {
    audit?: Record<string, jest.Mock>;
    photoStorage?: Record<string, unknown>;
    photoValidation?: SightingPhotoValidationService;
    prisma?: Record<string, jest.Mock>;
    repository?: Record<string, jest.Mock>;
  } = {},
): SightingsService {
  const audit = {
    create: jest.fn().mockResolvedValue({ id: 'audit-id' }),
    createWithClient: jest.fn().mockResolvedValue({ id: 'audit-id' }),
    ...overrides.audit,
  };
  const repository = {
    countPhotosForSighting: jest.fn().mockResolvedValue(0),
    createPhotos: jest.fn().mockResolvedValue([photo]),
    deletePhoto: jest.fn().mockResolvedValue(photo),
    findById: jest.fn().mockResolvedValue(sighting),
    findPhotoById: jest.fn().mockResolvedValue(photo),
    ...overrides.repository,
  };
  const prisma = {
    $transaction: jest.fn((callback: (tx: unknown) => unknown) =>
      Promise.resolve(callback({ tx: true })),
    ),
    ...overrides.prisma,
  };
  const photoStorage = {
    delete: jest.fn().mockResolvedValue(undefined),
    provider: 'local',
    read: jest.fn().mockResolvedValue({ buffer: Buffer.from('stored'), mimeType: 'image/jpeg' }),
    store: jest.fn().mockResolvedValue({ storageKey: photo.storageKey }),
    ...overrides.photoStorage,
  };

  return new SightingsService(
    audit as never,
    { canAccessExactLocation: jest.fn().mockReturnValue(true) },
    prisma as never,
    repository as never,
    overrides.photoValidation ?? new SightingPhotoValidationService(),
    photoStorage as never,
  );
}

describe('Sighting photo validation', () => {
  const validation = new SightingPhotoValidationService();

  it('accepts JPEG, PNG, and WebP images and strips metadata chunks', () => {
    const [jpeg, png, webp] = validation.validate([
      file(jpegWithExif(), 'image/jpeg'),
      file(pngWithExif(), 'image/png'),
      file(webpWithExif(), 'image/webp'),
    ]);

    expect(jpeg?.buffer.includes(Buffer.from('Exif'))).toBe(false);
    expect(png?.buffer.includes(Buffer.from('eXIf'))).toBe(false);
    expect(webp?.buffer.includes(Buffer.from('EXIF'))).toBe(false);
  });

  it('rejects unsupported, SVG, oversized, empty, and signature-mismatched files', () => {
    expect(() => validation.validate([file(Buffer.from('gif'), 'image/gif')])).toThrow(
      BadRequestException,
    );
    expect(() =>
      validation.validate([file(Buffer.from('<svg></svg>'), 'image/svg+xml')]),
    ).toThrow(BadRequestException);
    expect(() =>
      validation.validate([file(jpegWithExif(), 'image/jpeg', { size: 8 * 1024 * 1024 + 1 })]),
    ).toThrow(PayloadTooLargeException);
    expect(() => validation.validate([file(Buffer.alloc(0), 'image/png')])).toThrow(
      BadRequestException,
    );
    expect(() => validation.validate([file(jpegWithExif(), 'image/png')])).toThrow(
      BadRequestException,
    );
  });

  it('rejects too many files and empty upload requests', () => {
    expect(() => validation.validate([])).toThrow(BadRequestException);
    expect(() =>
      validation.validate(Array.from({ length: 6 }, () => file(jpegWithExif(), 'image/jpeg'))),
    ).toThrow(BadRequestException);
  });
});

describe('Sighting photo storage', () => {
  it('stores and reads local files under the configured root only', async () => {
    const root = await mkdtemp(join(tmpdir(), 'petradar-photos-'));
    const storage = new LocalSightingPhotoStorage(root);
    await storage.store({
      buffer: jpegWithExif(),
      mimeType: 'image/jpeg',
      storageKey: `${sighting.id}/${photo.id}.jpg`,
    });

    await expect(storage.read(`${sighting.id}/${photo.id}.jpg`)).resolves.toEqual(
      expect.objectContaining({ mimeType: 'image/jpeg' }),
    );
    await expect(storage.read('../secret.jpg')).rejects.toThrow();
    await rm(root, { force: true, recursive: true });
  });

  it('rejects development-only local storage in production', () => {
    const config = {
      get: jest.fn((key: string) => {
        const values: Record<string, string> = {
          NODE_ENV: 'production',
          SIGHTING_PHOTO_STORAGE_PROVIDER: 'auto',
        };
        return values[key];
      }),
    };

    expect(() => sightingPhotoStorageProvider.useFactory(config as never)).toThrow(
      /Production photo storage/,
    );
  });
});

describe('Sighting photo service and controller', () => {
  it('uploads photos for the authenticated editable owner with server-generated metadata', async () => {
    const repository = { createPhotos: jest.fn().mockResolvedValue([photo]) };
    const service = createService({ repository });

    const response = await service.uploadPhotos(user, sighting.id, [
      file(jpegWithExif(), 'image/jpeg'),
    ]);

    expect(response.photos).toHaveLength(1);
    expect(repository.createPhotos).toHaveBeenCalled();
    const createPhotoCalls = repository.createPhotos.mock.calls as unknown as [
      string,
      { storageProvider: PhotoStorageProvider; url: string }[],
      unknown,
    ][];
    const createdPhoto = createPhotoCalls[0]?.[1][0];
    expect(createPhotoCalls[0]?.[0]).toBe(sighting.id);
    expect(createdPhoto?.storageProvider).toBe(PhotoStorageProvider.LOCAL_PLACEHOLDER);
    expect(createdPhoto?.url).toContain('/api/v1/sightings/photos/');
    expect(JSON.stringify(repository.createPhotos.mock.calls)).not.toContain('GPS');
  });

  it('rejects anonymous controller upload calls', () => {
    const controller = new SightingsController(createService());

    expect(() => {
      void controller.uploadPhotos(undefined, sighting.id, [], { header: jest.fn() } as never);
    }).toThrow(UnauthorizedException);
  });

  it('rejects non-owner uploads and non-editable sighting uploads', async () => {
    await expect(createService().uploadPhotos(otherUser, sighting.id, [])).rejects.toThrow(
      ForbiddenException,
    );
    await expect(
      createService({
        repository: {
          findById: jest.fn().mockResolvedValue({
            ...sighting,
            verificationStatus: VerificationStatus.VERIFIED,
          }),
        },
      }).uploadPhotos(user, sighting.id, []),
    ).rejects.toThrow(ForbiddenException);
  });

  it('enforces the maximum photo count per sighting', async () => {
    const service = createService({
      repository: { countPhotosForSighting: jest.fn().mockResolvedValue(5) },
    });

    await expect(
      service.uploadPhotos(user, sighting.id, [file(jpegWithExif(), 'image/jpeg')]),
    ).rejects.toThrow(BadRequestException);
  });

  it('attempts storage cleanup when database persistence fails', async () => {
    const photoStorage = {
      delete: jest.fn().mockResolvedValue(undefined),
      store: jest.fn().mockResolvedValue({ storageKey: photo.storageKey }),
    };
    const service = createService({
      photoStorage,
      prisma: { $transaction: jest.fn().mockRejectedValue(new Error('database failed')) },
    });

    await expect(
      service.uploadPhotos(user, sighting.id, [file(jpegWithExif(), 'image/jpeg')]),
    ).rejects.toThrow('database failed');
    expect(photoStorage.delete).toHaveBeenCalled();
  });

  it('deletes photos only when ownership, association, and editability pass', async () => {
    const repository = {
      deletePhoto: jest.fn().mockResolvedValue(photo),
      findPhotoById: jest.fn().mockResolvedValue(photo),
    };

    await expect(createService({ repository }).deletePhoto(user, sighting.id, photo.id)).resolves
      .toEqual({ success: true });
    expect(repository.deletePhoto).toHaveBeenCalledWith(photo.id, expect.anything());

    await expect(
      createService({
        repository: { findPhotoById: jest.fn().mockResolvedValue({ ...photo, sightingId: 'other' }) },
      }).deletePhoto(user, sighting.id, photo.id),
    ).rejects.toThrow();
  });

  it('returns public-safe photo metadata without storage keys or exact locations', () => {
    const response = toPublicSightingResponse({ ...sighting, photos: [photo] });

    expect(response.photos[0]).toEqual(
      expect.objectContaining({
        id: photo.id,
        sortOrder: 0,
        url: photo.url,
      }),
    );
    expect(JSON.stringify(response)).not.toContain(String(photo.storageKey));
    expect(JSON.stringify(response)).not.toContain('exactLocation');
  });

  it('audits photo upload without bytes, paths, or storage secrets', async () => {
    const audit = { createWithClient: jest.fn().mockResolvedValue({ id: 'audit-id' }) };
    await createService({ audit }).uploadPhotos(user, sighting.id, [
      file(jpegWithExif(), 'image/jpeg'),
    ]);

    const auditJson = JSON.stringify(audit.createWithClient.mock.calls);
    expect(auditJson).not.toContain('GPS');
    expect(auditJson).not.toContain(String(photo.storageKey));
    expect(auditJson).not.toContain('service');
  });
});
