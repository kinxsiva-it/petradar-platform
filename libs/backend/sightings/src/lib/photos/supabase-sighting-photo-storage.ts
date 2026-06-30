import { Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';

import type {
  SightingPhotoStorage,
  StoreSightingPhotoInput,
  StoredSightingPhoto,
  StoredSightingPhotoFile,
} from './sighting-photo-storage.js';

export interface SupabaseSightingPhotoStorageConfig {
  bucket: string;
  serviceRoleKey: string;
  url: string;
}

@Injectable()
export class SupabaseSightingPhotoStorage implements SightingPhotoStorage {
  readonly provider = 'supabase' as const;
  private readonly baseUrl: string;

  constructor(private readonly config: SupabaseSightingPhotoStorageConfig) {
    this.baseUrl = config.url.replace(/\/+$/, '');
  }

  async store(input: StoreSightingPhotoInput): Promise<StoredSightingPhoto> {
    const response = await fetch(this.objectUrl(input.storageKey), {
      body: input.buffer as unknown as BodyInit,
      headers: {
        ...this.authHeaders(),
        'content-type': input.mimeType,
        'x-upsert': 'false',
      },
      method: 'POST',
    });

    if (!response.ok) {
      throw new ServiceUnavailableException('Photo storage is unavailable.');
    }

    return { storageKey: input.storageKey };
  }

  async read(storageKey: string): Promise<StoredSightingPhotoFile> {
    const response = await fetch(this.authenticatedObjectUrl(storageKey), {
      headers: this.authHeaders(),
    });

    if (response.status === 404) {
      throw new NotFoundException('Photo file not found.');
    }

    if (!response.ok) {
      throw new ServiceUnavailableException('Photo storage is unavailable.');
    }

    const arrayBuffer = await response.arrayBuffer();
    return {
      buffer: Buffer.from(arrayBuffer),
      mimeType: response.headers.get('content-type') ?? 'application/octet-stream',
    };
  }

  async delete(storageKey: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/storage/v1/object/${this.bucketPath('')}`, {
      body: JSON.stringify({ prefixes: [storageKey] }),
      headers: {
        ...this.authHeaders(),
        'content-type': 'application/json',
      },
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new ServiceUnavailableException('Photo storage is unavailable.');
    }
  }

  private objectUrl(storageKey: string): string {
    return `${this.baseUrl}/storage/v1/object/${this.bucketPath(storageKey)}`;
  }

  private authenticatedObjectUrl(storageKey: string): string {
    return `${this.baseUrl}/storage/v1/object/authenticated/${this.bucketPath(storageKey)}`;
  }

  private bucketPath(storageKey: string): string {
    return `${encodeURIComponent(this.config.bucket)}/${encodeStoragePath(storageKey)}`;
  }

  private authHeaders(): Record<string, string> {
    return {
      apikey: this.config.serviceRoleKey,
      authorization: `Bearer ${this.config.serviceRoleKey}`,
    };
  }
}

function encodeStoragePath(storageKey: string): string {
  return storageKey
    .split('/')
    .filter((part) => part.length > 0)
    .map((part) => encodeURIComponent(part))
    .join('/');
}
