import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PhotoStorageProvider, Prisma, UserRole } from '@prisma/client';
import { randomUUID } from 'node:crypto';

import { AuditService } from '@petradar/backend/audit';
import { AuthorizationPolicyService, type AuthenticatedUser } from '@petradar/backend/auth';
import { PrismaService } from '@petradar/backend/shared';

import { CreateSightingDto } from './dto/create-sighting.dto.js';
import { ListSightingsQueryDto } from './dto/list-sightings-query.dto.js';
import { UpdateSightingDto } from './dto/update-sighting.dto.js';
import {
  toAuthorizedSightingResponse,
  toPaginatedAuthorizedSightingsResponse,
  toPaginatedPublicSightingsResponse,
  toPublicSightingResponse,
  toResponseSource,
  toSightingPhotoResponse,
  type AuthorizedSightingResponse,
  type PaginatedSightingsResponse,
  type PublicSightingResponse,
  type SightingPhotoResponse,
} from './sighting-response.mapper.js';
import { isOwnerEditableSighting } from './sighting-policies.js';
import {
  SightingsRepository,
  type CreateSightingPhotoInput,
  type SightingRecord,
} from './sightings.repository.js';
import {
  maxSightingPhotosPerSighting,
  SightingPhotoValidationService,
  type UploadedSightingPhotoFile,
} from './photos/sighting-photo-validation.js';
import {
  SIGHTING_PHOTO_STORAGE,
  type SightingPhotoStorage,
} from './photos/sighting-photo-storage.js';

interface RequestContext {
  requestId?: string | null;
}

const defaultPage = 1;
const defaultPageSize = 25;

@Injectable()
export class SightingsService {
  constructor(
    private readonly audit: AuditService,
    private readonly authorization: AuthorizationPolicyService,
    private readonly prisma: PrismaService,
    private readonly sightings: SightingsRepository,
    private readonly photoValidation: SightingPhotoValidationService,
    @Inject(SIGHTING_PHOTO_STORAGE) private readonly photoStorage: SightingPhotoStorage,
  ) {}

  async create(
    user: AuthenticatedUser,
    dto: CreateSightingDto,
    context: RequestContext = {},
  ): Promise<AuthorizedSightingResponse> {
    const created = await this.prisma.$transaction(async (tx) => {
      const sighting = await this.sightings.create(
        {
          animalCount: dto.count,
          collarStatus: dto.collarStatus,
          color: cleanText(dto.color),
          condition: dto.condition,
          description: cleanText(dto.description),
          exactLatitude: dto.latitude,
          exactLongitude: dto.longitude,
          pattern: cleanText(dto.pattern),
          reporterId: user.id,
          seenAt: parseDate(dto.seenAt),
          species: dto.species,
          urgency: dto.urgency,
        },
        tx,
      );

      await this.audit.createWithClient(tx, {
        action: 'SIGHTING_CREATED',
        actorId: user.id,
        entityId: sighting.id,
        entityType: 'AnimalSighting',
        metadata: {
          actorId: user.id,
          safeFields: [
            'species',
            'count',
            'color',
            'pattern',
            'collarStatus',
            'condition',
            'description',
            'seenAt',
            'urgency',
            'location',
          ],
          sightingId: sighting.id,
        },
        requestId: context.requestId,
      });

      return sighting;
    });

    return toAuthorizedSightingResponse(toResponseSource(created), {
      includeExactLocation: true,
    });
  }

  async listPublic(
    query: ListSightingsQueryDto,
  ): Promise<PaginatedSightingsResponse<PublicSightingResponse>> {
    const listInput = this.toListInput(query, { publicOnly: true });

    return toPaginatedPublicSightingsResponse(await this.sightings.list(listInput));
  }

  async findPublic(id: string): Promise<PublicSightingResponse> {
    const sighting = await this.sightings.findById(id, { publicOnly: true });
    if (!sighting) {
      throw new NotFoundException('Sighting not found.');
    }

    return toPublicSightingResponse(toResponseSource(sighting));
  }

  async listMine(
    user: AuthenticatedUser,
    query: ListSightingsQueryDto,
  ): Promise<PaginatedSightingsResponse<AuthorizedSightingResponse>> {
    const listInput = this.toListInput(query, {
      publicOnly: false,
      reporterId: user.id,
    });

    return toPaginatedAuthorizedSightingsResponse(await this.sightings.list(listInput));
  }

