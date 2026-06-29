import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import {
  AccountStatus,
  User,
  UserRole,
  VolunteerVerificationState,
} from '@prisma/client';

import {
  AuthService,
  AuthorizationPolicyService,
  JwtAuthGuard,
  JwtTokenService,
  PasswordService,
  RolesGuard,
} from '@petradar/backend/auth';

import { AuthController } from './modules/auth/auth.controller.js';

function configService(values: Record<string, unknown>): ConfigService {
  return {
    get: jest.fn((key: string) => values[key]),
  } as unknown as ConfigService;
}

function user(overrides: Partial<User> = {}): User {
  return {
    createdAt: new Date('2026-06-29T00:00:00.000Z'),
    displayName: 'Nicha',
    email: 'nicha@example.com',
    id: 'user-id',
    passwordHash: 'hash',
    phone: null,
    roles: [UserRole.REPORTER],
    status: AccountStatus.ACTIVE,
    updatedAt: new Date('2026-06-29T00:10:00.000Z'),
    volunteerVerification: VolunteerVerificationState.NOT_APPLICABLE,
    ...overrides,
  };
}

function authServiceTestBed(overrides: {
  audit?: { create: jest.Mock };
  jwt?: Partial<JwtTokenService>;
  passwords?: Partial<PasswordService>;
  prisma?: Record<string, unknown>;
  users?: Record<string, unknown>;
} = {}): AuthService {
  const audit = overrides.audit ?? { create: jest.fn().mockResolvedValue({ id: 'audit-id' }) };
  const jwt = {
    accessTtlSeconds: jest.fn().mockReturnValue(900),
    generateRefreshToken: jest.fn().mockReturnValue('raw-refresh-token'),
    hashRefreshToken: jest.fn().mockReturnValue('hashed-refresh-token'),
    refreshExpiresAt: jest.fn().mockReturnValue(new Date('2026-07-29T00:00:00.000Z')),
    signAccessToken: jest.fn().mockReturnValue('access-token'),
    verifyAccessToken: jest.fn(),
    ...overrides.jwt,
  };
  const passwords = {
    hashPassword: jest.fn().mockResolvedValue('hashed-password'),
    verifyPassword: jest.fn().mockResolvedValue(true),
    ...overrides.passwords,
  };
  const refreshToken = {
    create: jest.fn().mockResolvedValue({ id: 'refresh-token-id' }),
    findUnique: jest.fn(),
    update: jest.fn(),
  };
  const prismaUser = {
    findUnique: jest.fn(),
  };
  const prisma = {
    $transaction: jest.fn(),
    refreshToken,
    user: prismaUser,
    ...overrides.prisma,
  };
  prisma.$transaction.mockImplementation((callback: (tx: typeof prisma) => unknown) =>
    Promise.resolve(callback(prisma)),
  );
  const users = {
    create: jest.fn().mockResolvedValue(user({ passwordHash: 'hashed-password' })),
    findByEmail: jest.fn().mockResolvedValue(null),
    normalizeEmail: (email: string) => email.trim().toLowerCase(),
    ...overrides.users,
  };

  return new AuthService(
    audit as never,
    jwt as never,
    passwords,
    prisma as never,
    users as never,
  );
}

