import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

import { apiRateLimits } from '@petradar/backend/shared';

import { HeatmapQueryDto, MapSightingsQueryDto, NearbyQueryDto } from './dto/map-query.dto.js';
import { MapService } from './map.service.js';

@ApiTags('map')
@Controller('map')
export class MapController {
  constructor(private readonly map: MapService) {}

  @Get('sightings')
  @Throttle(apiRateLimits.publicRead)
  @ApiOkResponse({ description: 'Return public-safe lightweight sighting markers.' })
  sightings(@Query() query: MapSightingsQueryDto): ReturnType<MapService['sightings']> {
    return this.map.sightings(query);
  }

  @Get('heatmap')
  @Throttle(apiRateLimits.publicRead)
  @ApiOkResponse({ description: 'Return aggregated public-safe heatmap cells.' })
  heatmap(@Query() query: HeatmapQueryDto): ReturnType<MapService['heatmap']> {
    return this.map.heatmap(query);
  }

  @Get('nearby')
  @Throttle(apiRateLimits.publicRead)
  @ApiOkResponse({ description: 'Return nearby public-safe sighting markers with meter distances.' })
  nearby(@Query() query: NearbyQueryDto): ReturnType<MapService['nearby']> {
    return this.map.nearby(query);
  }
}
