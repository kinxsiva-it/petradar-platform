import { Module } from '@nestjs/common';

import { AuditModule } from '@petradar/backend/audit';
import { PrismaModule } from '@petradar/backend/shared';
import { BackendUsersModule } from '@petradar/backend/users';

import { AuthService } from './auth.service.js';
import { AuthorizationPolicyService } from './authorization-policy.service.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import { RolesGuard } from './guards/roles.guard.js';
import { JwtTokenService } from './jwt-token.service.js';
import { PasswordService } from './password.service.js';

@Module({
  exports: [
    AuthService,
    AuthorizationPolicyService,
    JwtAuthGuard,
    JwtTokenService,
    PasswordService,
    RolesGuard,
  ],
  imports: [AuditModule, BackendUsersModule, PrismaModule],
  providers: [
    AuthService,
    AuthorizationPolicyService,
    JwtAuthGuard,
    JwtTokenService,
    PasswordService,
    RolesGuard,
  ],
})
export class BackendAuthModule {}