describe('Auth foundation registration and login', () => {
  it('normalizes email and hashes the password during registration', async () => {
    const create = jest.fn().mockResolvedValue(user({ email: 'nicha@example.com' }));
    const hashPassword = jest.fn().mockResolvedValue('stored-hash');
    const service = authServiceTestBed({
      passwords: { hashPassword },
      users: {
        create,
        findByEmail: jest.fn().mockResolvedValue(null),
        normalizeEmail: (email: string) => email.trim().toLowerCase(),
      },
    });

    await service.register({
      displayName: ' Nicha ',
      email: ' NICHA@Example.COM ',
      password: 'correct horse battery',
    });

    expect(hashPassword).toHaveBeenCalledWith('correct horse battery');
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        displayName: 'Nicha',
        email: 'nicha@example.com',
        passwordHash: 'stored-hash',
      }),
    );
  });

  it('rejects duplicate normalized emails', async () => {
    const service = authServiceTestBed({
      users: {
        findByEmail: jest.fn().mockResolvedValue(user()),
        normalizeEmail: (email: string) => email.trim().toLowerCase(),
      },
    });

    await expect(
      service.register({
        displayName: 'Nicha',
        email: ' NICHA@Example.COM ',
        password: 'correct horse battery',
      }),
    ).rejects.toThrow('already exists');
  });

  it('uses argon2 hashes that verify and do not contain plaintext passwords', async () => {
    const passwords = new PasswordService();
    const password = 'correct horse battery';
    const hashValue = await passwords.hashPassword(password);

    expect(hashValue).not.toContain(password);
    await expect(passwords.verifyPassword(hashValue, password)).resolves.toBe(true);
  });

  it('never includes password hashes in auth responses', async () => {
    const service = authServiceTestBed();
    const response = await service.register({
      displayName: 'Nicha',
      email: 'nicha@example.com',
      password: 'correct horse battery',
    });

    expect(JSON.stringify(response)).not.toContain('hashed-password');
    expect(response.user).not.toHaveProperty('passwordHash');
  });

  it('does not trust privileged roles supplied during public registration', async () => {
    const create = jest.fn().mockResolvedValue(user());
    const service = authServiceTestBed({ users: { create, findByEmail: jest.fn().mockResolvedValue(null) } });
    const input = {
      displayName: 'Nicha',
      email: 'nicha@example.com',
      password: 'correct horse battery',
      roles: [UserRole.ADMIN, UserRole.VOLUNTEER],
    };

    await service.register(input);

    expect(create).toHaveBeenCalledWith(expect.objectContaining({ roles: [UserRole.REPORTER] }));
  });

  it('logs in with valid credentials', async () => {
    const verifyPassword = jest.fn().mockResolvedValue(true);
    const service = authServiceTestBed({
      passwords: { verifyPassword },
      users: { findByEmail: jest.fn().mockResolvedValue(user()) },
    });

    await expect(service.login({ email: 'nicha@example.com', password: 'correct' })).resolves.toMatchObject({
      accessToken: 'access-token',
      refreshToken: 'raw-refresh-token',
    });
    expect(verifyPassword).toHaveBeenCalledWith('hash', 'correct');
  });

  it('returns a generic login failure for unknown users and bad passwords', async () => {
    const missingUserService = authServiceTestBed({
      users: { findByEmail: jest.fn().mockResolvedValue(null) },
    });
    const wrongPasswordService = authServiceTestBed({
      passwords: { verifyPassword: jest.fn().mockResolvedValue(false) },
      users: { findByEmail: jest.fn().mockResolvedValue(user()) },
    });

    await expect(
      missingUserService.login({ email: 'missing@example.com', password: 'wrong' }),
    ).rejects.toThrow('Invalid email or password.');
    await expect(
      wrongPasswordService.login({ email: 'nicha@example.com', password: 'wrong' }),
    ).rejects.toThrow('Invalid email or password.');
  });

  it('rejects disabled accounts', async () => {
    const service = authServiceTestBed({
      users: { findByEmail: jest.fn().mockResolvedValue(user({ status: AccountStatus.SUSPENDED })) },
    });

    await expect(service.login({ email: 'nicha@example.com', password: 'correct' })).rejects.toThrow(
      ForbiddenException,
    );
  });
});

