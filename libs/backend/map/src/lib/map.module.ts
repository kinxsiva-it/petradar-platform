import { Module } from '@nestjs/common';

import { PrismaModule } from '@petradar/backend/shared';

import { MapController } from './map.controller.js';
import { MapService } from './map.service.js';

@Module({
  controllers: [MapController],
  imports: [PrismaModule],
  providers: [MapService],
})
export class MapModule {}
