import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

import {
  CurrentUser,
  JwtAuthGuard,
  Roles,
  RolesGuard,
  type AuthenticatedUser,
} from '@petradar/backend/auth';

import { ListMatchesQueryDto, RejectMatchDto } from './dto/matches.dto.js';
import { MatchingService } from './matching.service.js';

@ApiTags('matches')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('matches')
export class MatchingController {
  constructor(private readonly matching: MatchingService) {}

  @Get()
  @ApiOkResponse({ description: 'List role-scoped match results.' })
  list(
    @CurrentUser() user: AuthenticatedUser | undefined,
    @Query() query: ListMatchesQueryDto,
  ): ReturnType<MatchingService['list']> {
    return this.matching.list(this.requireUser(user), query);
  }

  @Get(':id')
  @ApiOkResponse({ description: 'Return one accessible match result.' })
  detail(
    @CurrentUser() user: AuthenticatedUser | undefined,
    @Param('id', ParseUUIDPipe) id: string,
  ): ReturnType<MatchingService['detail']> {
    return this.matching.detail(this.requireUser(user), id);
  }

  @Post(':id/confirm')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOkResponse({ description: 'Confirm a pending match result.' })
  confirm(
    @CurrentUser() user: AuthenticatedUser | undefined,
    @Param('id', ParseUUIDPipe) id: string,
  ): ReturnType<MatchingService['confirm']> {
    return this.matching.confirm(this.requireUser(user), id);
  }

  @Post(':id/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOkResponse({ description: 'Reject a pending match result.' })
  reject(
    @CurrentUser() user: AuthenticatedUser | undefined,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: RejectMatchDto,
  ): ReturnType<MatchingService['reject']> {
    return this.matching.reject(this.requireUser(user), id, body.reason);
  }

  private requireUser(user: AuthenticatedUser | undefined): AuthenticatedUser {
    if (!user) {
      throw new UnauthorizedException('Authentication required.');
    }
    return user;
  }
}