describe('Auth foundation tokens and sessions', () => {
  const jwt = new JwtTokenService(
    configService({
      ACCESS_TOKEN_TTL_SECONDS: 900,
      JWT_ACCESS_SECRET: 'a-secure-access-secret-that-is-long-enough',
      JWT_REFRESH_SECRET: 'a-secure-refresh-secret-that-is-long-enough',
      REFRESH_TOKEN_TTL_DAYS: 30,
    }),
  );

  it('creates minimal JWT access-token payloads', () => {
    const token = jwt.signAccessToken({ roles: [UserRole.REPORTER], userId: 'user-id' });
    const payload = jwt.verifyAccessToken(token);

    expect(payload).toMatchObject({
      roles: [UserRole.REPORTER],
      sub: 'user-id',
      typ: 'access',
    });
    expect(payload).toHaveProperty('iat');
    expect(payload).toHaveProperty('exp');
    expect(JSON.stringify(payload)).not.toContain('phone');
    expect(JSON.stringify(payload)).not.toContain('password');
  });

  it('hashes refresh tokens before storage and lookup', () => {
    const rawToken = 'raw-refresh-token';

    expect(jwt.hashRefreshToken(rawToken)).toBe(jwt.hashRefreshToken(rawToken));
    expect(jwt.hashRefreshToken(rawToken)).not.toBe(rawToken);
  });

  it('rotates refresh tokens and revokes the used token', async () => {
    interface RefreshTokenUpdateArgs {
      data: { replacedByTokenId?: string; revokedAt: Date };
      where: { id: string };
    }
    const storedUser = user();
    const update = jest.fn<Promise<{ id: string }>, [RefreshTokenUpdateArgs]>().mockResolvedValue({ id: 'old-token' });
    const prisma = {
      refreshToken: {
        create: jest.fn().mockResolvedValue({ id: 'new-token' }),
        findUnique: jest.fn().mockResolvedValue({
          expiresAt: new Date('2999-01-01T00:00:00.000Z'),
          id: 'old-token',
          revokedAt: null,
          user: storedUser,
          userId: storedUser.id,
        }),
        update,
      },
      user: { findUnique: jest.fn() },
    };
    const service = authServiceTestBed({
      prisma: {
        ...prisma,
        $transaction: jest.fn((callback: (tx: typeof prisma) => unknown) =>
          Promise.resolve(callback(prisma)),
        ),
      },
    });

    await service.refresh('raw-refresh-token');

    const [updateArgs] = update.mock.calls[0] ?? [];
    expect(updateArgs?.data.replacedByTokenId).toBe('new-token');
    expect(updateArgs?.data.revokedAt).toBeInstanceOf(Date);
    expect(updateArgs?.where).toEqual({ id: 'old-token' });
  });

  it('rejects revoked refresh-token reuse', async () => {
    const service = authServiceTestBed({
      prisma: {
        refreshToken: {
          create: jest.fn(),
          findUnique: jest.fn().mockResolvedValue({
            expiresAt: new Date('2999-01-01T00:00:00.000Z'),
            id: 'old-token',
            revokedAt: new Date('2026-06-29T00:00:00.000Z'),
            user: user(),
            userId: 'user-id',
          }),
          update: jest.fn(),
        },
      },
    });

    await expect(service.refresh('raw-refresh-token')).rejects.toThrow(UnauthorizedException);
  });

  it('revokes refresh tokens during logout', async () => {
    interface LogoutUpdateArgs {
      data: { revokedAt: Date };
      where: { id: string };
    }
    const update = jest.fn<Promise<{ id: string }>, [LogoutUpdateArgs]>().mockResolvedValue({ id: 'token-id' });
    const prisma = {
      refreshToken: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'token-id',
          revokedAt: null,
          userId: 'user-id',
        }),
        update,
      },
    };
    const service = authServiceTestBed({
      prisma: {
        ...prisma,
        $transaction: jest.fn((callback: (tx: typeof prisma) => unknown) =>
          Promise.resolve(callback(prisma)),
        ),
      },
    });

    await service.logout('raw-refresh-token');

    const [updateArgs] = update.mock.calls[0] ?? [];
    expect(updateArgs?.data.revokedAt).toBeInstanceOf(Date);
    expect(updateArgs?.where).toEqual({ id: 'token-id' });
  });

  it('sets HttpOnly refresh-token cookies with a limited auth path', async () => {
    const controller = new AuthController(
      authServiceTestBed({
        users: { findByEmail: jest.fn().mockResolvedValue(user()) },
      }),
      configService({ API_PREFIX: 'api/v1', NODE_ENV: 'production' }) as unknown as ConfigService<
        never,
        true
      >,
    );
    const response = { cookie: jest.fn() };
    const request = {
      header: jest.fn().mockReturnValue(null),
      ip: '127.0.0.1',
    };

    await controller.login(
      { email: 'nicha@example.com', password: 'correct' },
      request as never,
      response as never,
    );

    expect(response.cookie).toHaveBeenCalledWith(
      'petradar_refresh_token',
      'raw-refresh-token',
      expect.objectContaining({
        httpOnly: true,
        path: '/api/v1/auth',
        sameSite: 'lax',
        secure: true,
      }),
    );
  });
});

