import {
  Body,
  Controller,
  Get,
  Patch,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';

import { CurrentUser, JwtAuthGuard, type AuthenticatedUser } from '@petradar/backend/auth';

import { CreateSightingDto } from './dto/create-sighting.dto.js';
import { ListSightingsQueryDto } from './dto/list-sightings-query.dto.js';
import { UpdateSightingDto } from './dto/update-sighting.dto.js';
import type {
  AuthorizedSightingResponse,
  PaginatedSightingsResponse,
  PublicSightingResponse,
} from './sighting-response.mapper.js';
import { SightingsService } from './sightings.service.js';

@ApiTags('sightings')
@Controller('sightings')
export class SightingsController {
  constructor(private readonly sightings: SightingsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiCreatedResponse({ description: 'Create an owned animal sighting.' })
  create(
    @CurrentUser() user: AuthenticatedUser | undefined,
    @Body() body: CreateSightingDto,
    @Req() request: Request,
  ): Promise<AuthorizedSightingResponse> {
    return this.sightings.create(this.requireUser(user), body, this.contextFromRequest(request));
  }

  @Get()
  @ApiOkResponse({ description: 'Return public-safe animal sightings.' })
  listPublic(
    @Query() query: ListSightingsQueryDto,
  ): Promise<PaginatedSightingsResponse<PublicSightingResponse>> {
    return this.sightings.listPublic(query);
  }

  @Get('mine')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'Return sightings owned by the authenticated user.' })
  listMine(
    @CurrentUser() user: AuthenticatedUser | undefined,
    @Query() query: ListSightingsQueryDto,
  ): Promise<PaginatedSightingsResponse<AuthorizedSightingResponse>> {
    return this.sightings.listMine(this.requireUser(user), query);
  }

  @Get('mine/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'Return one owned sighting with authorized exact location.' })
  findMine(
    @CurrentUser() user: AuthenticatedUser | undefined,
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: Request,
  ): Promise<AuthorizedSightingResponse> {
    return this.sightings.findMine(this.requireUser(user), id, this.contextFromRequest(request));
  }

  @Get(':id')
  @ApiOkResponse({ description: 'Return one public-safe animal sighting.' })
  findPublic(@Param('id', ParseUUIDPipe) id: string): Promise<PublicSightingResponse> {
    return this.sightings.findPublic(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'Update an editable owned animal sighting.' })
  update(
    @CurrentUser() user: AuthenticatedUser | undefined,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateSightingDto,
    @Req() request: Request,
  ): Promise<AuthorizedSightingResponse> {
    return this.sightings.update(
      this.requireUser(user),
      id,
      body,
      this.contextFromRequest(request),
    );
  }

  private requireUser(user: AuthenticatedUser | undefined): AuthenticatedUser {
    if (!user) {
      throw new UnauthorizedException('Authentication required.');
    }

    return user;
  }

  private contextFromRequest(request: Request): { requestId?: string | null } {
    return {
      requestId: request.header('x-request-id') ?? null,
    };
  }
}
