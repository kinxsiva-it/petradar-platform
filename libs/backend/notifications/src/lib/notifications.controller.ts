import { Controller, Get, Patch, Param, ParseUUIDPipe, Query, UnauthorizedException, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { CurrentUser, JwtAuthGuard, type AuthenticatedUser } from '@petradar/backend/auth';

import { NotificationsQueryDto } from './dto/notifications-query.dto.js';
import { NotificationsService } from './notifications.service.js';

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  @ApiOkResponse({ description: 'Return an authenticated user notification page using an opaque cursor.' })
  list(@CurrentUser() user: AuthenticatedUser | undefined, @Query() query: NotificationsQueryDto) {
    return this.notifications.listForUser(requireUserId(user), query);
  }

  @Get('unread-count')
  @ApiOkResponse()
  unreadCount(@CurrentUser() user: AuthenticatedUser | undefined) {
    return this.notifications.getUnreadCount(requireUserId(user));
  }

  @Patch('read-all')
  @ApiOkResponse()
  markAllRead(@CurrentUser() user: AuthenticatedUser | undefined) {
    return this.notifications.markAllAsRead(requireUserId(user));
  }

  @Patch(':id/read')
  @ApiOkResponse()
  markRead(
    @CurrentUser() user: AuthenticatedUser | undefined,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.notifications.markAsRead(requireUserId(user), id);
  }
}

function requireUserId(user: AuthenticatedUser | undefined): string {
  if (!user) throw new UnauthorizedException('Authentication required.');
  return user.id;
}