  async findMine(
    user: AuthenticatedUser,
    id: string,
    context: RequestContext = {},
  ): Promise<AuthorizedSightingResponse> {
    const sighting = await this.loadOwnedSighting(user, id, true, context);
    const includeExactLocation = this.authorization.canAccessExactLocation({
      allowOwner: true,
      ownerId: sighting.reporterId,
      user,
    });

    if (!includeExactLocation) {
      await this.audit.create({
        action: 'SIGHTING_EXACT_LOCATION_DENIED',
        actorId: user.id,
        entityId: id,
        entityType: 'AnimalSighting',
        metadata: { actorId: user.id, reason: 'policy_denied', sightingId: id },
        requestId: context.requestId,
      });
      throw new ForbiddenException('Exact location access denied.');
    }

    await this.audit.create({
      action: 'SIGHTING_EXACT_LOCATION_ACCESSED',
      actorId: user.id,
      entityId: id,
      entityType: 'AnimalSighting',
      metadata: { actorId: user.id, sightingId: id },
      requestId: context.requestId,
    });

    return toAuthorizedSightingResponse(toResponseSource(sighting), {
      includeExactLocation,
    });
  }

  async update(
    user: AuthenticatedUser,
    id: string,
    dto: UpdateSightingDto,
    context: RequestContext = {},
  ): Promise<AuthorizedSightingResponse> {
    const current = await this.loadOwnedSighting(user, id, true, context);
    if (!isOwnerEditableSighting(current)) {
      throw new ForbiddenException('This sighting can no longer be edited.');
    }

    if ((dto.latitude === undefined) !== (dto.longitude === undefined)) {
      throw new BadRequestException('Latitude and longitude must be updated together.');
    }

    const exactLatitude = dto.latitude ?? current.exactLocation?.latitude;
    const exactLongitude = dto.longitude ?? current.exactLocation?.longitude;

    if (exactLatitude === undefined || exactLongitude === undefined) {
      throw new BadRequestException('Exact location is required for editable updates.');
    }

    const updateInput = {
      animalCount: dto.count ?? current.animalCount,
      collarStatus: dto.collarStatus ?? current.collarStatus,
      color: dto.color === undefined ? current.color : cleanText(dto.color),
      condition: dto.condition ?? current.condition,
      description: dto.description === undefined ? current.description : cleanText(dto.description),
      exactLatitude,
      exactLongitude,
      id,
      pattern: dto.pattern === undefined ? current.pattern : cleanText(dto.pattern),
      reporterId: user.id,
      seenAt: dto.seenAt ? parseDate(dto.seenAt) : current.seenAt,
      species: dto.species ?? current.species,
      urgency: dto.urgency ?? current.urgency,
    };

    const changedFields = changedSafeFields(current, updateInput);
    const updated = await this.prisma.$transaction(async (tx) => {
      const sighting = await this.sightings.update(updateInput, tx);

      await this.audit.createWithClient(tx, {
        action: 'SIGHTING_UPDATED',
        actorId: user.id,
        entityId: sighting.id,
        entityType: 'AnimalSighting',
        metadata: {
          actorId: user.id,
          changedFields,
          sightingId: sighting.id,
        },
        requestId: context.requestId,
      });

      return sighting;
    });

    return toAuthorizedSightingResponse(toResponseSource(updated), {
      includeExactLocation: true,
    });
  }

