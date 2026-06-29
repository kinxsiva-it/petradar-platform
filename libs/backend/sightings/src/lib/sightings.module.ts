import { Module } from '@nestjs/common';

import { LocationPrivacyService, PrismaModule } from '@petradar/backend/shared';

import { SightingsRepository } from './sightings.repository.js';

@Module({
  exports: [SightingsRepository],
  imports: [PrismaModule],
  providers: [LocationPrivacyService, SightingsRepository],
})
export class SightingsModule {}
