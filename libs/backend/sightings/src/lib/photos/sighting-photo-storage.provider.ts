import { resolve } from 'node:path';
import { ConfigService } from '@nestjs/config';

import { LocalSightingPhotoStorage } from './local-sighting-photo-storage.js';
import { SIGHTING_PHOTO_STORAGE, type SightingPhotoStorage } from './sighting-photo-storage.js';
import { SupabaseSightingPhotoStorage } from './supabase-sighting-photo-storage.js';

interface PhotoStorageEnv {
  NODE_ENV: 'development' | 'test' | 'production';
  SIGHTING_PHOTO_LOCAL_ROOT?: string;
  SIGHTING_PHOTO_STORAGE_PROVIDER: 'auto' | 'local' | 'supabase';
  SUPABASE_SERVICE_ROLE_KEY?: string;
  SUPABASE_STORAGE_BUCKET?: string;
  SUPABASE_URL?: string;
}

export const sightingPhotoStorageProvider = {
  inject: [ConfigService],
  provide: SIGHTING_PHOTO_STORAGE,
  useFactory(config: ConfigService<PhotoStorageEnv, true>): SightingPhotoStorage {
    const requestedProvider = config.get('SIGHTING_PHOTO_STORAGE_PROVIDER', { infer: true });
    const nodeEnv = config.get('NODE_ENV', { infer: true });
    const supabaseConfig = {
      bucket: config.get('SUPABASE_STORAGE_BUCKET', { infer: true }),
      serviceRoleKey: config.get('SUPABASE_SERVICE_ROLE_KEY', { infer: true }),
      url: config.get('SUPABASE_URL', { infer: true }),
    };
    const hasSupabaseConfig =
      isConfiguredValue(supabaseConfig.bucket) &&
      isConfiguredValue(supabaseConfig.serviceRoleKey) &&
      isConfiguredValue(supabaseConfig.url);

    if (requestedProvider === 'supabase' || (requestedProvider === 'auto' && hasSupabaseConfig)) {
      const bucket = supabaseConfig.bucket;
      const serviceRoleKey = supabaseConfig.serviceRoleKey;
      const url = supabaseConfig.url;
      if (!isConfiguredValue(bucket) || !isConfiguredValue(serviceRoleKey) || !isConfiguredValue(url)) {
        throw new Error('Supabase photo storage is selected but not configured.');
      }

      return new SupabaseSightingPhotoStorage({
        bucket,
        serviceRoleKey,
        url,
      });
    }

    if (nodeEnv === 'production') {
      throw new Error('Production photo storage requires a configured production provider.');
    }

    const localRoot =
      config.get('SIGHTING_PHOTO_LOCAL_ROOT', { infer: true }) ??
      resolve(process.cwd(), '.local-storage', 'sightings');
    return new LocalSightingPhotoStorage(localRoot);
  },
};

function isConfiguredValue(value: string | undefined): value is string {
  const trimmed = value?.trim();
  return Boolean(trimmed) && !trimmed?.startsWith('replace-');
}
