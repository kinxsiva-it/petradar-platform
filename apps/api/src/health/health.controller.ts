import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';

interface HealthResponse {
  service: 'petradar-api';
  status: 'ok';
  timestamp: string;
}

@ApiTags('health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOkResponse({ description: 'API health status.' })
  getHealth(): HealthResponse {
    return {
      service: 'petradar-api',
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
