import { Module } from '@nestjs/common';

import { AuditModule } from '@petradar/backend/audit';
import { BackendAuthModule } from '@petradar/backend/auth';
import { LocationPrivacyService, PrismaModule } from '@petradar/backend/shared';

import { SightingsController } from './sightings.controller.js';
import { SightingsRepository } from './sightings.repository.js';
import { SightingsService } from './sightings.service.js';
import { sightingPhotoStorageProvider } from './photos/sighting-photo-storage.provider.js';
import { SightingPhotoValidationService } from './photos/sighting-photo-validation.js';

@Module({
  controllers: [SightingsController],
  exports: [SightingsRepository, SightingsService],
  imports: [AuditModule, BackendAuthModule, PrismaModule],
  providers: [
    LocationPrivacyService,
    SightingPhotoValidationService,
    sightingPhotoStorageProvider,
    SightingsRepository,
    SightingsService,
  ],
})
export class SightingsModule {}
