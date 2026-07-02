import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';

import { CurrentUser, JwtAuthGuard, type AuthenticatedUser } from '@petradar/backend/auth';
import { MatchingService } from '@petradar/backend/matching';

import { CreateLostPetDto, ListLostPetsQueryDto, UpdateLostPetDto } from './dto/lost-pet.dto.js';
import { LostPetsService } from './lost-pets.service.js';

@ApiTags('lost-pets')
@Controller('lost-pets')
export class LostPetsController {
  constructor(
    private readonly lostPets: LostPetsService,
    private readonly matching: MatchingService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiCreatedResponse({ description: 'Create an owned lost-pet post.' })
  create(
    @CurrentUser() user: AuthenticatedUser | undefined,
    @Body() body: CreateLostPetDto,
  ): ReturnType<LostPetsService['create']> {
    return this.lostPets.create(this.requireUser(user), body);
  }

  @Get()
  @ApiOkResponse({ description: 'List public lost-pet posts with approximate last-seen locations.' })
  list(@Query() query: ListLostPetsQueryDto): ReturnType<LostPetsService['list']> {
    return this.lostPets.list(query);
  }

  @Get('mine')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'Return lost-pet posts owned by the authenticated user.' })
  listMine(
    @CurrentUser() user: AuthenticatedUser | undefined,
    @Query() query: ListLostPetsQueryDto,
  ): ReturnType<LostPetsService['listMine']> {
    return this.lostPets.listMine(this.requireUser(user), query);
  }

  @Get('mine/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'Return one accessible lost-pet post with private owner fields.' })
  myDetail(
    @CurrentUser() user: AuthenticatedUser | undefined,
    @Param('id', ParseUUIDPipe) id: string,
  ): ReturnType<LostPetsService['findAuthorized']> {
    return this.lostPets.findAuthorized(this.requireUser(user), id);
  }

  @Get(':id')
  @ApiOkResponse({ description: 'Return one public lost-pet post.' })
  detail(@Param('id', ParseUUIDPipe) id: string): ReturnType<LostPetsService['findPublic']> {
    return this.lostPets.findPublic(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'Update an owned lost-pet post.' })
  update(
    @CurrentUser() user: AuthenticatedUser | undefined,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateLostPetDto,
  ): ReturnType<LostPetsService['update']> {
    return this.lostPets.update(this.requireUser(user), id, body);
  }

  @Post(':id/run-matching')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'Run MVP rule-based matching for an owned lost-pet post.' })
  runMatching(
    @CurrentUser() user: AuthenticatedUser | undefined,
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: Request,
  ): ReturnType<MatchingService['runForLostPet']> {
    return this.matching.runForLostPet(this.requireUser(user), id, request.header('x-request-id'));
  }

  @Get(':id/matches')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'Return match results for an owned lost-pet post.' })
  matches(
    @CurrentUser() user: AuthenticatedUser | undefined,
    @Param('id', ParseUUIDPipe) id: string,
  ): ReturnType<MatchingService['listForLostPet']> {
    return this.matching.listForLostPet(this.requireUser(user), id);
  }

  private requireUser(user: AuthenticatedUser | undefined): AuthenticatedUser {
    if (!user) {
      throw new UnauthorizedException('Authentication required.');
    }
    return user;
  }
}
