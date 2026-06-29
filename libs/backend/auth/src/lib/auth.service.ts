import { createHash } from 'node:crypto';
import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import {
  AccountStatus,
  Prisma,
  User,
  UserRole,
  VolunteerVerificationState,
} from '@prisma/client';

import { AuditService } from '@petradar/backend/audit';
import { PrismaService } from '@petradar/backend/shared';
import { UsersRepository } from '@petradar/backend/users';

import type { AccessTokenPayload, AuthenticatedUser } from './authenticated-user.js';
import { JwtTokenService } from './jwt-token.service.js';
import { PasswordService } from './password.service.js';

export interface AuthRequestContext {
  ip?: string | null;
  requestId?: string | null;
  userAgent?: string | null;
}

export interface RegisterInput {
  displayName: string;
  email: string;
  password: string;
  phone?: string | null;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthenticatedSession {
  accessToken: string;
  expiresInSeconds: number;
  refreshToken: string;
  refreshExpiresAt: Date;
  user: SafeUserResponse;
}

export interface SafeUserResponse {
  id: string;
  email: string;
  displayName: string;
  phone: string | null;
  roles: UserRole[];
  status: AccountStatus;
  volunteerVerification: VolunteerVerificationState;
  createdAt: string;
  updatedAt: string;
}

type RefreshTokenWriter = Pick<PrismaService, 'refreshToken'>;

const invalidCredentialsMessage = 'Invalid email or password.';

@Injectable()
export class AuthService {
  constructor(
    private readonly audit: AuditService,
    private readonly jwtTokens: JwtTokenService,
    private readonly passwords: PasswordService,
    private readonly prisma: PrismaService,
    private readonly users: UsersRepository,
  ) {}

  async register(input: RegisterInput, context: AuthRequestContext = {}): Promise<AuthenticatedSession> {
    const email = this.users.normalizeEmail(input.email);
    const existingUser = await this.users.findByEmail(email);

    if (existingUser) {
      await this.auditAuthEvent({
        action: 'auth.register.duplicate_email',
        entityId: email,
        metadata: { email },
        requestId: context.requestId,
      });
      throw new ConflictException('An account with this email already exists.');
    }

    const passwordHash = await this.passwords.hashPassword(input.password);
    const phone = input.phone?.trim();
    const user = await this.users.create({
      displayName: input.displayName.trim(),
      email,
      passwordHash,
      phone: phone === '' ? null : phone ?? null,
      roles: [UserRole.REPORTER],
      status: AccountStatus.ACTIVE,
      volunteerVerification: VolunteerVerificationState.NOT_APPLICABLE,
    });

    await this.auditAuthEvent({
      action: 'auth.register.success',
      actorId: user.id,
      entityId: user.id,
      metadata: { email: user.email, roles: user.roles },
      requestId: context.requestId,
    });

    return this.issueSession(user, context);
  }

  async login(input: LoginInput, context: AuthRequestContext = {}): Promise<AuthenticatedSession> {
    const email = this.users.normalizeEmail(input.email);
    const user = await this.users.findByEmail(email);
    const validPassword = user
      ? await this.passwords.verifyPassword(user.passwordHash, input.password)
      : false;

    if (!user || !validPassword) {
      await this.auditAuthEvent({
        action: 'auth.login.failure',
        entityId: email,
        metadata: { email, reason: 'invalid_credentials' },
        requestId: context.requestId,
      });
      throw new UnauthorizedException(invalidCredentialsMessage);
    }

    this.assertActiveAccount(user);

    await this.auditAuthEvent({
      action: 'auth.login.success',
      actorId: user.id,
      entityId: user.id,
      metadata: { email: user.email },
      requestId: context.requestId,
    });

    return this.issueSession(user, context);
  }

  async refresh(refreshToken: string, context: AuthRequestContext = {}): Promise<AuthenticatedSession> {
    const tokenHash = this.jwtTokens.hashRefreshToken(refreshToken);
    const now = new Date();

    return this.prisma.$transaction(async (tx) => {
      const storedToken = await tx.refreshToken.findUnique({
        include: { user: true },
        where: { tokenHash },
      });

      if (!storedToken) {
        await this.auditAuthEvent({
          action: 'auth.refresh.invalid_token',
          entityId: 'refresh_token',
          metadata: { reason: 'not_found' },
          requestId: context.requestId,
        });
        throw new UnauthorizedException('Invalid refresh token.');
      }

      if (storedToken.revokedAt) {
        await this.auditAuthEvent({
          action: 'auth.refresh.reuse_detected',
          actorId: storedToken.userId,
          entityId: storedToken.id,
          metadata: { reason: 'revoked_token_reuse' },
          requestId: context.requestId,
        });
        throw new UnauthorizedException('Invalid refresh token.');
      }

      if (storedToken.expiresAt <= now) {
        await tx.refreshToken.update({
          data: { revokedAt: now },
          where: { id: storedToken.id },
        });
        await this.auditAuthEvent({
          action: 'auth.refresh.expired',
          actorId: storedToken.userId,
          entityId: storedToken.id,
          metadata: { reason: 'expired' },
          requestId: context.requestId,
        });
        throw new UnauthorizedException('Invalid refresh token.');
      }

      this.assertActiveAccount(storedToken.user);

      const replacement = await this.createRefreshToken(storedToken.user, context, tx, now);
      await tx.refreshToken.update({
        data: {
          replacedByTokenId: replacement.id,
          revokedAt: now,
        },
        where: { id: storedToken.id },
      });

      await this.auditAuthEvent({
        action: 'auth.refresh.success',
        actorId: storedToken.userId,
        entityId: storedToken.id,
        metadata: { replacementTokenId: replacement.id },
        requestId: context.requestId,
      });

      return {
        accessToken: this.jwtTokens.signAccessToken({
          roles: storedToken.user.roles,
          userId: storedToken.user.id,
        }),
        expiresInSeconds: this.jwtTokens.accessTtlSeconds(),
        refreshExpiresAt: replacement.expiresAt,
        refreshToken: replacement.rawToken,
        user: this.toSafeUser(storedToken.user),
      };
    });
  }

