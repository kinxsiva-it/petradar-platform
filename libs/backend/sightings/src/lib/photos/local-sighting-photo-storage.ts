import { constants } from 'node:fs';
import { access, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, resolve, sep } from 'node:path';
import { Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';

import type {
  SightingPhotoStorage,
  StoreSightingPhotoInput,
  StoredSightingPhoto,
  StoredSightingPhotoFile,
} from './sighting-photo-storage.js';

@Injectable()
export class LocalSightingPhotoStorage implements SightingPhotoStorage {
  readonly provider = 'local' as const;

  constructor(private readonly rootDirectory: string = resolve(process.cwd(), '.local-storage', 'sightings')) {}

  async store(input: StoreSightingPhotoInput): Promise<StoredSightingPhoto> {
    const path = this.resolveStoragePath(input.storageKey);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, input.buffer, { flag: 'wx' });
    return { storageKey: input.storageKey };
  }

  async read(storageKey: string): Promise<StoredSightingPhotoFile> {
    const path = this.resolveStoragePath(storageKey);
    try {
      await access(path, constants.R_OK);
      return {
        buffer: await readFile(path),
        mimeType: mimeTypeFromStorageKey(storageKey),
      };
    } catch {
      throw new NotFoundException('Photo file not found.');
    }
  }

  async delete(storageKey: string): Promise<void> {
    const path = this.resolveStoragePath(storageKey);
    await rm(path, { force: true });
  }

  private resolveStoragePath(storageKey: string): string {
    if (storageKey.includes('..') || storageKey.includes('\\')) {
      throw new ServiceUnavailableException('Invalid stored photo path.');
    }

    const root = resolve(this.rootDirectory);
    const target = resolve(root, storageKey);
    if (target !== root && !target.startsWith(`${root}${sep}`)) {
      throw new ServiceUnavailableException('Invalid stored photo path.');
    }

    return target;
  }
}

function mimeTypeFromStorageKey(storageKey: string): string {
  if (storageKey.endsWith('.png')) {
    return 'image/png';
  }

  if (storageKey.endsWith('.webp')) {
    return 'image/webp';
  }

  return 'image/jpeg';
}

