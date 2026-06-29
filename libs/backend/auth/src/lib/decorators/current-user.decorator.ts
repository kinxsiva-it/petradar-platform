import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

import type { AuthenticatedRequest, AuthenticatedUser } from '../authenticated-user.js';

type RequestWithUser = Request & AuthenticatedRequest;

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedUser | undefined => {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    return request.user;
  },
);
