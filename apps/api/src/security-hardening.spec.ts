import { MODULE_METADATA } from '@nestjs/common/constants';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import {
  apiRateLimits,
  assertProductionSeedIsDisabled,
  globalApiRateLimit,
} from '@petradar/backend/shared';
import {
  sightingPhotoUploadLimits,
  SightingsController,
} from '@petradar/backend/sightings';

import { AppModule } from './app.module.js';
import { validateEnv } from './config/env.schema.js';
import { helmetOptions, shouldEnableApiDocs } from './config/http-security.js';
import { AuthController } from './modules/auth/auth.controller.js';

const throttleLimitMetadata = 'THROTTLER:LIMITdefault';
const throttleTtlMetadata = 'THROTTLER:TTLdefault';

function controllerMethod<T extends object, K extends keyof T>(controller: T, methodName: K): T[K] {
  const method = controller[methodName];
  if (typeof method !== 'function') {
    throw new Error(`Missing controller method: ${String(methodName)}`);
  }
  return method;
}

describe('API production hardening', () => {
  it('registers a global in-memory throttler guard with a moderate default', () => {
    const imports = Reflect.getMetadata(MODULE_METADATA.IMPORTS, AppModule) as readonly unknown[];
    const providers = Reflect.getMetadata(MODULE_METADATA.PROVIDERS, AppModule) as readonly unknown[];

    expect(
      imports.some(
        (value) =>
          typeof value === 'object' &&
          value !== null &&
          'module' in value &&
          value.module === ThrottlerModule,
      ),
    ).toBe(true);
    expect(providers).toContainEqual({ provide: APP_GUARD, useClass: ThrottlerGuard });
    expect(globalApiRateLimit).toEqual({ limit: 180, name: 'default', ttl: 60_000 });
  });

  it('applies stricter limits to auth and multipart upload endpoints', () => {
    expect(
      Reflect.getMetadata(
        throttleLimitMetadata,
        controllerMethod(AuthController.prototype, 'login'),
      ),
    ).toBe(apiRateLimits.authLogin.default.limit);
    expect(
      Reflect.getMetadata(
        throttleTtlMetadata,
        controllerMethod(AuthController.prototype, 'register'),
      ),
    ).toBe(apiRateLimits.authRegister.default.ttl);
    expect(
      Reflect.getMetadata(
        throttleLimitMetadata,
        controllerMethod(SightingsController.prototype, 'uploadPhotos'),
      ),
    ).toBe(apiRateLimits.upload.default.limit);
    expect(sightingPhotoUploadLimits).toEqual({
      fieldNameSize: 100,
      fields: 0,
      fileSize: 8 * 1024 * 1024,
      files: 5,
      parts: 5,
    });
  });

  it('disables Swagger in production unless the explicit flag is true', () => {
    expect(shouldEnableApiDocs({ API_DOCS_ENABLED: false, NODE_ENV: 'production' })).toBe(false);
    expect(shouldEnableApiDocs({ API_DOCS_ENABLED: true, NODE_ENV: 'production' })).toBe(true);
    expect(shouldEnableApiDocs({ API_DOCS_ENABLED: false, NODE_ENV: 'development' })).toBe(true);
    expect(shouldEnableApiDocs({ API_DOCS_ENABLED: false, NODE_ENV: 'test' })).toBe(true);
  });

  it('parses API docs and trusted proxy configuration without boolean coercion surprises', () => {
    const env = validateEnv({
      API_DOCS_ENABLED: 'false',
      DATABASE_URL: 'postgresql://user:password@localhost:5432/petradar',
      JWT_ACCESS_SECRET: 'a'.repeat(32),
      JWT_REFRESH_SECRET: 'b'.repeat(32),
      LOCATION_OBFUSCATION_SECRET: 'c'.repeat(32),
      TRUST_PROXY_HOPS: '1',
    });

    expect(env.API_DOCS_ENABLED).toBe(false);
    expect(env.TRUST_PROXY_HOPS).toBe(1);
  });

  it('uses HSTS only in production and keeps cross-origin API photos compatible', () => {
    const production = helmetOptions({ API_DOCS_ENABLED: false, NODE_ENV: 'production' });
    const development = helmetOptions({ API_DOCS_ENABLED: false, NODE_ENV: 'development' });

    expect(production.strictTransportSecurity).toEqual(
      expect.objectContaining({ maxAge: 31_536_000 }),
    );
    expect(development.strictTransportSecurity).toBe(false);
    expect(production.crossOriginResourcePolicy).toEqual({ policy: 'cross-origin' });
  });

  it('refuses the known demo seed in production before database work starts', () => {
    expect(() => {
      assertProductionSeedIsDisabled('production');
    }).toThrow(
      /demo seed is disabled in production/i,
    );
    expect(() => {
      assertProductionSeedIsDisabled('development');
    }).not.toThrow();
    expect(() => {
      assertProductionSeedIsDisabled('test');
    }).not.toThrow();
  });
});
