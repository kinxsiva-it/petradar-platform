import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '@prisma/client';

import type { AccessTokenPayload } from './authenticated-user.js';

interface TokenHeader {
  alg: string;
  typ: string;
}

interface DecodedAccessTokenPayload {
  exp?: unknown;
  iat?: unknown;
  roles?: unknown;
  sub?: unknown;
  typ?: unknown;
}

const tokenHeader: TokenHeader = { alg: 'HS256', typ: 'JWT' };

@Injectable()
export class JwtTokenService {
  constructor(private readonly config: ConfigService) {}

  signAccessToken(input: { userId: string; roles: UserRole[] }): string {
    const issuedAt = this.nowSeconds();
    const expiresAt = issuedAt + this.accessTtlSeconds();
    const payload: AccessTokenPayload = {
      exp: expiresAt,
      iat: issuedAt,
      roles: input.roles,
      sub: input.userId,
      typ: 'access',
    };

    return this.sign(tokenHeader, payload, this.accessSecret());
  }

  verifyAccessToken(token: string): AccessTokenPayload {
    const payload = this.verify(token, this.accessSecret());

    if (payload.exp <= this.nowSeconds()) {
      throw new UnauthorizedException('Access token expired.');
    }

    return payload;
  }

  generateRefreshToken(): string {
    return randomBytes(48).toString('base64url');
  }

  hashRefreshToken(token: string): string {
    return createHmac('sha256', this.refreshSecret()).update(token).digest('hex');
  }

  accessTtlSeconds(): number {
    const value = this.config.get<number>('ACCESS_TOKEN_TTL_SECONDS');
    return value ?? 900;
  }

  refreshTtlDays(): number {
    const value = this.config.get<number>('REFRESH_TOKEN_TTL_DAYS');
    return value ?? 30;
  }

  refreshExpiresAt(now = new Date()): Date {
    return new Date(now.getTime() + this.refreshTtlDays() * 24 * 60 * 60 * 1000);
  }

  private sign(header: TokenHeader, payload: AccessTokenPayload, secret: string): string {
    const encodedHeader = this.encodeJson(header);
    const encodedPayload = this.encodeJson(payload);
    const signature = this.signature(`${encodedHeader}.${encodedPayload}`, secret);
    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }

  private verify(token: string, secret: string): AccessTokenPayload {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new UnauthorizedException('Invalid access token.');
    }

    const [encodedHeader, encodedPayload, encodedSignature] = parts;
    if (!encodedHeader || !encodedPayload || !encodedSignature) {
      throw new UnauthorizedException('Invalid access token.');
    }

    const expectedSignature = this.signature(`${encodedHeader}.${encodedPayload}`, secret);
    if (!this.safeEqual(encodedSignature, expectedSignature)) {
      throw new UnauthorizedException('Invalid access token.');
    }

    const header = this.decodeJson(encodedHeader);
    if (!this.isTokenHeader(header)) {
      throw new UnauthorizedException('Invalid access token.');
    }

    if (header.alg !== 'HS256' || header.typ !== 'JWT') {
      throw new UnauthorizedException('Invalid access token.');
    }

    const payload = this.decodeJson(encodedPayload);
    if (!this.isAccessTokenPayload(payload)) {
      throw new UnauthorizedException('Invalid access token.');
    }

    return payload;
  }

  private signature(value: string, secret: string): string {
    return createHmac('sha256', secret).update(value).digest('base64url');
  }

  private encodeJson(value: object): string {
    return Buffer.from(JSON.stringify(value)).toString('base64url');
  }

  private decodeJson(value: string): unknown {
    try {
      return JSON.parse(Buffer.from(value, 'base64url').toString('utf8')) as unknown;
    } catch {
      throw new UnauthorizedException('Invalid access token.');
    }
  }

  private isTokenHeader(value: unknown): value is TokenHeader {
    return (
      typeof value === 'object' &&
      value !== null &&
      'alg' in value &&
      'typ' in value &&
      typeof value.alg === 'string' &&
      typeof value.typ === 'string'
    );
  }

  private isAccessTokenPayload(value: unknown): value is AccessTokenPayload {
    if (typeof value !== 'object' || value === null) {
      return false;
    }

    const payload = value as DecodedAccessTokenPayload;
    return (
      typeof payload.sub === 'string' &&
      Array.isArray(payload.roles) &&
      payload.roles.every((role) => typeof role === 'string') &&
      payload.typ === 'access' &&
      typeof payload.iat === 'number' &&
      typeof payload.exp === 'number'
    );
  }

  private safeEqual(left: string, right: string): boolean {
    const leftBuffer = Buffer.from(left);
    const rightBuffer = Buffer.from(right);
    return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
  }

  private accessSecret(): string {
    const secret = this.config.get<string>('JWT_ACCESS_SECRET');
    if (!secret || secret.length < 32) {
      throw new Error('JWT_ACCESS_SECRET must be configured.');
    }
    return secret;
  }

  private refreshSecret(): string {
    const secret = this.config.get<string>('JWT_REFRESH_SECRET');
    if (!secret || secret.length < 32) {
      throw new Error('JWT_REFRESH_SECRET must be configured.');
    }
    return secret;
  }

  private nowSeconds(): number {
    return Math.floor(Date.now() / 1000);
  }
}
