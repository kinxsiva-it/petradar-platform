import type { CanActivate, ExecutionContext } from '@nestjs/common';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';

import type { AuthenticatedRequest } from '../authenticated-user.js';
import { AuthService } from '../auth.service.js';

type RequestWithUser = Request & AuthenticatedRequest;

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const token = this.extractBearerToken(request);

    request.user = await this.auth.authenticateAccessToken(token);
    return true;
  }

  private extractBearerToken(request: Request): string {
    const authorization = request.header('authorization');
    if (!authorization) {
      throw new UnauthorizedException('Authentication required.');
    }

    const [scheme, token] = authorization.split(' ');
    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedException('Authentication required.');
    }

    return token;
  }
}
