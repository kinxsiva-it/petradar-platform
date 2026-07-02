import { Controller, Get, Query, UnauthorizedException, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

import { CurrentUser, JwtAuthGuard, Roles, RolesGuard, type AuthenticatedUser } from '@petradar/backend/auth';

import { AdminAuditLogsService } from './admin-audit-logs.service.js';
import { AdminAuditLogsQueryDto } from './dto/admin-audit-logs-query.dto.js';

@ApiTags('admin-audit-logs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/audit-logs')
export class AdminAuditLogsController {
  constructor(private readonly auditLogs: AdminAuditLogsService) {}

  @Get()
  @ApiOkResponse({ description: 'Return sanitized Admin audit log summaries.' })
  list(
    @CurrentUser() user: AuthenticatedUser | undefined,
    @Query() query: AdminAuditLogsQueryDto,
  ): ReturnType<AdminAuditLogsService['list']> {
    this.requireUser(user);
    return this.auditLogs.list(query);
  }

  private requireUser(user: AuthenticatedUser | undefined): AuthenticatedUser {
    if (!user) {
      throw new UnauthorizedException('Authentication required.');
    }
    return user;
  }
}
