export interface StoreSightingPhotoInput {
  buffer: Buffer;
  mimeType: string;
  storageKey: string;
}

export interface StoredSightingPhoto {
  storageKey: string;
}

export interface StoredSightingPhotoFile {
  buffer: Buffer;
  mimeType: string;
}

export interface SightingPhotoStorage {
  readonly provider: 'local' | 'supabase';
  delete(storageKey: string): Promise<void>;
  read(storageKey: string): Promise<StoredSightingPhotoFile>;
  store(input: StoreSightingPhotoInput): Promise<StoredSightingPhoto>;
}

export const SIGHTING_PHOTO_STORAGE = Symbol('SIGHTING_PHOTO_STORAGE');