  async uploadPhotos(
    user: AuthenticatedUser,
    id: string,
    files: readonly UploadedSightingPhotoFile[],
    context: RequestContext = {},
  ): Promise<{ photos: SightingPhotoResponse[] }> {
    const sighting = await this.loadPhotoManageableSighting(user, id, context);
    if (!isOwnerEditableSighting(sighting)) {
      throw new ForbiddenException('This sighting can no longer be edited.');
    }

    const validatedFiles = this.photoValidation.validate(files);
    const existingCount = await this.sightings.countPhotosForSighting(id);
    if (existingCount + validatedFiles.length > maxSightingPhotosPerSighting) {
      throw new BadRequestException('A sighting can have at most 5 photos.');
    }

    const storedPhotos: CreateSightingPhotoInput[] = [];
    try {
      for (const [index, file] of validatedFiles.entries()) {
        const photoId = randomUUID();
        const storageKey = `${id}/${photoId}.${file.extension}`;
        await this.photoStorage.store({
          buffer: file.buffer,
          mimeType: file.mimeType,
          storageKey,
        });
        storedPhotos.push({
          fileSizeBytes: file.fileSizeBytes,
          id: photoId,
          mimeType: file.mimeType,
          sortOrder: existingCount + index,
          storageKey,
          storageProvider: storageProviderFor(this.photoStorage.provider),
          url: `/api/v1/sightings/photos/${photoId}/file`,
        });
      }

      const photos = await this.prisma.$transaction(async (tx) => {
        const created = await this.sightings.createPhotos(id, storedPhotos, tx);

        await this.audit.createWithClient(tx, {
          action: 'SIGHTING_PHOTOS_UPLOADED',
          actorId: user.id,
          entityId: id,
          entityType: 'AnimalSighting',
          metadata: {
            actorId: user.id,
            fileSizes: created.map((photo) => photo.fileSizeBytes ?? 0),
            mimeTypes: created.map((photo) => photo.mimeType ?? 'unknown'),
            photoCount: created.length,
            photoIds: created.map((photo) => photo.id),
            sightingId: id,
          },
          requestId: context.requestId,
        });

        return created;
      });

      return { photos: photos.map(toSightingPhotoResponse) };
    } catch (error) {
      await this.cleanupStoredPhotos(storedPhotos, user.id, id, context);
      throw error;
    }
  }

  async deletePhoto(
    user: AuthenticatedUser,
    id: string,
    photoId: string,
    context: RequestContext = {},
  ): Promise<{ success: true }> {
    const sighting = await this.loadPhotoManageableSighting(user, id, context);
    if (!isOwnerEditableSighting(sighting)) {
      throw new ForbiddenException('This sighting can no longer be edited.');
    }

    const photo = await this.sightings.findPhotoById(photoId);
    if (photo?.sightingId !== id) {
      throw new NotFoundException('Photo not found.');
    }

    const deleted = await this.prisma.$transaction(async (tx) => {
      const removed = await this.sightings.deletePhoto(photoId, tx);
      await this.audit.createWithClient(tx, {
        action: 'SIGHTING_PHOTO_DELETED',
        actorId: user.id,
        entityId: id,
        entityType: 'AnimalSighting',
        metadata: {
          actorId: user.id,
          mimeType: photo.mimeType,
          photoId,
          sightingId: id,
        },
        requestId: context.requestId,
      });
      return removed;
    });

    if (deleted?.storageKey) {
      try {
        await this.photoStorage.delete(deleted.storageKey);
      } catch {
        await this.audit.create({
          action: 'SIGHTING_PHOTO_STORAGE_DELETE_FAILED',
          actorId: user.id,
          entityId: id,
          entityType: 'AnimalSighting',
          metadata: { actorId: user.id, photoId, sightingId: id },
          requestId: context.requestId,
        });
        throw new ServiceUnavailableException('The photo was removed but storage cleanup failed.');
      }
    }

    return { success: true };
  }

  async readPublicPhoto(photoId: string): Promise<{ buffer: Buffer; mimeType: string }> {
    const photo = await this.sightings.findPhotoById(photoId);
    if (!photo) {
      throw new NotFoundException('Photo not found.');
    }

    const sighting = await this.sightings.findById(photo.sightingId, { publicOnly: true });
    if (!sighting || !photo.storageKey) {
      throw new NotFoundException('Photo not found.');
    }

    const file = await this.photoStorage.read(photo.storageKey);
    return {
      buffer: file.buffer,
      mimeType: photo.mimeType ?? file.mimeType,
    };
  }

  private async loadOwnedSighting(
    user: AuthenticatedUser,
    id: string,
    includeExactLocation: boolean,
    context: RequestContext,
  ): Promise<SightingRecord> {
    const sighting = await this.sightings.findById(id, { includeExactLocation });
    if (!sighting) {
      throw new NotFoundException('Sighting not found.');
    }

    if (sighting.reporterId !== user.id) {
      await this.audit.create({
        action: 'SIGHTING_OWNERSHIP_DENIED',
        actorId: user.id,
        entityId: id,
        entityType: 'AnimalSighting',
        metadata: { actorId: user.id, reason: 'not_owner', sightingId: id },
        requestId: context.requestId,
      });
      throw new ForbiddenException('Sighting access denied.');
    }

    return sighting;
  }

