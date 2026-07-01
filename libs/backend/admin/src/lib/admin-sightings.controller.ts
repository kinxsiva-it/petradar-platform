import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
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

import { AdminSightingsQueryDto } from './dto/admin-sightings-query.dto.js';
import { RejectSightingDto } from './dto/reject-sighting.dto.js';
import {
  AdminModerationDetailResponse,
  AdminModerationQueueResponse,
  AdminSightingsService,
} from './admin-sightings.service.js';

@ApiTags('admin-sightings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/sightings')
export class AdminSightingsController {
  constructor(private readonly adminSightings: AdminSightingsService) {}

  @Get()
  @ApiOkResponse({ description: 'Return the Admin animal sighting moderation queue.' })
  list(
    @CurrentUser() user: AuthenticatedUser | undefined,
    @Query() query: AdminSightingsQueryDto,
    @Req() request: Request,
  ): Promise<AdminModerationQueueResponse> {
    return this.adminSightings.listQueue(this.requireUser(user), query, contextFromRequest(request));
  }

  @Get(':id')
  @ApiOkResponse({ description: 'Return Admin moderation detail for one animal sighting.' })
  detail(
    @CurrentUser() user: AuthenticatedUser | undefined,
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: Request,
  ): Promise<AdminModerationDetailResponse> {
    return this.adminSightings.detail(this.requireUser(user), id, contextFromRequest(request));
  }

  @Patch(':id/verify')
  @ApiOkResponse({ description: 'Verify one pending animal sighting.' })
  verify(
    @CurrentUser() user: AuthenticatedUser | undefined,
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: Request,
  ): Promise<AdminModerationDetailResponse> {
    return this.adminSightings.verify(this.requireUser(user), id, contextFromRequest(request));
  }

  @Patch(':id/reject')
  @ApiOkResponse({ description: 'Reject one pending animal sighting with a required reason.' })
  reject(
    @CurrentUser() user: AuthenticatedUser | undefined,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: RejectSightingDto,
    @Req() request: Request,
  ): Promise<AdminModerationDetailResponse> {
    return this.adminSightings.reject(
      this.requireUser(user),
      id,
      body.reason,
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