describe('Auth foundation authorization', () => {
  it('allows and denies roles through the roles guard', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue([UserRole.ADMIN]),
    };
    const guard = new RolesGuard(reflector as unknown as Reflector);
    const context = {
      getClass: jest.fn(),
      getHandler: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({ user: { roles: [UserRole.ADMIN] } }),
      }),
    };
    const deniedContext = {
      ...context,
      switchToHttp: () => ({
        getRequest: () => ({ user: { roles: [UserRole.REPORTER] } }),
      }),
    };

    expect(guard.canActivate(context as never)).toBe(true);
    expect(() => guard.canActivate(deniedContext as never)).toThrow(ForbiddenException);
  });

  it('authenticates bearer tokens and attaches the current user foundation', async () => {
    const authenticated = {
      displayName: 'Nicha',
      email: 'nicha@example.com',
      id: 'user-id',
      roles: [UserRole.REPORTER],
      volunteerVerification: VolunteerVerificationState.NOT_APPLICABLE,
    };
    const auth = {
      authenticateAccessToken: jest.fn().mockResolvedValue(authenticated),
    };
    const guard = new JwtAuthGuard(auth as never);
    const request = {
      header: jest.fn().mockReturnValue('Bearer access-token'),
    };
    const context = {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    };

    await expect(guard.canActivate(context as never)).resolves.toBe(true);
    expect(request).toHaveProperty('user', authenticated);
  });

  it('defaults exact-location authorization to deny', () => {
    const policy = new AuthorizationPolicyService();

    expect(policy.canAccessExactLocation({ user: null })).toBe(false);
    expect(
      policy.canAccessExactLocation({
        user: {
          displayName: 'Nicha',
          email: 'nicha@example.com',
          id: 'user-id',
          roles: [UserRole.REPORTER],
          volunteerVerification: VolunteerVerificationState.NOT_APPLICABLE,
        },
      }),
    ).toBe(false);
  });

  it('allows admins to access exact locations', () => {
    const policy = new AuthorizationPolicyService();

    expect(
      policy.canAccessExactLocation({
        user: {
          displayName: 'Admin',
          email: 'admin@example.com',
          id: 'admin-id',
          roles: [UserRole.ADMIN],
          volunteerVerification: VolunteerVerificationState.NOT_APPLICABLE,
        },
      }),
    ).toBe(true);
  });

  it('allows owners only when explicitly permitted', () => {
    const policy = new AuthorizationPolicyService();
    const owner = {
      displayName: 'Nicha',
      email: 'nicha@example.com',
      id: 'owner-id',
      roles: [UserRole.REPORTER],
      volunteerVerification: VolunteerVerificationState.NOT_APPLICABLE,
    };

    expect(policy.canAccessExactLocation({ ownerId: 'owner-id', user: owner })).toBe(false);
    expect(policy.canAccessExactLocation({ allowOwner: true, ownerId: 'owner-id', user: owner })).toBe(true);
  });

  it('allows verified assigned volunteers only when explicitly permitted', () => {
    const policy = new AuthorizationPolicyService();
    const volunteer = {
      displayName: 'Volunteer',
      email: 'volunteer@example.com',
      id: 'volunteer-id',
      roles: [UserRole.VOLUNTEER],
      volunteerVerification: VolunteerVerificationState.VERIFIED,
    };

    expect(
      policy.canAccessExactLocation({
        assignedVolunteerIds: ['volunteer-id'],
        user: volunteer,
      }),
    ).toBe(false);
    expect(
      policy.canAccessExactLocation({
        allowAssignedVolunteer: true,
        assignedVolunteerIds: ['volunteer-id'],
        user: volunteer,
      }),
    ).toBe(true);
  });

  it('sanitizes authentication audit metadata', async () => {
    const audit = { create: jest.fn().mockResolvedValue({ id: 'audit-id' }) };
    const service = authServiceTestBed({
      audit,
      users: { findByEmail: jest.fn().mockResolvedValue(null) },
    });

    await service.register({
      displayName: 'Nicha',
      email: 'nicha@example.com',
      password: 'correct horse battery',
    });

    expect(JSON.stringify(audit.create.mock.calls)).not.toContain('correct horse battery');
    expect(JSON.stringify(audit.create.mock.calls)).not.toContain('raw-refresh-token');
  });
});
