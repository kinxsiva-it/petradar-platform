import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

import {
  CurrentUser,
  JwtAuthGuard,
  Roles,
  RolesGuard,
  type AuthenticatedUser,
} from '@petradar/backend/auth';

import {
  AssignVolunteerDto,
  CreateInternalNoteDto,
  CreateRescueCaseDto,
  ListRescueCasesQueryDto,
  UpdateRescueStatusDto,
} from './dto/rescue-cases.dto.js';
import { RescueCasesService } from './rescue-cases.service.js';

@ApiTags('rescue-cases')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('rescue-cases')
export class RescueCasesController {
  constructor(private readonly rescueCases: RescueCasesService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiCreatedResponse({ description: 'Create a rescue case.' })
  create(
    @CurrentUser() user: AuthenticatedUser | undefined,
    @Body() body: CreateRescueCaseDto,
  ): ReturnType<RescueCasesService['create']> {
    return this.rescueCases.create(this.requireUser(user), body);
  }

  @Get()
  @ApiOkResponse({ description: 'List Admin or assigned-volunteer rescue cases.' })
  list(
    @CurrentUser() user: AuthenticatedUser | undefined,
    @Query() query: ListRescueCasesQueryDto,
  ): ReturnType<RescueCasesService['list']> {
    return this.rescueCases.list(this.requireUser(user), query);
  }

  @Get(':id')
  @ApiOkResponse({ description: 'Return one accessible rescue case.' })
  detail(
    @CurrentUser() user: AuthenticatedUser | undefined,
    @Param('id', ParseUUIDPipe) id: string,
  ): ReturnType<RescueCasesService['detail']> {
    return this.rescueCases.detail(this.requireUser(user), id);
  }

  @Patch(':id/status')
  @ApiOkResponse({ description: 'Transition rescue case status.' })
  updateStatus(
    @CurrentUser() user: AuthenticatedUser | undefined,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateRescueStatusDto,
  ): ReturnType<RescueCasesService['updateStatus']> {
    return this.rescueCases.updateStatus(this.requireUser(user), id, body);
  }

  @Post(':id/assign-volunteer')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOkResponse({ description: 'Assign a volunteer to a rescue case.' })
  assignVolunteer(
    @CurrentUser() user: AuthenticatedUser | undefined,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: AssignVolunteerDto,
  ): ReturnType<RescueCasesService['assignVolunteer']> {
    return this.rescueCases.assignVolunteer(this.requireUser(user), id, body);
  }

  @Post(':id/notes')
  @ApiCreatedResponse({ description: 'Add an internal rescue note.' })
  addNote(
    @CurrentUser() user: AuthenticatedUser | undefined,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: CreateInternalNoteDto,
  ): ReturnType<RescueCasesService['addNote']> {
    return this.rescueCases.addNote(this.requireUser(user), id, body);
  }

  @Get(':id/timeline')
  @ApiOkResponse({ description: 'Return protected rescue case timeline.' })
  timeline(
    @CurrentUser() user: AuthenticatedUser | undefined,
    @Param('id', ParseUUIDPipe) id: string,
  ): ReturnType<RescueCasesService['timeline']> {
    return this.rescueCases.timeline(this.requireUser(user), id);
  }

  private requireUser(user: AuthenticatedUser | undefined): AuthenticatedUser {
    if (!user) {
      throw new UnauthorizedException('Authentication required.');
    }
    return user;
  }
}