  private async loadPhotoManageableSighting(
    user: AuthenticatedUser,
    id: string,
    context: RequestContext,
  ): Promise<SightingRecord> {
    const sighting = await this.sightings.findById(id, { includeExactLocation: false });
    if (!sighting) {
      throw new NotFoundException('Sighting not found.');
    }

    if (sighting.reporterId === user.id || user.roles.includes(UserRole.ADMIN)) {
      return sighting;
    }

    await this.audit.create({
      action: 'SIGHTING_PHOTO_OWNERSHIP_DENIED',
      actorId: user.id,
      entityId: id,
      entityType: 'AnimalSighting',
      metadata: { actorId: user.id, reason: 'not_owner', sightingId: id },
      requestId: context.requestId,
    });
    throw new ForbiddenException('Sighting access denied.');
  }

  private async cleanupStoredPhotos(
    photos: readonly CreateSightingPhotoInput[],
    actorId: string,
    sightingId: string,
    context: RequestContext,
  ): Promise<void> {
    const failedPhotoIds: string[] = [];
    for (const photo of photos) {
      try {
        await this.photoStorage.delete(photo.storageKey);
      } catch {
        failedPhotoIds.push(photo.id);
      }
    }

    if (failedPhotoIds.length > 0) {
      await this.audit.create({
        action: 'SIGHTING_PHOTO_COMPENSATION_FAILED',
        actorId,
        entityId: sightingId,
        entityType: 'AnimalSighting',
        metadata: { actorId, failedPhotoIds, sightingId },
        requestId: context.requestId,
      });
    }
  }

  private toListInput(
    query: ListSightingsQueryDto,
    options: { publicOnly: boolean; reporterId?: string },
  ) {
    const nearbyFields = [query.latitude, query.longitude, query.radiusMeters];
    const hasSomeNearby = nearbyFields.some((value) => value !== undefined);
    const hasAllNearby = nearbyFields.every((value) => value !== undefined);

    if (hasSomeNearby && !hasAllNearby) {
      throw new BadRequestException('latitude, longitude, and radiusMeters are required together.');
    }

    return {
      condition: query.condition,
      createdFrom: query.createdFrom ? parseDate(query.createdFrom) : undefined,
      createdTo: query.createdTo ? parseDate(query.createdTo) : undefined,
      lifecycleStatus: query.lifecycleStatus,
      latitude: query.latitude,
      longitude: query.longitude,
      page: query.page ?? defaultPage,
      pageSize: query.pageSize ?? defaultPageSize,
      publicOnly: options.publicOnly,
      query: cleanText(query.query) ?? undefined,
      radiusMeters: query.radiusMeters,
      reporterId: options.reporterId,
      seenFrom: query.seenFrom ? parseDate(query.seenFrom) : undefined,
      seenTo: query.seenTo ? parseDate(query.seenTo) : undefined,
      species: query.species,
      urgency: query.urgency,
      verificationStatus: query.verificationStatus,
    };
  }
}

function storageProviderFor(provider: SightingPhotoStorage['provider']): PhotoStorageProvider {
  return provider === 'supabase' ? PhotoStorageProvider.SUPABASE : PhotoStorageProvider.LOCAL_PLACEHOLDER;
}

function cleanText(value: string | undefined | null): string | null {
  const trimmed = value?.trim();
  if (!trimmed) {
    return null;
  }

  return trimmed;
}

function parseDate(value: string): Date {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new BadRequestException('Invalid date.');
  }
  return date;
}

function changedSafeFields(
  current: SightingRecord,
  next: {
    animalCount: number;
    collarStatus: string;
    color: string | null;
    condition: string;
    description: string | null;
    exactLatitude: number;
    exactLongitude: number;
    pattern: string | null;
    seenAt: Date;
    species: string;
    urgency: string;
  },
): Prisma.InputJsonValue[] {
  const changed: string[] = [];

  if (current.species !== next.species) changed.push('species');
  if (current.animalCount !== next.animalCount) changed.push('count');
  if (current.color !== next.color) changed.push('color');
  if (current.pattern !== next.pattern) changed.push('pattern');
  if (current.collarStatus !== next.collarStatus) changed.push('collarStatus');
  if (current.condition !== next.condition) changed.push('condition');
  if (current.description !== next.description) changed.push('description');
  if (current.seenAt.getTime() !== next.seenAt.getTime()) changed.push('seenAt');
  if (current.urgency !== next.urgency) changed.push('urgency');
  if (
    current.exactLocation &&
    (current.exactLocation.latitude !== next.exactLatitude ||
      current.exactLocation.longitude !== next.exactLongitude)
  ) {
    changed.push('location');
  }

  return changed;
}
