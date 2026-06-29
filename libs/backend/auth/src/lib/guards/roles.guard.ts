import type { CanActivate, ExecutionContext } from '@nestjs/common';
import { ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import type { Request } from 'express';

import type { AuthenticatedRequest } from '../authenticated-user.js';
import { requiredRolesMetadataKey } from '../decorators/roles.decorator.js';

type RequestWithUser = Request & AuthenticatedRequest;

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[] | undefined>(
      requiredRolesMetadataKey,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const userRoles = request.user?.roles ?? [];
    const allowed = requiredRoles.some((role) => userRoles.includes(role));

    if (!allowed) {
      throw new ForbiddenException('Insufficient role.');
    }

    return true;
  }
}
