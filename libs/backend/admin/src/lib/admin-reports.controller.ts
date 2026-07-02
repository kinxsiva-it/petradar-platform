import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
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
import { MergeSightingDto } from './dto/merge-sighting.dto.js';
import { RejectSightingDto } from './dto/reject-sighting.dto.js';
import { AdminSightingsService } from './admin-sightings.service.js';

@ApiTags('admin-reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin')
export class AdminReportsController {
  constructor(private readonly adminSightings: AdminSightingsService) {}

  @Get('reports/pending')
  @ApiOkResponse({ description: 'Return pending animal sighting reports for Admin moderation.' })
  pendingReports(
    @CurrentUser() user: AuthenticatedUser | undefined,
    @Query() query: AdminSightingsQueryDto,
    @Req() request: Request,
  ): ReturnType<AdminSightingsService['listQueue']> {
    return this.adminSightings.listQueue(this.requireUser(user), query, contextFromRequest(request));
  }

  @Get('verification-queue')
  @ApiOkResponse({ description: 'Return the Admin animal sighting verification queue.' })
  verificationQueue(
    @CurrentUser() user: AuthenticatedUser | undefined,
    @Query() query: AdminSightingsQueryDto,
    @Req() request: Request,
  ): ReturnType<AdminSightingsService['listQueue']> {
    return this.adminSightings.listQueue(this.requireUser(user), query, contextFromRequest(request));
  }

  @Post('reports/:id/approve')
  @ApiOkResponse({ description: 'Approve one animal sighting report.' })
  approve(
    @CurrentUser() user: AuthenticatedUser | undefined,
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: Request,
  ): ReturnType<AdminSightingsService['verify']> {
    return this.adminSightings.verify(this.requireUser(user), id, contextFromRequest(request));
  }

  @Post('reports/:id/reject')
  @ApiOkResponse({ description: 'Reject one animal sighting report.' })
  reject(
    @CurrentUser() user: AuthenticatedUser | undefined,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: RejectSightingDto,
    @Req() request: Request,
  ): ReturnType<AdminSightingsService['reject']> {
    return this.adminSightings.reject(
      this.requireUser(user),
      id,
      body.reason,
      contextFromRequest(request),
    );
  }

  @Post('reports/:id/merge')
  @ApiOkResponse({ description: 'Mark one animal sighting report as duplicate of another.' })
  merge(
    @CurrentUser() user: AuthenticatedUser | undefined,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: MergeSightingDto,
    @Req() request: Request,
  ): ReturnType<AdminSightingsService['merge']> {
    return this.adminSightings.merge(
      this.requireUser(user),
      id,
      body.targetSightingId,
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
  return { requestId: request.header('x-request-id') ?? null };
}
