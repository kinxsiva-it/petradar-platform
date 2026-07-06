import {
  Body,
  Controller,
  Get,
  Patch,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import type { Request } from 'express';

import {
  CurrentUser,
  JwtAuthGuard,
  Roles,
  RolesGuard,
  type AuthenticatedUser,
} from '@petradar/backend/auth';

import { AdminPrivacyPolicyService } from './admin-privacy-policy.service.js';
import { UpdateAdminPrivacyPolicyDto } from './dto/admin-privacy-policy.dto.js';

@ApiTags('admin-privacy-policy')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/privacy-policy')
export class AdminPrivacyPolicyController {
  constructor(private readonly privacy: AdminPrivacyPolicyService) {}

  @Get()
  @ApiOkResponse({ description: 'Return the effective Admin privacy and moderation center state.' })
  detail(): ReturnType<AdminPrivacyPolicyService['detail']> {
    return this.privacy.detail();
  }

  @Patch('public-location')
  @ApiOkResponse({ description: 'Update the supported public-location privacy policy.' })
  updatePublicLocationPolicy(
    @CurrentUser() user: AuthenticatedUser | undefined,
    @Body() body: UpdateAdminPrivacyPolicyDto,
    @Req() request: Request,
  ): ReturnType<AdminPrivacyPolicyService['updatePublicLocationPolicy']> {
    return this.privacy.updatePublicLocationPolicy(
      this.requireUser(user),
      body.defaultRadiusMeters,
      contextFromRequest(request),
    );
  }

  private requireUser(user: AuthenticatedUser | undefined): AuthenticatedUser {
    if (!user) {
      throw new UnauthorizedException('Authentication required.');
    }
    return user;
  }
}

function contextFromRequest(request: Request): { requestId?: string | null } {
  return {
    requestId: request.header('x-request-id') ?? null,
  };
}
