import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

import { JwtAuthGuard, Roles, RolesGuard } from '@petradar/backend/auth';

import { AnalyticsService } from './analytics.service.js';

@ApiTags('analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  @Get('summary')
  @ApiOkResponse({ description: 'Return aggregate operational totals.' })
  summary(): ReturnType<AnalyticsService['summary']> {
    return this.analytics.summary();
  }

  @Get('by-species')
  @ApiOkResponse({ description: 'Return sighting counts grouped by species.' })
  bySpecies(): ReturnType<AnalyticsService['bySpecies']> {
    return this.analytics.bySpecies();
  }

  @Get('by-status')
  @ApiOkResponse({ description: 'Return status counts grouped by domain.' })
  byStatus(): ReturnType<AnalyticsService['byStatus']> {
    return this.analytics.byStatus();
  }

  @Get('hotspots')
  @ApiOkResponse({ description: 'Return privacy-preserving geographic hotspot aggregates.' })
  hotspots(): ReturnType<AnalyticsService['hotspots']> {
    return this.analytics.hotspots();
  }
}
