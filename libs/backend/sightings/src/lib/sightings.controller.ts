import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Patch,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  Res,
  StreamableFile,
  UnauthorizedException,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { FilesInterceptor } from '@nestjs/platform-express';
import { UserRole } from '@prisma/client';
import type { Request, Response } from 'express';

import {
  CurrentUser,
  JwtAuthGuard,
  Roles,
  RolesGuard,
  type AuthenticatedUser,
} from '@petradar/backend/auth';

import { CreateSightingDto } from './dto/create-sighting.dto.js';
import { ListSightingsQueryDto } from './dto/list-sightings-query.dto.js';
import { RejectSightingDto } from './dto/reject-sighting.dto.js';
import { UpdateSightingDto } from './dto/update-sighting.dto.js';
import {
  maxSightingPhotoBytes,
  maxSightingPhotosPerRequest,
  type UploadedSightingPhotoFile,
} from './photos/sighting-photo-validation.js';
import type {
  AuthorizedSightingResponse,
  PaginatedSightingsResponse,
  PublicSightingResponse,
  SightingPhotoResponse,
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

  @Get('photos/:photoId/file')
  @Header('Cache-Control', 'public, max-age=300')
  async readPublicPhoto(
    @Param('photoId', ParseUUIDPipe) photoId: string,
    @Res({ passthrough: true }) response: Response,
  ): Promise<StreamableFile> {
    const file = await this.sightings.readPublicPhoto(photoId);
    response.contentType(file.mimeType);
    return new StreamableFile(file.buffer);
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

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'Close an editable owned animal sighting or Admin-managed report.' })
  close(
    @CurrentUser() user: AuthenticatedUser | undefined,
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: Request,
  ): Promise<{ success: true }> {
    return this.sightings.close(this.requireUser(user), id, this.contextFromRequest(request));
  }

  @Post(':id/verify')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'Verify one animal sighting.' })
  verify(
    @CurrentUser() user: AuthenticatedUser | undefined,
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: Request,
  ): Promise<AuthorizedSightingResponse> {
    return this.sightings.verify(this.requireUser(user), id, this.contextFromRequest(request));
  }

  @Post(':id/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'Reject one animal sighting with a reason.' })
  reject(
    @CurrentUser() user: AuthenticatedUser | undefined,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: RejectSightingDto,
    @Req() request: Request,
  ): Promise<AuthorizedSightingResponse> {
    return this.sightings.reject(
      this.requireUser(user),
      id,
      body.reason,
      this.contextFromRequest(request),
    );
  }

  @Post(':id/convert-to-rescue')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiCreatedResponse({ description: 'Convert one animal sighting into a rescue case.' })
  convertToRescue(
    @CurrentUser() user: AuthenticatedUser | undefined,
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: Request,
  ): Promise<{
    id: string;
    caseNumber: string;
    sightingId: string;
    severity: string;
    status: string;
    summary: string;
    createdAt: string;
  }> {
    return this.sightings.convertToRescue(
      this.requireUser(user),
      id,
      this.contextFromRequest(request),
    );
  }

  @Post(':id/photos')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FilesInterceptor('photos', maxSightingPhotosPerRequest, {
      limits: {
        fileSize: maxSightingPhotoBytes,
        files: maxSightingPhotosPerRequest,
      },
    }),
  )
  @ApiBearerAuth()
  @ApiCreatedResponse({ description: 'Upload photos for an editable owned animal sighting.' })
  uploadPhotos(
    @CurrentUser() user: AuthenticatedUser | undefined,
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFiles() files: UploadedSightingPhotoFile[] | undefined,
    @Req() request: Request,
  ): Promise<{ photos: SightingPhotoResponse[] }> {
    return this.sightings.uploadPhotos(
      this.requireUser(user),
      id,
      files ?? [],
      this.contextFromRequest(request),
    );
  }

  @Delete(':id/photos/:photoId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'Delete one photo from an editable owned animal sighting.' })
  deletePhoto(
    @CurrentUser() user: AuthenticatedUser | undefined,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('photoId', ParseUUIDPipe) photoId: string,
    @Req() request: Request,
  ): Promise<{ success: true }> {
    return this.sightings.deletePhoto(
      this.requireUser(user),
      id,
      photoId,
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