  async logout(refreshToken: string | null | undefined, context: AuthRequestContext = {}): Promise<void> {
    if (!refreshToken) {
      return;
    }

    const tokenHash = this.jwtTokens.hashRefreshToken(refreshToken);
    const now = new Date();

    await this.prisma.$transaction(async (tx) => {
      const storedToken = await tx.refreshToken.findUnique({
        where: { tokenHash },
      });

      if (!storedToken || storedToken.revokedAt) {
        return;
      }

      await tx.refreshToken.update({
        data: { revokedAt: now },
        where: { id: storedToken.id },
      });

      await this.auditAuthEvent({
        action: 'auth.logout',
        actorId: storedToken.userId,
        entityId: storedToken.id,
        metadata: { reason: 'user_logout' },
        requestId: context.requestId,
      });
    });
  }

  async authenticateAccessToken(token: string): Promise<AuthenticatedUser> {
    const payload = this.jwtTokens.verifyAccessToken(token);
    return this.userFromPayload(payload);
  }

  async currentUser(userId: string): Promise<SafeUserResponse> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('Invalid access token.');
    }

    this.assertActiveAccount(user);
    return this.toSafeUser(user);
  }

  toSafeUser(user: User): SafeUserResponse {
    return {
      createdAt: user.createdAt.toISOString(),
      displayName: user.displayName,
      email: user.email,
      id: user.id,
      phone: user.phone,
      roles: user.roles,
      status: user.status,
      updatedAt: user.updatedAt.toISOString(),
      volunteerVerification: user.volunteerVerification,
    };
  }

  private async issueSession(
    user: User,
    context: AuthRequestContext,
  ): Promise<AuthenticatedSession> {
    const refreshToken = await this.createRefreshToken(user, context);
    return {
      accessToken: this.jwtTokens.signAccessToken({ roles: user.roles, userId: user.id }),
      expiresInSeconds: this.jwtTokens.accessTtlSeconds(),
      refreshExpiresAt: refreshToken.expiresAt,
      refreshToken: refreshToken.rawToken,
      user: this.toSafeUser(user),
    };
  }

  private async createRefreshToken(
    user: User,
    context: AuthRequestContext,
    tx: RefreshTokenWriter = this.prisma,
    now = new Date(),
  ): Promise<{ expiresAt: Date; id: string; rawToken: string }> {
    const rawToken = this.jwtTokens.generateRefreshToken();
    const tokenHash = this.jwtTokens.hashRefreshToken(rawToken);
    const expiresAt = this.jwtTokens.refreshExpiresAt(now);
    const storedToken = await tx.refreshToken.create({
      data: {
        expiresAt,
        ipHash: this.hashIp(context.ip),
        tokenHash,
        userAgent: context.userAgent?.slice(0, 512),
        userId: user.id,
      },
    });

    return {
      expiresAt,
      id: storedToken.id,
      rawToken,
    };
  }

  private async userFromPayload(payload: AccessTokenPayload): Promise<AuthenticatedUser> {
    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });

    if (!user) {
      throw new UnauthorizedException('Invalid access token.');
    }

    this.assertActiveAccount(user);

    return {
      displayName: user.displayName,
      email: user.email,
      id: user.id,
      roles: user.roles,
      volunteerVerification: user.volunteerVerification,
    };
  }

  private assertActiveAccount(user: User): void {
    if (user.status === AccountStatus.SUSPENDED || user.status === AccountStatus.PENDING_REVIEW) {
      throw new ForbiddenException('Account is not active.');
    }
  }

  private hashIp(ip: string | null | undefined): string | null {
    if (!ip) {
      return null;
    }

    return createHash('sha256').update(ip).digest('hex');
  }

  private async auditAuthEvent(input: {
    action: string;
    actorId?: string | null;
    entityId: string;
    metadata?: Prisma.InputJsonValue;
    requestId?: string | null;
  }): Promise<void> {
    await this.audit.create({
      action: input.action,
      actorId: input.actorId,
      entityId: input.entityId,
      entityType: 'auth',
      metadata: input.metadata,
      requestId: input.requestId,
    });
  }
}
