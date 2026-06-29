import { createHmac } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

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

@Injectable()
export class LocationPrivacyService {
  constructor(private readonly config: ConfigService) {}

  generatePublicLocation(input: PublicLocationInput): PublicLocation {
    this.assertLatitude(input.latitude);
    this.assertLongitude(input.longitude);

    const radiusMeters = input.radiusMeters ?? this.configuredRadiusMeters();
    if (!Number.isFinite(radiusMeters) || radiusMeters <= 0) {
      throw new RangeError('Privacy radius must be greater than zero.');
    }

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
    const value = this.config.get<number>('LOCATION_PRIVACY_RADIUS_METERS');
    return value ?? defaultRadiusMeters;
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
}
