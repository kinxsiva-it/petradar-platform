import { createHmac } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service.js';

export interface GeographicPoint {
  latitude: number;
  longitude: number;
}

export interface PublicLocation extends GeographicPoint {
  radiusMeters: number;
}

interface PublicLocationInput extends GeographicPoint {
  entityId: string;
  radiusMeters?: number;
}

const earthRadiusMeters = 6_371_000;
const defaultRadiusMeters = 300;
export const minimumPublicRadiusMeters = 100;
export const maximumPublicRadiusMeters = 5_000;
export const privacyPolicyAuditAction = 'ADMIN_PRIVACY_POLICY_UPDATED';
export const privacyPolicyEntityId = 'public-location';
export const privacyPolicyEntityType = 'PrivacyPolicy';

export interface EffectivePublicLocationPolicy {
  defaultRadiusMeters: number;
  maximumRadiusMeters: number;
  minimumRadiusMeters: number;
  source: 'audit-log' | 'default' | 'environment';
  updatedAt: string | null;
}

@Injectable()
export class LocationPrivacyService {
  constructor(
    private readonly config: ConfigService,
    private readonly prisma?: PrismaService,
  ) {}

  generatePublicLocation(input: PublicLocationInput): PublicLocation {
    this.assertLatitude(input.latitude);
    this.assertLongitude(input.longitude);

    const radiusMeters = this.enforceRadius(input.radiusMeters ?? this.configuredRadiusMeters());

    const secret = this.config.get<string>('LOCATION_OBFUSCATION_SECRET');
    if (!secret || secret.length < 32) {
      throw new Error('LOCATION_OBFUSCATION_SECRET must be configured.');
    }

    const digest = createHmac('sha256', secret).update(input.entityId).digest();
    const bearing = (digest.readUInt32BE(0) / 0xffffffff) * Math.PI * 2;
    const distanceRatio = Math.sqrt(digest.readUInt32BE(4) / 0xffffffff);
    const distanceMeters = Math.max(radiusMeters * 0.25, distanceRatio * radiusMeters);
    const point = this.offsetPoint(input.latitude, input.longitude, bearing, distanceMeters);

    return {
      latitude: point.latitude,
      longitude: point.longitude,
      radiusMeters,
    };
  }

  async generatePublicLocationForPublicApi(input: PublicLocationInput): Promise<PublicLocation> {
    const policy = await this.effectivePublicLocationPolicy();
    return this.generatePublicLocation({
      ...input,
      radiusMeters: policy.defaultRadiusMeters,
    });
  }

  assertLatitude(latitude: number): void {
    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
      throw new RangeError('Latitude must be between -90 and 90.');
    }
  }

  assertLongitude(longitude: number): void {
    if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
      throw new RangeError('Longitude must be between -180 and 180.');
    }
  }

  configuredRadiusMeters(): number {
    const value = this.config.get<number | string>('LOCATION_PRIVACY_RADIUS_METERS');
    return this.enforceRadius(radiusValue(value) ?? defaultRadiusMeters);
  }

  async effectivePublicLocationPolicy(): Promise<EffectivePublicLocationPolicy> {
    const environmentRadius = radiusValue(this.config.get<number | string>('LOCATION_PRIVACY_RADIUS_METERS'));
    const environmentPolicy = {
      defaultRadiusMeters: this.enforceRadius(environmentRadius ?? defaultRadiusMeters),
      maximumRadiusMeters: maximumPublicRadiusMeters,
      minimumRadiusMeters: minimumPublicRadiusMeters,
      source: environmentRadius === null ? 'default' : 'environment',
      updatedAt: null,
    } satisfies EffectivePublicLocationPolicy;

    if (!this.prisma) {
      return environmentPolicy;
    }

    const latest = await this.prisma.auditLog.findFirst({
      orderBy: { createdAt: 'desc' },
      where: {
        action: privacyPolicyAuditAction,
        entityId: privacyPolicyEntityId,
        entityType: privacyPolicyEntityType,
      },
    });

    const radius = numberFromMetadata(latest?.metadata, 'defaultRadiusMeters');
    if (radius === null) {
      return environmentPolicy;
    }

    return {
      defaultRadiusMeters: this.enforceRadius(radius),
      maximumRadiusMeters: maximumPublicRadiusMeters,
      minimumRadiusMeters: minimumPublicRadiusMeters,
      source: 'audit-log',
      updatedAt: latest?.createdAt.toISOString() ?? null,
    };
  }

  private offsetPoint(
    latitude: number,
    longitude: number,
    bearing: number,
    distanceMeters: number,
  ): GeographicPoint {
    const angularDistance = distanceMeters / earthRadiusMeters;
    const lat1 = this.toRadians(latitude);
    const lon1 = this.toRadians(longitude);

    const lat2 = Math.asin(
      Math.sin(lat1) * Math.cos(angularDistance) +
        Math.cos(lat1) * Math.sin(angularDistance) * Math.cos(bearing),
    );
    const lon2 =
      lon1 +
      Math.atan2(
        Math.sin(bearing) * Math.sin(angularDistance) * Math.cos(lat1),
        Math.cos(angularDistance) - Math.sin(lat1) * Math.sin(lat2),
      );

    return {
      latitude: this.clampLatitude(this.toDegrees(lat2)),
      longitude: this.wrapLongitude(this.toDegrees(lon2)),
    };
  }

  private toRadians(value: number): number {
    return (value * Math.PI) / 180;
  }

  private toDegrees(value: number): number {
    return (value * 180) / Math.PI;
  }

  private clampLatitude(latitude: number): number {
    return Math.max(-90, Math.min(90, latitude));
  }

  private wrapLongitude(longitude: number): number {
    return ((((longitude + 180) % 360) + 360) % 360) - 180;
  }

  private enforceRadius(radiusMeters: number): number {
    if (!Number.isFinite(radiusMeters)) {
      return defaultRadiusMeters;
    }
    return Math.min(Math.max(Math.round(radiusMeters), minimumPublicRadiusMeters), maximumPublicRadiusMeters);
  }
}

function numberFromMetadata(
  value: Prisma.JsonValue | null | undefined,
  key: string,
): number | null {
  if (!isJsonRecord(value)) {
    return null;
  }

  return numberValue(value[key]);
}

function numberValue(value: Prisma.JsonValue | undefined): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function radiusValue(value: number | string | undefined): number | null {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function isJsonRecord(
  value: Prisma.JsonValue | null | undefined,
): value is Record<string, Prisma.JsonValue> {
  return value !== null && value !== undefined && typeof value === 'object' && !Array.isArray(value);
}
