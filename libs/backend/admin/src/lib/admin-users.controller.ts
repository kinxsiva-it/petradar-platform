import { Controller, Get, Param, ParseUUIDPipe, Query, UnauthorizedException, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

import { CurrentUser, JwtAuthGuard, Roles, RolesGuard, type AuthenticatedUser } from '@petradar/backend/auth';

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

  private requireUser(user: AuthenticatedUser | undefined): AuthenticatedUser {
    if (!user) {
      throw new UnauthorizedException('Authentication required.');
    }
    return user;
  }
}
