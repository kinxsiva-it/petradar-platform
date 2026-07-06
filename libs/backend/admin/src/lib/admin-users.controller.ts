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

import { CurrentUser, JwtAuthGuard, Roles, RolesGuard, type AuthenticatedUser } from '@petradar/backend/auth';

import {
  UpdateAdminUserRolesDto,
  UpdateAdminUserStatusDto,
  UpdateAdminUserVolunteerVerificationDto,
} from './dto/admin-user-actions.dto.js';
import { AdminUsersQueryDto } from './dto/admin-users-query.dto.js';
import { AdminUsersService } from './admin-users.service.js';

@ApiTags('admin-users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/users')
export class AdminUsersController {
  constructor(private readonly users: AdminUsersService) {}

  @Get()
  @ApiOkResponse({ description: 'Return safe Admin user summaries.' })
  list(
    @CurrentUser() user: AuthenticatedUser | undefined,
    @Query() query: AdminUsersQueryDto,
  ): ReturnType<AdminUsersService['list']> {
    this.requireUser(user);
    return this.users.list(query);
  }

  @Get(':id')
  @ApiOkResponse({ description: 'Return safe Admin user detail.' })
  detail(
    @CurrentUser() user: AuthenticatedUser | undefined,
    @Param('id', ParseUUIDPipe) id: string,
  ): ReturnType<AdminUsersService['detail']> {
    this.requireUser(user);
    return this.users.detail(id);
  }

  @Patch(':id/roles')
  @ApiOkResponse({ description: 'Update safe role assignments for one user.' })
  updateRoles(
    @CurrentUser() user: AuthenticatedUser | undefined,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateAdminUserRolesDto,
    @Req() request: Request,
  ): ReturnType<AdminUsersService['updateRoles']> {
    return this.users.updateRoles(this.requireUser(user), id, body.roles, contextFromRequest(request));
  }

  @Patch(':id/status')
  @ApiOkResponse({ description: 'Update account status for one user.' })
  updateStatus(
    @CurrentUser() user: AuthenticatedUser | undefined,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateAdminUserStatusDto,
    @Req() request: Request,
  ): ReturnType<AdminUsersService['updateStatus']> {
    return this.users.updateStatus(this.requireUser(user), id, body.status, contextFromRequest(request));
  }

  @Patch(':id/volunteer-verification')
  @ApiOkResponse({ description: 'Update volunteer verification state for one user.' })
  updateVolunteerVerification(
    @CurrentUser() user: AuthenticatedUser | undefined,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateAdminUserVolunteerVerificationDto,
    @Req() request: Request,
  ): ReturnType<AdminUsersService['updateVolunteerVerification']> {
    return this.users.updateVolunteerVerification(
      this.requireUser(user),
      id,
      body.volunteerVerification,
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
